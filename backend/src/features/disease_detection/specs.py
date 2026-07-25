"""Declarative registry of every disease-detection model.

Adding a new classifier is a data change here, not new endpoint code: give it a
key, weights path, input size, class labels and (optionally) a chat prompt.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from src.core.config import settings
from src.features.disease_detection.prompts import (
    ARTERY_PROMPT,
    BLOODCELL_PROMPT,
    BRAIN_TUMOR_PROMPT,
    BREAST_CANCER_PROMPT,
    EYE_DISEASE_PROMPT,
    FRACTURE_PROMPT,
    KIDNEY_DISEASE_PROMPT,
    LYMPHOMA_DISEASE_PROMPT,
    PNEUMONIA_PROMPT,
)


@dataclass(frozen=True)
class ClassifierSpec:
    key: str
    label: str
    model_path: str
    labels: list[str]
    input_size: Optional[tuple[int, int]] = None  # None => use the model's own input shape
    kind: str = "classification"  # "classification" | "segmentation"
    custom_objects: bool = False
    system_prompt: str = ""


CLASSIFIERS: dict[str, ClassifierSpec] = {
    "kidney": ClassifierSpec(
        key="kidney",
        label="Kidney Disease",
        model_path=settings.KIDNEY_MODEL_PATH,
        input_size=(28, 28),
        labels=["Cyst", "Normal", "Stone"],
        system_prompt=KIDNEY_DISEASE_PROMPT,
    ),
    "lymphoma": ClassifierSpec(
        key="lymphoma",
        label="Lymphoma",
        model_path=settings.LYMPHOMA_MODEL_PATH,
        input_size=(224, 224),
        labels=["lymph_cll", "lymph_fl", "lymph_mcl"],
        system_prompt=LYMPHOMA_DISEASE_PROMPT,
    ),
    "pneumonia": ClassifierSpec(
        key="pneumonia",
        label="Pneumonia",
        model_path=settings.PNEUMONIA_MODEL_PATH,
        input_size=(224, 224),
        labels=["NORMAL", "PNEUMONIA"],
        system_prompt=PNEUMONIA_PROMPT,
    ),
    "eye-disease": ClassifierSpec(
        key="eye-disease",
        label="Eye Disease",
        model_path=settings.EYE_DISEASE_MODEL_PATH,
        input_size=(224, 224),
        labels=["Bulging_Eyes", "Cataracts", "Crossed_Eyes", "Glaucoma", "Uveitis"],
        system_prompt=EYE_DISEASE_PROMPT,
    ),
    "breast-cancer": ClassifierSpec(
        key="breast-cancer",
        label="Breast Cancer",
        model_path=settings.BREAST_CANCER_MODEL_PATH,
        labels=["Mask"],
        kind="segmentation",
        custom_objects=True,
        system_prompt=BREAST_CANCER_PROMPT,
    ),
    # --- integrated from bloodcell_app ---
    "blood-cell-type": ClassifierSpec(
        key="blood-cell-type",
        label="Blood Cell Type",
        model_path=settings.BLOODCELL_TYPE_MODEL_PATH,
        input_size=(64, 64),
        labels=["ig", "lymphocyte", "monocyte", "neutrophil", "platelet"],
        system_prompt=BLOODCELL_PROMPT,
    ),
    "blood-marker": ClassifierSpec(
        key="blood-marker",
        label="Blood Disease Marker (AML)",
        model_path=settings.BLOODCELL_MARKER_MODEL_PATH,
        input_size=(224, 224),
        # Model emits 5 classes. The source project's label list duplicated
        # "RUNX1_RUNX1T1" at index 4 (a bug); index 4 is inferred here as
        # CBFB_MYH11, the missing member of the canonical 5-class AML
        # genetic-marker set. Unverified against the original training order.
        labels=["RUNX1_RUNX1T1", "control", "NPM1", "PML_RARA", "CBFB_MYH11"],
        system_prompt=BLOODCELL_PROMPT,
    ),
    # --- trained in backend/ml_training (see README there) ---
    "fracture": ClassifierSpec(
        key="fracture",
        label="Bone Fracture (X-ray)",
        model_path=settings.FRACTURE_MODEL_PATH,
        input_size=(224, 224),
        labels=["fractured", "not fractured"],
        system_prompt=FRACTURE_PROMPT,
    ),
    "brain-tumor": ClassifierSpec(
        key="brain-tumor",
        label="Brain Tumor (MRI, LGG)",
        model_path=settings.BRAIN_LGG_MODEL_PATH,
        labels=["Tumor"],
        kind="segmentation",
        custom_objects=False,
        system_prompt=BRAIN_TUMOR_PROMPT,
    ),
    "artery": ClassifierSpec(
        key="artery",
        label="Coronary Artery / Stenosis (angiography)",
        model_path=settings.ARTERY_MODEL_PATH,
        labels=["Stenosis"],
        kind="segmentation",
        custom_objects=False,
        system_prompt=ARTERY_PROMPT,
    ),
}


def get_spec(key: str) -> ClassifierSpec | None:
    return CLASSIFIERS.get(key)


def chat_specs() -> list[ClassifierSpec]:
    return [s for s in CLASSIFIERS.values() if s.system_prompt]
