"""Retrain the pneumonia chest-X-ray classifier for CureWise.

The original weight fails to deserialize on modern TensorFlow (old save
format). This retrains a fresh MobileNetV2 transfer model on
`hf-vision/chest-xray-pneumonia` (HuggingFace), matching the registry's
label order ["NORMAL", "PNEUMONIA"] and its plain image/255 preprocessing.

Run:  ~/miniconda3/envs/personal/bin/python backend/ml_training/train_pneumonia.py
Saves: backend/weights/pneumonia/pneumonia.h5
"""

import os
from pathlib import Path

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

import numpy as np
import tensorflow as tf
from datasets import load_dataset

tf.config.set_visible_devices([], "GPU")

BACKEND = Path(__file__).resolve().parents[1]
OUT_DIR = BACKEND / "weights" / "pneumonia"
OUT_DIR.mkdir(parents=True, exist_ok=True)
MODEL_PATH = OUT_DIR / "pneumonia.h5"

IMG = 224
LABELS = ["NORMAL", "PNEUMONIA"]  # registry order


def load_arrays():
    ds = load_dataset("hf-vision/chest-xray-pneumonia", split="train")
    names = ds.features["label"].names  # dataset's own class order
    # map dataset index -> registry index by (case-insensitive) name
    remap = {}
    for di, dn in enumerate(names):
        for ri, rn in enumerate(LABELS):
            if rn.lower() in dn.lower():
                remap[di] = ri
    print("dataset label names:", names, "-> remap:", remap, flush=True)

    ds = ds.shuffle(seed=42)
    n = len(ds)
    X = np.zeros((n, IMG, IMG, 3), dtype=np.uint8)
    y = np.zeros(n, dtype=np.int64)
    for i, ex in enumerate(ds):
        X[i] = np.asarray(ex["image"].convert("RGB").resize((IMG, IMG)), dtype=np.uint8)
        y[i] = remap.get(int(ex["label"]), int(ex["label"]))
        if i % 1000 == 0:
            print(f"  loaded {i}/{n}", flush=True)
    return X, y


def make_ds(X, y, training):
    d = tf.data.Dataset.from_tensor_slices((X, y))
    if training:
        d = d.shuffle(2048)
    d = d.map(lambda a, b: (tf.cast(a, tf.float32) / 255.0, b),
              num_parallel_calls=tf.data.AUTOTUNE)
    return d.batch(32).prefetch(tf.data.AUTOTUNE)


def build_model():
    inp = tf.keras.Input((IMG, IMG, 3))
    x = tf.keras.layers.Rescaling(2.0, offset=-1.0)(inp)
    base = tf.keras.applications.MobileNetV2(include_top=False, weights="imagenet",
                                             input_tensor=x)
    base.trainable = False
    x = tf.keras.layers.GlobalAveragePooling2D()(base.output)
    x = tf.keras.layers.Dropout(0.3)(x)
    out = tf.keras.layers.Dense(len(LABELS), activation="softmax")(x)
    m = tf.keras.Model(inp, out)
    m.compile(optimizer=tf.keras.optimizers.Adam(1e-3),
              loss="sparse_categorical_crossentropy", metrics=["accuracy"])
    return m


def main():
    X, y = load_arrays()
    split = int(len(X) * 0.85)
    Xtr, ytr, Xva, yva = X[:split], y[:split], X[split:], y[split:]
    print(f"train {len(Xtr)}  val {len(Xva)}", flush=True)
    model = build_model()
    model.fit(make_ds(Xtr, ytr, True), validation_data=make_ds(Xva, yva, False),
              epochs=5,
              callbacks=[tf.keras.callbacks.ReduceLROnPlateau(patience=1, factor=0.3)],
              verbose=2)
    acc = float(model.evaluate(make_ds(Xva, yva, False), verbose=0)[1])
    print(f"VAL accuracy: {acc:.4f}", flush=True)
    model.save(MODEL_PATH)
    print(f"SAVED {MODEL_PATH}", flush=True)


if __name__ == "__main__":
    main()
