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
| `brain-tumor` | Brain-tumor (LGG) 2D MRI segmentation | `gymprathap/Brain-MRI-LGG-Segmentation` (Buda TCGA) | `train_brain_lgg.py` | `weights/brain-tumor/brain_lgg_model.h5` |
| `artery` | Coronary stenosis segmentation | `nirmalgaud/arcade-dataset` (ARCADE, Kaggle) | `train_artery.py` | `weights/artery/artery_model.h5` |
| `pneumonia` | Chest-X-ray, NORMAL/PNEUMONIA | `hf-vision/chest-xray-pneumonia` (HF) | `train_pneumonia.py` | `weights/pneumonia/pneumonia.h5` |
| `lymphoma` | Histopathology CLL/FL/MCL | `andrewmvd/malignant-lymphoma-classification` (Kaggle) | `train_lymphoma.py` | `weights/lymphoma/lymphoma.h5` |

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

**Known issue:** `lymphoma` and `pneumonia` fail to load on **both** TF 2.16.2
and 2.20 (old save format) — see "Broken originals" below; the fix is
retraining, not a version pin. All other originals (kidney, eye-disease,
breast-cancer, bloodcell) plus fracture/brain/artery load on 2.16.2, the pinned
serving version. `kidney` reports confidence > 100% (output not softmax-
normalized).

## Honest scope

These are demo-scale models trained in a few epochs on a laptop, in the same
spirit as the rest of the CureWise image models. They demonstrate a working
train → save → serve → predict loop, not clinical-grade accuracy. Every
prediction is served behind the product-wide "informs, not diagnoses"
disclaimer.

## Artery (ARCADE) — needs Kaggle

`train_artery.py` reads the ARCADE stenosis split (COCO polygon annotations →
binary masks) and trains a segmentation U-Net. Provide Kaggle creds
(`KAGGLE_USERNAME` / `KAGGLE_KEY`) and download once:

```bash
kaggle datasets download -d nirmalgaud/arcade-dataset -p /tmp/arcade --unzip
DATA_DIR=/tmp/arcade/arcade/stenosis $PY backend/ml_training/train_artery.py
```

## Retrained originals

The original `lymphoma` and `pneumonia` weights failed to deserialize on **both**
TF 2.16.2 and 2.20 (old Keras save format) — a version pin does not fix them, so
they were retrained from source with `train_pneumonia.py` / `train_lymphoma.py`
(MobileNetV2 transfer, matching the registry's label order). The `eval_*.py`
scripts still work as quick prediction demos on the new weights.
