# Changelog

All notable changes to the `geoprocess` library and the processing pipeline are
documented here. Versions follow the `geoprocess` package version in
`pyproject.toml` / `src/geoprocess/__init__.py`.

## [0.5.0] — 2026-06-28

### Added — `src/geoprocess/__init__.py`

- **Raster overlay "versions"** for the 1928 aerial then-and-now layer:
  - `RASTER_TREATMENTS` — alpha-preserving `Image -> Image` treatments
    (`grayscale`, `contrast`, `contours` line-art, `sepia`) built on stdlib PIL
    (`ImageOps`/`ImageEnhance`/`ImageFilter`/`ImageChops`); `original` = identity.
  - `RASTER_VARIANT_LABELS` — id → Portuguese UI label.
  - `reattach_alpha_from(alpha_source_path)` — builds a `process` callable that
    restores the montage's transparent edges onto an RGB image (used for the
    AI-restored version, which has no alpha).
  - `export_raster_overlay_variants(tif_path, out_dir, ...)` — computes the
    corners once and writes one `<base>_<id>.webp` per variant plus a manifest
    `{coordinates, variants:[{id,label,file}]}`.
- **`export_raster_overlay`** gained `process` (treatment applied before save)
  and `coordinates` (skip GeoTIFF-tag reading; reuse given corners — needed for
  the AI PNG, which carries no geo tags).

### Changed

- Bumped `geoprocess` version `0.4.0` → `0.5.0` (`pyproject.toml` /
  `src/geoprocess/__init__.py`).

### Assets — `web/public/historical/`

- Generated the 1928 aerial versions consumed by the web app's overlay version
  switcher: `aero_1928_{original,grayscale,contrast,contours,sepia,ai}.webp`
  + `aero_1928_manifest.json`. The five PIL versions come from
  `geo.export_raster_overlay_variants("images/Montagem aero 1928_modified.tif",
  "web/public/historical")`. The AI (`ai`, "Ultrarrealista") version is an
  offline one-off: Real-ESRGAN (x4) on the source aerial, then
  `geo.export_raster_overlay(..., coordinates=<shared corners>,
  process=geo.reattach_alpha_from(<source tif>))`.

## [0.4.0] — 2026-06-27

### Added — `src/geoprocess/__init__.py`

- **`export_raster_overlay(tif_path, out_image, out_bounds_json=None, max_width=2048, ...)`**
  — turns a georeferenced GeoTIFF into a web-ready MapLibre `image` overlay.
  Reads the georeferencing straight from the GeoTIFF tags with **PIL**
  (`ModelPixelScale` 33550, `ModelTiepoint` 33922, EPSG from the
  `GeoKeyDirectory` 34735) — no GDAL/rasterio dependency — computes the raster's
  bounding box, reprojects the four corners to WGS84 with **pyproj**, and writes:
  - an optimized, downscaled image (WebP by default, preserving the RGBA
    transparent edges of the 1928 montage);
  - an optional bounds JSON with the corner coordinates in the order MapLibre
    expects (`[top-left, top-right, bottom-right, bottom-left]`).

### Changed

- Bumped `geoprocess` version `0.3.0` → `0.4.0` (`pyproject.toml` /
  `src/geoprocess/__init__.py`); declared `pillow` and `pyproj` dependencies.

### Pipeline — `01_processing_KML.ipynb`

- Added a step exporting the georeferenced 1928 aerial montage
  (`images/Montagem aero 1928_modified.tif`, SIRGAS 2000 / UTM 23S) to
  `web/public/historical/aero_1928.webp` (+ `aero_1928_bounds.json`) for the web
  app's "Aerofotografia 1928" then-and-now overlay.

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
