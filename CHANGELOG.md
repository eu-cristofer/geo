# Changelog

All notable changes to the `geoprocess` library and the processing pipeline are
documented here. Versions follow the `geoprocess` package version in
`pyproject.toml` / `src/geoprocess/__init__.py`.

## [0.3.0] — 2026-06-26

### Added — `src/geoprocess/__init__.py`

- **`group_all_colors_except(gdf, exclude_colors=("fbc02d",), color_names=None, ...)`**
  — collapses **every** Key Color into a single aggregated feature **except**
  the colors listed in `exclude_colors`, which are returned unchanged. Built on
  top of `split_by_color` + `aggregate_features_by_color`:
  - one aggregated feature per non-excluded color (average point, preserving Z;
    `Color` preserved; `Link` concatenated);
  - `Name` set to `"Apelos coletivos (<nome>)"` and `Description` to an
    auto-generated phrase, both using the Portuguese color name looked up in
    `color_names` (falls back to the hex code).

### Changed

- Bumped `geoprocess` version `0.2.0` → `0.3.0` in `src/geoprocess/__init__.py`.

### Pipeline — `02_processing_KML.ipynb`

- Replaced the purple-only "Grouping `ab47bc`" step with **"Grouping all colors
  except amarelo `fbc02d`"**. A `COLOR_NAMES` hex→Portuguese mapping is now
  registered in the notebook. Produces a **single output**:
  - `processed_data/apelos_clean_tese.geojson` — all amarelo `fbc02d` features
    (as-is) **plus one condensed entry per other color** (13 groups). Replaces
    the former two-file output (`apelos_tese_clean.geojson` +
    `apelos_coletivos_roxo.geojson`).

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
