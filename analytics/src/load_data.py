from __future__ import annotations

from pathlib import Path

import pandas as pd

from utils import ensure_path, to_snake_case


def standardize_columns(df: pd.DataFrame) -> pd.DataFrame:
    standardized = df.copy()
    standardized.columns = [to_snake_case(str(column)) for column in standardized.columns]
    return standardized


def load_excel_folder(folder_path: str) -> pd.DataFrame:
    folder = ensure_path(folder_path)
    if not folder.exists():
        raise FileNotFoundError(f"Folder does not exist: {folder}")

    files = sorted(folder.glob("*.xlsx")) + sorted(folder.glob("*.xls"))
    if not files:
        raise FileNotFoundError(f"No Excel files found in {folder}")

    frames: list[pd.DataFrame] = []
    loaded_files: list[str] = []
    failed_files: list[str] = []

    for file_path in files:
        try:
            frame = pd.read_excel(file_path)
            frame = standardize_columns(frame)
            frame["source_file"] = file_path.name
            frames.append(frame)
            loaded_files.append(file_path.name)
            print(f"Loaded {file_path.name}: {frame.shape}")
        except Exception as exc:  # pragma: no cover - useful in notebook runtime
            failed_files.append(file_path.name)
            print(f"Failed to load {file_path.name}: {exc}")

    if not frames:
        raise ValueError(
            f"Unable to load any Excel files from {folder}. "
            "Check that openpyxl/xlrd are installed and the files are readable."
        )

    combined = pd.concat(frames, ignore_index=True, sort=False)
    combined.attrs["source_files"] = loaded_files
    combined.attrs["failed_files"] = failed_files

    print(f"Combined shape: {combined.shape}")
    print(f"Files loaded: {len(loaded_files)}")
    if failed_files:
        print(f"Files failed: {len(failed_files)}")

    return combined
