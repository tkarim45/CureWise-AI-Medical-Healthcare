"""Train the brain-tumor (LGG) 2D segmentation U-Net for CureWise.

Dataset: gymprathap/Brain-MRI-LGG-Segmentation (HuggingFace) — the Buda TCGA
LGG set: 2D MRI .tif slices + binary tumor `_mask.tif`.

A compact U-Net with batch-norm + dropout, sigmoid mask output, trained with
Dice + BCE. Preprocessing is plain image/255 so it matches the registry's
segmentation path (predict_segmentation), which loads it with custom_objects
disabled — so the net uses only standard Keras layers.

Env DATA_DIR must point at the unzipped LGG folder.
Saves: backend/data/brain_lgg/brain_lgg_model.h5
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
OUT_DIR = BACKEND / "weights" / "brain-tumor"
OUT_DIR.mkdir(parents=True, exist_ok=True)
MODEL_PATH = OUT_DIR / "brain_lgg_model.h5"
DATA_DIR = os.environ["DATA_DIR"]

IMG = 128


def load_arrays():
    masks = sorted(glob.glob(os.path.join(DATA_DIR, "**", "*_mask.tif"), recursive=True))
    pairs = []
    for m in masks:
        img = m.replace("_mask.tif", ".tif")
        if os.path.exists(img):
            pairs.append((img, m))
    print(f"pairs: {len(pairs)}", flush=True)

    X, Y = [], []
    pos = 0
    for i, (ip, mp) in enumerate(pairs):
        mk = np.asarray(Image.open(mp).convert("L").resize((IMG, IMG)))
        has_tumor = mk.max() > 0
        # Keep every tumor slice; keep ~1 in 3 empty slices to curb imbalance.
        if not has_tumor and (i % 3 != 0):
            continue
        im = np.asarray(Image.open(ip).convert("RGB").resize((IMG, IMG)), dtype=np.uint8)
        X.append(im)
        Y.append((mk > 0).astype(np.float32)[..., None])
        pos += int(has_tumor)
        if i % 800 == 0:
            print(f"  scanned {i}/{len(pairs)}", flush=True)
    X = np.asarray(X, dtype=np.uint8)
    Y = np.asarray(Y, dtype=np.float32)
    print(f"kept {len(X)} slices ({pos} with tumor)", flush=True)
    return X, Y


def dice_coef(y_true, y_pred, smooth=1.0):
    yt = tf.reshape(y_true, [-1])
    yp = tf.reshape(y_pred, [-1])
    inter = tf.reduce_sum(yt * yp)
    return (2 * inter + smooth) / (tf.reduce_sum(yt) + tf.reduce_sum(yp) + smooth)


def loss_fn(y_true, y_pred):
    bce = tf.keras.losses.binary_crossentropy(y_true, y_pred)
    return tf.reduce_mean(bce) + (1 - dice_coef(y_true, y_pred))


def conv_block(x, f):
    x = tf.keras.layers.Conv2D(f, 3, padding="same")(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.Activation("relu")(x)
    x = tf.keras.layers.Conv2D(f, 3, padding="same")(x)
    x = tf.keras.layers.BatchNormalization()(x)
    return tf.keras.layers.Activation("relu")(x)


def build_unet():
    inp = tf.keras.Input((IMG, IMG, 3))
    x = tf.keras.layers.Rescaling(1.0 / 255)(inp)
    c1 = conv_block(x, 16); p1 = tf.keras.layers.MaxPool2D()(c1)
    c2 = conv_block(p1, 32); p2 = tf.keras.layers.MaxPool2D()(c2)
    c3 = conv_block(p2, 64); p3 = tf.keras.layers.MaxPool2D()(c3)
    bn = conv_block(p3, 128); bn = tf.keras.layers.Dropout(0.3)(bn)
    u3 = tf.keras.layers.UpSampling2D()(bn)
    u3 = tf.keras.layers.Concatenate()([u3, c3]); c4 = conv_block(u3, 64)
    u2 = tf.keras.layers.UpSampling2D()(c4)
    u2 = tf.keras.layers.Concatenate()([u2, c2]); c5 = conv_block(u2, 32)
    u1 = tf.keras.layers.UpSampling2D()(c5)
    u1 = tf.keras.layers.Concatenate()([u1, c1]); c6 = conv_block(u1, 16)
    out = tf.keras.layers.Conv2D(1, 1, activation="sigmoid")(c6)
    model = tf.keras.Model(inp, out)
    model.compile(optimizer=tf.keras.optimizers.Adam(1e-3), loss=loss_fn,
                  metrics=[dice_coef])
    return model


def main():
    X, Y = load_arrays()
    idx = np.random.RandomState(42).permutation(len(X))
    X, Y = X[idx], Y[idx]
    split = int(len(X) * 0.85)
    Xtr, Ytr, Xva, Yva = X[:split], Y[:split], X[split:], Y[split:]
    print(f"train {len(Xtr)}  val {len(Xva)}", flush=True)

    model = build_unet()
    model.fit(Xtr, Ytr, validation_data=(Xva, Yva), epochs=12, batch_size=16,
              callbacks=[tf.keras.callbacks.ReduceLROnPlateau(patience=2, factor=0.3)],
              verbose=2)

    d = float(model.evaluate(Xva, Yva, verbose=0)[1])
    print(f"VAL dice: {d:.4f}", flush=True)
    model.save(MODEL_PATH)
    print(f"SAVED {MODEL_PATH}", flush=True)


if __name__ == "__main__":
    main()
