from __future__ import annotations

import numpy as np
import pandas as pd


def _standardize(frame: pd.DataFrame) -> np.ndarray:
    values = frame.to_numpy(dtype=float)
    means = values.mean(axis=0)
    stds = values.std(axis=0)
    stds[stds == 0] = 1.0
    return (values - means) / stds


def _run_kmeans(values: np.ndarray, n_clusters: int = 4, iterations: int = 25) -> np.ndarray:
    if len(values) == 0:
        return np.array([], dtype=int)

    n_clusters = max(1, min(n_clusters, len(values)))
    centroids = values[:n_clusters].copy()

    for _ in range(iterations):
        distances = np.linalg.norm(values[:, None, :] - centroids[None, :, :], axis=2)
        labels = distances.argmin(axis=1)
        new_centroids = centroids.copy()
        for cluster_id in range(n_clusters):
            cluster_points = values[labels == cluster_id]
            if len(cluster_points) > 0:
                new_centroids[cluster_id] = cluster_points.mean(axis=0)
        if np.allclose(centroids, new_centroids):
            break
        centroids = new_centroids

    distances = np.linalg.norm(values[:, None, :] - centroids[None, :, :], axis=2)
    return distances.argmin(axis=1)


def _label_cluster(cluster_frame: pd.DataFrame) -> tuple[str, str]:
    mean_footfall = cluster_frame["footfall"].mean()
    mean_competition = cluster_frame["competition"].mean()
    mean_stores = cluster_frame["store_count"].mean()

    if mean_footfall >= 82 and mean_stores >= 900:
        return "CBD commuter surge", "High-throughput urban core with dense trade and strong all-day movement."
    if mean_footfall >= 72 and mean_competition <= 48:
        return "Whitespace growth pocket", "Demand is solid while direct competition pressure stays relatively open."
    if mean_competition >= 68:
        return "Competitive destination core", "Large destination precinct with heavy trade density and tighter whitespace."
    return "Balanced lifestyle precinct", "Mixed-use catchment with stable trade support and versatile popup potential."


def cluster_zones(feature_frame: pd.DataFrame) -> pd.DataFrame:
    if feature_frame.empty:
        return feature_frame.assign(cluster_id=pd.Series(dtype=int))

    working = feature_frame.copy()
    clustering_matrix = _standardize(
        working[
            [
                "footfall",
                "competition",
                "complementarity",
                "store_count",
                "context_count",
            ]
        ]
    )

    working["cluster_id"] = _run_kmeans(clustering_matrix, n_clusters=4)

    labels = {}
    summaries = {}
    for cluster_id, cluster_frame in working.groupby("cluster_id"):
        label, summary = _label_cluster(cluster_frame)
        labels[cluster_id] = label
        summaries[cluster_id] = summary

    working["cluster_label"] = working["cluster_id"].map(labels)
    working["cluster_summary"] = working["cluster_id"].map(summaries)
    return working
