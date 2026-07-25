"""Evaluate the breast-cancer segmentation U-Net on a sample image.

Converted from notebooks/BreastCancer.ipynb. That notebook was inference-only:
it defined the custom layers only to LOAD the pre-trained segmentation model,
predicted a mask, and visualized it. No training code to port. Paths fixed to
weights/ + data/samples/; visualization is headless (saves an overlay PNG
instead of plt.show).

Run:  ~/miniconda3/envs/personal/bin/python backend/ml_training/eval_breast_cancer.py [image]
"""

import os
import sys
from pathlib import Path

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
os.environ.setdefault("CUDA_VISIBLE_DEVICES", "")

import numpy as np
import tensorflow as tf
from PIL import Image

tf.config.set_visible_devices([], "GPU")
from keras.metrics import MeanIoU  # noqa: E402
from tensorflow.keras.models import load_model  # noqa: E402

# The registry already ships these custom layers; reuse them so there's a
# single definition rather than a copy.
import sys as _sys
_sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from src.features.disease_detection.custom_layers import (  # noqa: E402
    AttentionGate,
    DecoderBlock,
    EncoderBlock,
)

BACKEND = Path(__file__).resolve().parents[1]
MODEL_PATH = BACKEND / "weights" / "breast-cancer" / "breast_cancer.h5"
SAMPLES = BACKEND / "data" / "samples" / "breast-cancer"
SIZE = 256


def evaluate(path, out_dir):
    img = Image.open(path).convert("RGB")
    arr = np.asarray(img, dtype=np.float32) / 255.0
    resized = np.round(tf.image.resize(arr, (SIZE, SIZE)).numpy(), 4)

    model = load_model(
        str(MODEL_PATH),
        compile=False,
        custom_objects={
            "EncoderBlock": EncoderBlock,
            "DecoderBlock": DecoderBlock,
            "AttentionGate": AttentionGate,
            "MeanIoU": MeanIoU,
        },
    )
    pred = model.predict(resized[None], verbose=0)[0]
    mask = (pred > 0.5).astype(np.float32)
    coverage = float(mask.mean()) * 100

    # Headless overlay: red mask on the original.
    orig = (resized * 255).astype(np.uint8)
    overlay = orig.copy()
    overlay[..., 0] = np.maximum(overlay[..., 0], (mask[:, :, 0] * 255).astype(np.uint8))
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / f"{Path(path).stem}_overlay.png"
    Image.fromarray(overlay).save(out)
    return coverage, out


def main():
    imgs = sorted([*SAMPLES.glob("*.png"), *SAMPLES.glob("*.jpg"), *SAMPLES.glob("*.jpeg")])
    targets = [sys.argv[1]] if len(sys.argv) > 1 else [str(i) for i in imgs]
    if not targets:
        print("No sample image. Pass a path or add one under", SAMPLES)
        return
    out_dir = BACKEND / "ml_training" / "_eval_out"
    for t in targets:
        cov, out = evaluate(t, out_dir)
        print(f"{Path(t).name:26} -> mask coverage {cov:.2f}%  overlay: {out.name}")


if __name__ == "__main__":
    main()
