"""Train the bone-fracture X-ray classifier for CureWise.

Dataset: Hemg/bone-fracture-detection (HuggingFace) — 8,863 images, 224x224,
balanced binary {fractured, not fractured}.

Transfer learning on MobileNetV2 (ImageNet). Preprocessing ([0,1] -> [-1,1])
is baked into the model as a Rescaling layer, so the served model can be fed
the registry's plain image/255 without a preprocessing mismatch.

Run:  ~/miniconda3/envs/personal/bin/python backend/ml_training/train_fracture.py
Saves: backend/data/fracture/fracture_model.h5
"""

import os
from pathlib import Path

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

import numpy as np
import tensorflow as tf
from datasets import load_dataset

tf.config.set_visible_devices([], "GPU")  # M1 Metal instability; train on CPU

BACKEND = Path(__file__).resolve().parents[1]
OUT_DIR = BACKEND / "weights" / "fracture"
OUT_DIR.mkdir(parents=True, exist_ok=True)
MODEL_PATH = OUT_DIR / "fracture_model.h5"

IMG = 224
CLASSES = ["fractured", "not fractured"]


def load_arrays():
    ds = load_dataset("Hemg/bone-fracture-detection", split="train")
    ds = ds.shuffle(seed=42)
    n = len(ds)
    X = np.zeros((n, IMG, IMG, 3), dtype=np.uint8)
    y = np.array(ds["label"], dtype=np.int64)
    for i, ex in enumerate(ds):
        img = ex["image"].convert("RGB").resize((IMG, IMG))
        X[i] = np.asarray(img, dtype=np.uint8)
        if i % 1500 == 0:
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
    # Served input is [0,1]; MobileNetV2 wants [-1,1].
    x = tf.keras.layers.Rescaling(2.0, offset=-1.0)(inp)
    base = tf.keras.applications.MobileNetV2(
        include_top=False, weights="imagenet", input_tensor=x
    )
    base.trainable = False
    x = tf.keras.layers.GlobalAveragePooling2D()(base.output)
    x = tf.keras.layers.Dropout(0.3)(x)
    out = tf.keras.layers.Dense(len(CLASSES), activation="softmax")(x)
    model = tf.keras.Model(inp, out)
    model.compile(optimizer=tf.keras.optimizers.Adam(1e-3),
                  loss="sparse_categorical_crossentropy", metrics=["accuracy"])
    return model


def main():
    print("Loading dataset...", flush=True)
    X, y = load_arrays()
    n = len(X)
    split = int(n * 0.85)
    Xtr, ytr, Xva, yva = X[:split], y[:split], X[split:], y[split:]
    print(f"train {len(Xtr)}  val {len(Xva)}", flush=True)

    model = build_model()
    model.fit(
        make_ds(Xtr, ytr, True),
        validation_data=make_ds(Xva, yva, False),
        epochs=5,
        callbacks=[tf.keras.callbacks.ReduceLROnPlateau(patience=1, factor=0.3)],
        verbose=2,
    )

    loss, acc = model.evaluate(make_ds(Xva, yva, False), verbose=0)
    print(f"VAL accuracy: {acc:.4f}", flush=True)

    model.save(MODEL_PATH)
    print(f"SAVED {MODEL_PATH}", flush=True)

    # Sanity prediction on a val image.
    probe = (Xva[0].astype("float32") / 255.0)[None]
    p = model.predict(probe, verbose=0)[0]
    print(f"probe pred: {CLASSES[int(np.argmax(p))]}  conf {float(np.max(p))*100:.1f}%"
          f"  (true {CLASSES[int(yva[0])]})", flush=True)


if __name__ == "__main__":
    main()
