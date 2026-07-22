"""Centralized logging setup."""

import logging


def setup_logging(level: int = logging.INFO) -> None:
    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    )
    # TensorFlow / absl are noisy at import time
    logging.getLogger("tensorflow").setLevel(logging.ERROR)
