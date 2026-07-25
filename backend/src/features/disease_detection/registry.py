"""Lazy TensorFlow model loading + inference.

Models are large (7 MB - 530 MB) so they are loaded on first use and cached for
the process lifetime, never all at once. TensorFlow is pinned to CPU to avoid
Apple-Metal plugin issues.
"""

import base64
import io
import logging
import os

import numpy as np
from PIL import Image

from src.features.disease_detection.specs import ClassifierSpec

logger = logging.getLogger(__name__)

_MODELS: dict[str, object] = {}


def _configure_tf_cpu() -> None:
    import tensorflow as tf

    os.environ.setdefault("TF_FORCE_GPU_ALLOW_GROWTH", "true")
    try:
        tf.config.set_visible_devices([], "GPU")
    except Exception:  # noqa: BLE001 - already configured
        pass


def load(spec: ClassifierSpec):
    if spec.key in _MODELS:
        return _MODELS[spec.key]

    if not os.path.exists(spec.model_path):
        raise FileNotFoundError(f"Model weights not found: {spec.model_path}")

    _configure_tf_cpu()
    from tensorflow.keras.models import load_model

    custom_objects = None
    if spec.custom_objects:
        from keras.metrics import MeanIoU

        from src.features.disease_detection.custom_layers import (
            AttentionGate,
            DecoderBlock,
            EncoderBlock,
        )

        custom_objects = {
            "EncoderBlock": EncoderBlock,
            "DecoderBlock": DecoderBlock,
            "AttentionGate": AttentionGate,
            "MeanIoU": MeanIoU,
        }

    logger.info("Loading model '%s' from %s", spec.key, spec.model_path)
    model = load_model(spec.model_path, compile=False, custom_objects=custom_objects)
    _MODELS[spec.key] = model
    return model


def predict_classification(spec: ClassifierSpec, image_bytes: bytes) -> dict:
    model = load(spec)
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    if spec.input_size:
        image = image.resize(spec.input_size)
    arr = np.asarray(image, dtype=np.float32) / 255.0
    arr = np.expand_dims(arr, axis=0)

    preds = np.asarray(model.predict(arr, verbose=0)[0], dtype=np.float64)
    # Some legacy models don't end in a softmax; normalize to a probability
    # distribution so confidence stays within 0-100%.
    if preds.min() < 0 or not np.isclose(preds.sum(), 1.0, atol=1e-2):
        e = np.exp(preds - preds.max())
        preds = e / e.sum()
    idx = int(np.argmax(preds))
    return {
        "predicted_class": spec.labels[idx],
        "confidence": round(float(preds[idx]) * 100, 2),
    }


def predict_segmentation(spec: ClassifierSpec, image_bytes: bytes) -> dict:
    """Breast-cancer U-Net: returns 4 base64 PNGs (original, mask, processed, overlay)."""
    import tensorflow as tf

    model = load(spec)
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    h, w = model.input_shape[1:3]
    arr = np.asarray(image, dtype=np.float32) / 255.0
    resized = tf.image.resize(arr, (h, w)).numpy()
    resized = np.round(resized, 4)
    preds = model.predict(np.expand_dims(resized, 0), verbose=0)[0]

    orig = (resized * 255).astype(np.uint8)
    mask = (preds > 0.5).astype(np.float32)
    mask_rgb = np.repeat(mask, 3, axis=-1)
    overlay = orig.copy()
    overlay[..., 0] = np.maximum(overlay[..., 0], (mask[:, :, 0] * 255).astype(np.uint8))

    def to_b64(a: np.ndarray, mode: str = "RGB") -> str:
        buf = io.BytesIO()
        Image.fromarray(a, mode=mode).save(buf, format="PNG")
        return base64.b64encode(buf.getvalue()).decode("utf-8")

    return {
        "predicted_class": "Mask",
        "images": [
            to_b64(orig),
            to_b64((mask_rgb * 255).astype(np.uint8)),
            to_b64((mask[:, :, 0] * 255).astype(np.uint8), mode="L"),
            to_b64(overlay),
        ],
    }
