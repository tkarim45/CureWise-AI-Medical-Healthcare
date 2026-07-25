# CureWise model training

Reproducible training for the image models that ship in the disease-detection
registry but are not part of the original CureWise set. Weights are large and
gitignored; these scripts regenerate them from public HuggingFace data.

Run with the project's Python (TensorFlow/Keras). Models train on CPU
(Apple-Metal is disabled in the scripts for stability on 8 GB machines).

## Models

| Key | Task | Dataset (HuggingFace) | Script | Output |
|---|---|---|---|---|
| `fracture` | Bone-fracture X-ray, binary classification | `Hemg/bone-fracture-detection` (8,863 imgs, balanced) | `train_fracture.py` | `data/fracture/fracture_model.h5` |
| `brain-tumor` | Brain-tumor (LGG) 2D MRI segmentation | `gymprathap/Brain-MRI-LGG-Segmentation` (Buda TCGA) | `train_brain_lgg.py` | `data/brain_lgg/brain_lgg_model.h5` |

Both bake preprocessing into the model (a `Rescaling` layer), so the served
model can be fed the registry's plain `image/255` with no mismatch. `fracture`
uses the standard classification path; `brain-tumor` uses the segmentation path
(sigmoid mask → overlay), loaded with `custom_objects` disabled because the
U-Net uses only stock Keras layers.

## Usage

```bash
PY=~/miniconda3/envs/personal/bin/python

# Fracture — downloads the dataset itself.
$PY backend/ml_training/train_fracture.py

# Brain LGG — needs the unzipped dataset dir.
DATA_DIR=/path/to/unzipped/lgg $PY backend/ml_training/train_brain_lgg.py
```

## Eval scripts (converted from `notebooks/`)

The original `backend/notebooks/*.ipynb` for kidney, lymphoma, pneumonia,
eye-disease and breast-cancer were **inference-only** — each loaded an
already-trained `.h5` and predicted one image. There was no training code in
them, so they became `eval_*.py` (not `train_*.py`) with their hardcoded
`~/Downloads` paths fixed to `weights/<key>/` + `data/samples/<key>/`.

```bash
$PY backend/ml_training/eval_kidney.py         # [optional image path]
$PY backend/ml_training/eval_lymphoma.py
$PY backend/ml_training/eval_pneumonia.py
$PY backend/ml_training/eval_eye_disease.py
$PY backend/ml_training/eval_breast_cancer.py  # segmentation; saves an overlay
```

**Known issue — TensorFlow version:** the `lymphoma` and `pneumonia` weights
were trained on an older TensorFlow and fail to load under TF 2.20
(`Cannot convert '((None,1280),)' to a shape`). They load under the pinned
`tensorflow==2.16.2` in `requirements.txt`; keep the serving image on that
version, or re-save those two models under the current TF. `kidney` also
reports confidence > 100% because its output layer isn't softmax-normalized.

## Honest scope

These are demo-scale models trained in a few epochs on a laptop, in the same
spirit as the rest of the CureWise image models. They demonstrate a working
train → save → serve → predict loop, not clinical-grade accuracy. Every
prediction is served behind the product-wide "informs, not diagnoses"
disclaimer.

## Not included

Coronary artery / stenosis segmentation (ARCADE) was requested but the ARCADE
dataset is not available on HuggingFace and needs Kaggle access. To add it,
drop a Keras `.h5` at `data/artery/artery_model.h5` and register a spec in
`src/features/disease_detection/specs.py`.
