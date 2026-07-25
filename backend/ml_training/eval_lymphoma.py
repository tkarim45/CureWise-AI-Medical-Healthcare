"""Evaluate the lymphoma classifier on a sample image.

Converted from notebooks/Lymphoma.ipynb (inference-only; no training code to
port). Paths fixed to weights/ + data/samples/.

Run:  ~/miniconda3/envs/personal/bin/python backend/ml_training/eval_lymphoma.py [image]
"""

import os
import sys
from pathlib import Path

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

import numpy as np
import tensorflow as tf
from PIL import Image

tf.config.set_visible_devices([], "GPU")
from tensorflow.keras.models import load_model  # noqa: E402

BACKEND = Path(__file__).resolve().parents[1]
MODEL_PATH = BACKEND / "weights" / "lymphoma" / "lymphoma.h5"
SAMPLES = BACKEND / "data" / "samples" / "lymphoma"
SIZE = (224, 224)
LABELS = ["lymph_cll", "lymph_fl", "lymph_mcl"]


def predict(path):
    img = Image.open(path).convert("RGB").resize(SIZE)
    arr = (np.asarray(img, dtype=np.float32) / 255.0)[None]
    model = load_model(str(MODEL_PATH), compile=False)
    p = model.predict(arr, verbose=0)[0]
    i = int(np.argmax(p))
    return LABELS[i], float(p[i]) * 100


def main():
    imgs = sorted([*SAMPLES.glob("*.jpg"), *SAMPLES.glob("*.jpeg"), *SAMPLES.glob("*.png")])
    targets = [sys.argv[1]] if len(sys.argv) > 1 else [str(i) for i in imgs]
    if not targets:
        print("No sample image. Pass a path or add one under", SAMPLES)
        return
    for t in targets:
        label, conf = predict(t)
        print(f"{Path(t).name:24} -> {label} ({conf:.2f}%)")


if __name__ == "__main__":
    main()
