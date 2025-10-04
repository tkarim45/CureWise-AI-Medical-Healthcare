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
from tensorflow.keras.preprocessing import image as keras_image
import google.generativeai as genai

kidney_model = None  # Add this line at the top-level
breast_cancer_model = None
lymphoma_model = None
pneumonia_model = None
eye_disease_model = None


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


def get_lymphoma_model():
    global lymphoma_model
    if lymphoma_model is None:
        model_path = settings.LYMPHOMA_MODEL_PATH
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found at {model_path}")
        lymphoma_model = load_model(model_path)
    return lymphoma_model


def predict_lymphoma(image_file):
    class_labels = ["lymph_cll", "lymph_fl", "lymph_mcl"]
    try:
        # Read image from file-like object
        img = keras_image.load_img(image_file, target_size=(224, 224))
        img_array = keras_image.img_to_array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        model = get_lymphoma_model()
        prediction = model.predict(img_array)[0]
        predicted_index = int(np.argmax(prediction))
        predicted_label = class_labels[predicted_index]
        confidence = float(prediction[predicted_index]) * 100
        return {"predicted_class": predicted_label, "confidence": confidence}
    except Exception as e:
        import logging

        logging.getLogger("utils.ai_utils").error(
            f"Error in lymphoma image prediction: {e}"
        )
        return {"error": str(e)}


def get_pneumonia_model():
    global pneumonia_model
    if pneumonia_model is None:
        model_path = settings.PNEUMONIA_MODEL_PATH
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found at {model_path}")
        pneumonia_model = load_model(model_path)
    return pneumonia_model


def predict_pneumonia(image_file):
    class_labels = ["NORMAL", "PNEUMONIA"]
    try:
        img = keras_image.load_img(image_file, target_size=(224, 224))
        img_array = keras_image.img_to_array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        model = get_pneumonia_model()
        prediction = model.predict(img_array)[0]
        predicted_index = int(np.argmax(prediction))
        predicted_label = class_labels[predicted_index]
        confidence = float(prediction[predicted_index]) * 100
        return {"predicted_class": predicted_label, "confidence": confidence}
    except Exception as e:
        import logging

        logging.getLogger("utils.ai_utils").error(
            f"Error in pneumonia image prediction: {e}"
        )
        return {"error": str(e)}


def get_eye_disease_model():
    global eye_disease_model
    if eye_disease_model is None:
        model_path = settings.EYE_DISEASE_MODEL_PATH
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found at {model_path}")
        eye_disease_model = load_model(model_path)
    return eye_disease_model


def predict_eye_disease(image_file):
    """
    Placeholder function for eye disease prediction.
    Implement the actual model loading and prediction logic here.
    """
    # This function should be implemented similarly to the other models
    class_labels = ["Bulging_Eyes", "Cataracts", "Crossed_Eyes", "Glaucoma", "Uveitis"]

    try:
        img = keras_image.load_img(image_file, target_size=(224, 224))
        img_array = keras_image.img_to_array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        model = get_eye_disease_model()
        prediction = model.predict(img_array)[0]
        predicted_index = int(np.argmax(prediction))
        predicted_label = class_labels[predicted_index]
        confidence = float(prediction[predicted_index]) * 100
        return {"predicted_class": predicted_label, "confidence": confidence}
    except Exception as e:
        import logging

        logging.getLogger("utils.ai_utils").error(
            f"Error in eye disease image prediction: {e}"
        )
        return {"error": str(e)}


async def generate_groq_response(prompt: str, system_prompt: str = None):
    try:
        from config.settings import settings
        from groq import Groq

        full_prompt = f"{system_prompt}\n\nUser query: {prompt}\n\nResponse:"

        # Initialize Groq client
        client = Groq(api_key=settings.GROQ_API_KEY)

        # Call Groq API
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": full_prompt,
                }
            ],
            model="llama-3.3-70b-versatile",
            stream=False,
        )

        # Extract the response
        response = chat_completion.choices[0].message.content
        if not response:
            raise Exception("No content in Groq API response")

        # Clean the response
        cleaned_response = response.strip()
        cleaned_response = re.sub(
            r"^(assistant:|[\[\{]?(ANSWER|RESPONSE)[\]\}]?:?\s*)",
            "",
            cleaned_response,
            flags=re.IGNORECASE,
        )
        cleaned_response = re.sub(
            r"```(?:json)?\s*(.*?)\s*```", r"\1", cleaned_response, flags=re.DOTALL
        )
        cleaned_response = re.sub(r"\s*(</s>|[EOT]|\[.*?\])$", "", cleaned_response)

        return cleaned_response.strip()
    except Exception as e:
        logger.error(f"Error generating response: {e}")
        raise Exception(f"Failed to generate response: {e}")
