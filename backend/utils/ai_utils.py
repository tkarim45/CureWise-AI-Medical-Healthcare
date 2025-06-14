from models.schemas import *
from config.settings import settings
from utils.agents import appointment_booking_agent
import os
from utils.parser import *
from utils.agents import *
import numpy as np
from PIL import Image
from tensorflow.keras.models import load_model
import tensorflow as tf
import gc
from utils.custom_layers import EncoderBlock, DecoderBlock, AttentionGate
from keras.metrics import MeanIoU
import base64
import io

kidney_model = None  # Add this line at the top-level
breast_cancer_model = None


def get_kidney_model():
    global kidney_model
    if kidney_model is None:
        # Force TensorFlow to use CPU to avoid Metal plugin issues on M1
        os.environ["TF_FORCE_GPU_ALLOW_GROWTH"] = "true"
        tf.config.set_visible_devices([], "GPU")
        gc.collect()
        if not os.path.exists(settings.KIDNEY_MODEL_PATH):
            raise FileNotFoundError(
                f"Model file not found at {settings.KIDNEY_MODEL_PATH}"
            )
        kidney_model = load_model(settings.KIDNEY_MODEL_PATH, compile=False)
    return kidney_model


def predict_kidney_image(image_file):
    class_labels = ["Cyst", "Normal", "Stone"]
    try:
        image = Image.open(image_file).convert("RGB")
        image = image.resize((28, 28))
        image = np.array(image, dtype=np.float32) / 255.0
        image = np.expand_dims(image, axis=0)
        model = get_kidney_model()
        predictions = model.predict(image, verbose=0)
        predicted_class = int(np.argmax(predictions[0]))
        predicted_label = class_labels[predicted_class]
        confidence = float(np.max(predictions[0]))
        return {"predicted_class": predicted_label, "confidence": confidence}
    except Exception as e:
        logger.error(f"Error in kidney image prediction: {e}")
        return {"error": str(e)}


def get_breast_cancer_model():
    global breast_cancer_model
    if breast_cancer_model is None:
        os.environ["TF_FORCE_GPU_ALLOW_GROWTH"] = "true"
        tf.config.set_visible_devices([], "GPU")
        gc.collect()
        model_path = settings.BREAST_CANCER_MODEL_PATH
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found at {model_path}")
        breast_cancer_model = load_model(
            model_path,
            compile=False,
            custom_objects={
                "EncoderBlock": EncoderBlock,
                "DecoderBlock": DecoderBlock,
                "AttentionGate": AttentionGate,
                "MeanIoU": MeanIoU,
            },
        )
    return breast_cancer_model


def predict_breast_cancer_image(image_file):
    class_labels = ["Benign", "Malignant"]
    try:
        image = Image.open(image_file).convert("RGB")
        model = get_breast_cancer_model()
        # Get model input shape (excluding batch dim)
        input_shape = model.input_shape[1:4]  # (height, width, channels)
        # Use tensorflow.image.resize for robust resizing
        image_np = np.array(image, dtype=np.float32) / 255.0
        image_resized = tf.image.resize(image_np, (input_shape[0], input_shape[1]))
        # Always convert to numpy array (handles both tf.Tensor and np.ndarray)
        if hasattr(image_resized, "numpy"):
            image_resized = image_resized.numpy()
        image_resized = np.round(image_resized, 4)
        image_batch = np.expand_dims(image_resized, axis=0)
        predictions = model.predict(image_batch, verbose=0)
        # Generate 4 images: original, predicted mask, processed mask, overlay
        # 1. Original image
        orig_img = (image_resized * 255).astype(np.uint8)
        orig_img_pil = Image.fromarray(orig_img)
        # 2. Predicted mask (jet colormap)
        pred_mask = predictions[0]
        pred_mask_img = (pred_mask > 0.5).astype(np.float32)
        pred_mask_rgb = np.repeat(pred_mask_img, 3, axis=-1)
        pred_mask_pil = Image.fromarray((pred_mask_rgb * 255).astype(np.uint8))
        # 3. Processed mask (gray colormap)
        processed_mask_pil = Image.fromarray(
            (pred_mask_img[:, :, 0] * 255).astype(np.uint8), mode="L"
        ).convert("RGB")
        # 4. Overlay
        overlay = orig_img.copy()
        overlay[..., 0] = np.maximum(
            overlay[..., 0], (pred_mask_img[:, :, 0] * 255).astype(np.uint8)
        )
        overlay_pil = Image.fromarray(overlay)

        # Convert all images to base64
        def pil_to_base64(img):
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            return base64.b64encode(buf.getvalue()).decode("utf-8")

        return {
            "images": [
                pil_to_base64(orig_img_pil),
                pil_to_base64(pred_mask_pil),
                pil_to_base64(processed_mask_pil),
                pil_to_base64(overlay_pil),
            ],
            "predicted_class": "Mask",
        }
    except Exception as e:
        import logging

        logging.getLogger("utils.ai_utils").error(
            f"Error in breast cancer image prediction: {e}"
        )
        return {"error": str(e)}
