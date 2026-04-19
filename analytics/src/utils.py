from __future__ import annotations

import re
from pathlib import Path
from typing import Iterable


def to_snake_case(value: str) -> str:
    cleaned = re.sub(r"[^0-9a-zA-Z]+", "_", value.strip())
    cleaned = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", cleaned)
    return cleaned.strip("_").lower()


def ensure_path(path_like: str | Path) -> Path:
    return path_like if isinstance(path_like, Path) else Path(path_like)


def find_first_matching(columns: Iterable[str], candidates: Iterable[str]) -> str | None:
    column_set = list(columns)
    candidate_set = set(candidates)
    for column in column_set:
        if column in candidate_set:
            return column
    return None
