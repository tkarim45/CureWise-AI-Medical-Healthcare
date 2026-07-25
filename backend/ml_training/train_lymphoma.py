"""Retrain the lymphoma histopathology classifier for CureWise.

The original weight fails to deserialize on modern TensorFlow. This retrains a
MobileNetV2 transfer model on `andrewmvd/malignant-lymphoma-classification`
(Kaggle), a 3-class set (CLL / FL / MCL), mapped to the registry's label order
["lymph_cll", "lymph_fl", "lymph_mcl"] with plain image/255 preprocessing.

Env DATA_DIR must point at the unzipped dataset dir (contains per-class folders).
Saves: backend/weights/lymphoma/lymphoma.h5
"""

import glob
import os
from pathlib import Path

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

import numpy as np
import tensorflow as tf
from PIL import Image

tf.config.set_visible_devices([], "GPU")

BACKEND = Path(__file__).resolve().parents[1]
OUT_DIR = BACKEND / "weights" / "lymphoma"
OUT_DIR.mkdir(parents=True, exist_ok=True)
MODEL_PATH = OUT_DIR / "lymphoma.h5"
DATA_DIR = os.environ["DATA_DIR"]

IMG = 224
LABELS = ["lymph_cll", "lymph_fl", "lymph_mcl"]


def _label_for(dirname):
    n = dirname.lower()
    if "cll" in n:
        return 0
    if "mcl" in n:
        return 2
    if "fl" in n:
        return 1
    return None


def load_arrays():
    # every leaf dir that contains images is a class folder
    exts = ("*.tif", "*.tiff", "*.jpg", "*.jpeg", "*.png")
    files = []
    for ext in exts:
        files += glob.glob(os.path.join(DATA_DIR, "**", ext), recursive=True)
    X, y = [], []
    for i, f in enumerate(files):
        lab = _label_for(Path(f).parent.name)
        if lab is None:
            continue
        try:
            im = Image.open(f).convert("RGB").resize((IMG, IMG))
        except Exception:
            continue
        X.append(np.asarray(im, dtype=np.uint8))
        y.append(lab)
        if i % 100 == 0:
            print(f"  loaded {i}/{len(files)}", flush=True)
    X = np.asarray(X, dtype=np.uint8)
    y = np.asarray(y, dtype=np.int64)
    from collections import Counter
    print(f"loaded {len(X)}  class counts {dict(Counter(y.tolist()))}", flush=True)
    return X, y


def make_ds(X, y, training):
    d = tf.data.Dataset.from_tensor_slices((X, y))
    if training:
        d = d.shuffle(1024)
    d = d.map(lambda a, b: (tf.cast(a, tf.float32) / 255.0, b),
              num_parallel_calls=tf.data.AUTOTUNE)
    return d.batch(16).prefetch(tf.data.AUTOTUNE)


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
    idx = np.random.RandomState(42).permutation(len(X))
    X, y = X[idx], y[idx]
    split = int(len(X) * 0.85)
    Xtr, ytr, Xva, yva = X[:split], y[:split], X[split:], y[split:]
    print(f"train {len(Xtr)}  val {len(Xva)}", flush=True)
    model = build_model()
    model.fit(make_ds(Xtr, ytr, True), validation_data=make_ds(Xva, yva, False),
              epochs=8,
              callbacks=[tf.keras.callbacks.ReduceLROnPlateau(patience=2, factor=0.3)],
              verbose=2)
    acc = float(model.evaluate(make_ds(Xva, yva, False), verbose=0)[1])
    print(f"VAL accuracy: {acc:.4f}", flush=True)
    model.save(MODEL_PATH)
    print(f"SAVED {MODEL_PATH}", flush=True)


if __name__ == "__main__":
    main()
