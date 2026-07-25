"""Evaluate the kidney-CT classifier on a sample image.

Converted from notebooks/KidneyDisease.ipynb. That notebook was inference-only
(it loaded a pre-trained .h5 and predicted a single image); there was no
training code to port. Paths are fixed to the repo's weights/ + data/samples/.

Run:  ~/miniconda3/envs/personal/bin/python backend/ml_training/eval_kidney.py [image]
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
MODEL_PATH = BACKEND / "weights" / "kidney" / "kidney_ct_model.h5"
SAMPLES = BACKEND / "data" / "samples" / "kidney"
SIZE = (28, 28)
LABELS = ["Cyst", "Normal", "Stone"]


def predict(path):
    img = Image.open(path).convert("RGB").resize(SIZE)
    arr = (np.asarray(img, dtype=np.float32) / 255.0)[None]
    model = load_model(str(MODEL_PATH), compile=False)
    p = model.predict(arr, verbose=0)[0]
    i = int(np.argmax(p))
    return LABELS[i], float(np.max(p)) * 100


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
