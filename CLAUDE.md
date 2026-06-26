# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

Digital-humanities mapping project documenting historical appeals (*apelos*) tied to Estado-Novo-era expropriations along Avenida Presidente Vargas in Rio de Janeiro. Two collaborators: a researcher/GIS analyst (Francesca) producing source KMLs in Google My Maps, and a developer (Cristofer) running the processing + web pipeline.

## Repository Layout (the parts that matter)

The repo is a **pipeline**, not a service. Data flows in one direction:

```
raw_data/*.kml  →  notebooks (00_/01_processing_KML.ipynb)  →  pre-processed_data/  →  processed_data/  →  web/public/data/  →  web app
                       ↑
                   src/geoprocess/  (helper module imported by the notebooks)
```

- `src/geoprocess/__init__.py` — single-file Python package with all helpers (`convert_kml_to_geojson`, `get_kml_colors`, `get_clean_text`, `get_first_url`, `point_in_feature`, `get_centroids`, `save_geojson_pretty`). The notebooks `import geoprocess as geo` and call these — when adding processing logic, extend this module rather than inlining in notebooks.
- `00_processing_KML.ipynb` — older, full Estado Novo dataset.
- `01_processing_KML.ipynb` — current focus: Presidente Vargas subset (matches the `pres_vargas` branch).
- `processed_data/` — the artifacts the web app consumes. Filenames here are referenced by name in `web/src/main.ts` `LAYERS` config and by the GitHub Actions workflow.
- `web/` — Vite + TypeScript + MapLibre GL single-page app. Vanilla TS class in `web/src/main.ts`; no framework.
- `DATA.RIO/` — base layers from Rio's open-data portal. **Gitignored** (`.gitignore:1`); regenerate locally if missing.

## Commands

### Python (data processing)

```bash
pip install -e .                       # install the geoprocess package (editable)
jupyter notebook 01_processing_KML.ipynb
```

Requires Python ≥ 3.12 (`pyproject.toml`). Dependencies beyond `geopandas`: `fiona`, `beautifulsoup4`, `shapely`, `pandas` — these are imported by `src/geoprocess/__init__.py` but not declared in `pyproject.toml`. Install manually if missing.

### Web app

```bash
cd web
npm install
npm run dev          # vite dev server, http://localhost:3000
npm run type-check   # tsc --noEmit
npm run build        # tsc && vite build → web/dist/
npm run preview      # serve the production build
npm run lint         # eslint (max-warnings 0)
```

`VITE_MAPTILER_KEY` must be set (in `web/.env` or the deployment environment). Without it, `main.ts` shows an in-page error instead of rendering the map.

### Full local rebuild + deploy check

`./fix-and-deploy.sh` from the repo root does the data-copy + type-check + build sequence and prompts for a push.

## Critical wiring you'd otherwise miss

- **Data must be copied into `web/public/`.** The web app fetches GeoJSON from `/data/*.geojson` (served from `web/public/data/`), but the canonical files live in `processed_data/`. Before any build, either run `./fix-and-deploy.sh` or manually `cp processed_data/*.geojson web/public/data/`. The GitHub Actions workflow (`.github/workflows/deploy.yml`) does this copy step automatically, but local dev does not.

- **Vite `base: '/geo/'`** (`web/vite.config.ts:5`) is hard-coded for GitHub Pages at `eu-cristofer.github.io/geo/`. If the repo is ever renamed or hosted elsewhere (Vercel/Netlify/custom domain), this must change or asset paths break in production.

- **Layer filenames are duplicated** in `web/src/main.ts` (the `LAYERS` array) and in `.github/workflows/deploy.yml` (the `Copy data files` step). When adding a new processed dataset, update both.

- **Deployment is push-to-main.** `.github/workflows/deploy.yml` triggers on pushes to `main` that touch `web/**` or `processed_data/**`, builds with the `VITE_MAPTILER_KEY` secret, and publishes to GitHub Pages. PRs build but don't deploy.

- **KML color extraction is custom.** `get_kml_colors` in `src/geoprocess/__init__.py` walks the KML's `StyleMap` / `CascadingStyle` / `Style` trees because `geopandas.read_file(driver='KML')` discards styling. The `Color` column on the resulting GeoDataFrame comes from this — don't expect it from fiona/geopandas alone.

- **Two notebook generations coexist.** `00_processing_KML.ipynb` is the original Estado-Novo full dataset; `01_processing_KML.ipynb` is the active Presidente Vargas work. Don't assume one is canonical — check which notebook produced the GeoJSON you're editing (filename hints: `apelos_clean.geojson` vs `apelos_pres_vargas_clean.geojson`).

## Conventions

- Source data, intermediate data, and final data are kept in three separate directories (`raw_data/`, `pre-processed_data/`, `processed_data/`). Preserve this separation — don't write notebook outputs directly into `processed_data/` unless they are the final consumable form.
- Notebooks save final GeoJSON via `geo.save_geojson_pretty(...)` (indented JSON) so diffs are reviewable in git.
- Project text is bilingual (Portuguese for domain terms — *apelos*, *bairros*, *desapropriação*; English for code/docs). Keep this split; don't translate domain terms in user-facing UI.
