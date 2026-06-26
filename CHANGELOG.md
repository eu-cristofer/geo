# Changelog

All notable changes to the `geoprocess` library and the processing pipeline are
documented here. Versions follow the `geoprocess` package version in
`pyproject.toml` / `src/geoprocess/__init__.py`.

## [0.2.0] — 2026-06-26

### Added — `src/geoprocess/__init__.py`

- **`split_by_color(gdf, color, color_column='Color')`** — splits a
  GeoDataFrame into `(matching, others)` by Key Color. Used to separate the
  *apelos coletivos* (purple `ab47bc`) from the *apelos individuais*.
- **`aggregate_features_by_color(gdf, color, ...)`** — collapses every feature
  of a given color into a **single** feature:
  - geometry = the average (mean) point of the matching features. **Preserves
    the Z (altitude) coordinate** when the source layer is 3D, so the
    aggregated point keeps the `[lon, lat, z]` shape of the other features.
  - `Color` kept equal to the grouped color.
  - columns in `concat_columns` (default `('Link', 'Description')`) have their
    non-empty values concatenated with `sep` (default `' | '`).
  - `Name` set to a custom `name` or a default `"Grupo <color> (<n> apelos)"`.
- **`group_features_by_color(gdf, color, ...)`** — convenience wrapper that
  returns `others + aggregated feature` as one combined GeoDataFrame (built on
  top of the two functions above).

### Changed

- Bumped `geoprocess` version `0.1.0` → `0.2.0` in `pyproject.toml` and
  `src/geoprocess/__init__.py`.

### Pipeline — `02_processing_KML.ipynb`

- Implemented the "Grouping purple `ab47bc` features" step, producing **two
  separate outputs**:
  - `processed_data/apelos_tese_clean.geojson` — all non-purple features **plus
    one condensed purple entry** (the 97 purple apelos collapsed into a single
    feature). Its `Link` is the concatenation of all source links; its
    `Description` is a **written phrase** (not a concatenation).
  - `processed_data/apelos_coletivos_roxo.geojson` — **all 97 purple features**,
    exported as-is (no condensing).
