"""Train the coronary artery / stenosis segmentation U-Net for CureWise.

Dataset: ARCADE (nirmalgaud/arcade-dataset on Kaggle) — X-ray coronary
angiography with COCO polygon annotations of stenosis regions.

Builds binary stenosis masks from the COCO polygons and trains a compact U-Net
(Dice + BCE), matching the registry's segmentation path (predict_segmentation,
custom_objects disabled). Preprocessing is plain image/255.

Env DATA_DIR must point at the `arcade/stenosis` folder (train/ + val/).
Saves: backend/weights/artery/artery_model.h5
"""

import glob
import json
import os
from pathlib import Path

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

import numpy as np
import tensorflow as tf
from PIL import Image, ImageDraw

tf.config.set_visible_devices([], "GPU")

BACKEND = Path(__file__).resolve().parents[1]
OUT_DIR = BACKEND / "weights" / "artery"
OUT_DIR.mkdir(parents=True, exist_ok=True)
MODEL_PATH = OUT_DIR / "artery_model.h5"
DATA_DIR = os.environ["DATA_DIR"]

IMG = 128


def _coco_masks(split_dir):
    """Return (image_path, PIL mask) pairs for one ARCADE split."""
    ann_files = glob.glob(os.path.join(split_dir, "annotations", "*.json"))
    if not ann_files:
        return []
    coco = json.load(open(ann_files[0]))
    images = {im["id"]: im for im in coco["images"]}
    polys = {}  # image_id -> list of polygon coord lists
    for a in coco["annotations"]:
        seg = a.get("segmentation") or []
        for poly in seg:
            if isinstance(poly, list) and len(poly) >= 6:
                polys.setdefault(a["image_id"], []).append(poly)

    img_dir = os.path.join(split_dir, "images")
    pairs = []
    for img_id, im in images.items():
        fp = os.path.join(img_dir, im["file_name"])
        if not os.path.exists(fp):
            continue
        mask = Image.new("L", (im["width"], im["height"]), 0)
        d = ImageDraw.Draw(mask)
        for poly in polys.get(img_id, []):
            d.polygon([(poly[i], poly[i + 1]) for i in range(0, len(poly) - 1, 2)], fill=255)
        pairs.append((fp, mask))
    return pairs


def load_arrays():
    pairs = []
    for split in ("train", "val", "train_val"):
        sd = os.path.join(DATA_DIR, split)
        if os.path.isdir(sd):
            pairs += _coco_masks(sd)
    print(f"pairs: {len(pairs)}", flush=True)
    X, Y = [], []
    pos = 0
    for i, (fp, mask) in enumerate(pairs):
        im = np.asarray(Image.open(fp).convert("RGB").resize((IMG, IMG)), dtype=np.uint8)
        mk = np.asarray(mask.resize((IMG, IMG)))
        X.append(im)
        Y.append((mk > 0).astype(np.float32)[..., None])
        pos += int(mk.max() > 0)
        if i % 400 == 0:
            print(f"  built {i}/{len(pairs)}", flush=True)
    X = np.asarray(X, dtype=np.uint8)
    Y = np.asarray(Y, dtype=np.float32)
    print(f"loaded {len(X)} ({pos} with stenosis)", flush=True)
    return X, Y


def dice_coef(y_true, y_pred, smooth=1.0):
    yt = tf.reshape(y_true, [-1]); yp = tf.reshape(y_pred, [-1])
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
    model.compile(optimizer=tf.keras.optimizers.Adam(1e-3), loss=loss_fn, metrics=[dice_coef])
    return model


def main():
    X, Y = load_arrays()
    idx = np.random.RandomState(42).permutation(len(X))
    X, Y = X[idx], Y[idx]
    split = int(len(X) * 0.85)
    Xtr, Ytr, Xva, Yva = X[:split], Y[:split], X[split:], Y[split:]
    print(f"train {len(Xtr)}  val {len(Xva)}", flush=True)
    model = build_unet()
    model.fit(Xtr, Ytr, validation_data=(Xva, Yva), epochs=15, batch_size=16,
              callbacks=[tf.keras.callbacks.ReduceLROnPlateau(patience=2, factor=0.3)],
              verbose=2)
    d = float(model.evaluate(Xva, Yva, verbose=0)[1])
    print(f"VAL dice: {d:.4f}", flush=True)
    model.save(MODEL_PATH)
    print(f"SAVED {MODEL_PATH}", flush=True)


if __name__ == "__main__":
    main()
