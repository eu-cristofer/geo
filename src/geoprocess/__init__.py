# src/geodata/__init__.py

import geopandas as gpd
import fiona
import os

import re
import pandas as pd
import geopandas as gpd
from bs4 import BeautifulSoup
import json

__version__ = "0.5.0"

def get_kml_colors(kml_path):
    """
    Extracts the color for each placemark from a KML file.
    Returns a dictionary mapping placemark names to their color codes.
    """
    import xml.etree.ElementTree as ET
    tree = ET.parse(kml_path)
    root = tree.getroot()
    
    # Strip namespaces for easier querying
    for elem in root.iter():
        if '}' in elem.tag:
            elem.tag = elem.tag.split('}', 1)[1]
            
    style_maps = {}
    for sm in root.findall('.//StyleMap'):
        sm_id = sm.get('id')
        for pair in sm.findall('.//Pair'):
            key = pair.find('key')
            if key is not None and key.text == 'normal':
                styleUrl = pair.find('styleUrl')
                if styleUrl is not None:
                    style_maps['#'+sm_id] = styleUrl.text

    styles = {}
    # Find styles in CascadingStyle
    for cst in root.findall('.//CascadingStyle'):
        cst_id = None
        for k, v in cst.attrib.items():
            if k.endswith('id'):
                cst_id = v
                break
        if cst_id:
            icon = cst.find('.//IconStyle/Icon/href')
            if icon is not None and 'color=' in icon.text:
                color = icon.text.split('color=')[1].split('&')[0]
                styles['#'+cst_id] = color
            else:
                color_tag = cst.find('.//IconStyle/color')
                if color_tag is not None:
                    styles['#'+cst_id] = color_tag.text

    # Find standalone Styles
    for st in root.findall('.//Style'):
        st_id = st.get('id')
        if st_id:
            icon = st.find('.//IconStyle/Icon/href')
            if icon is not None and 'color=' in icon.text:
                color = icon.text.split('color=')[1].split('&')[0]
                styles['#'+st_id] = color
            else:
                color_tag = st.find('.//IconStyle/color')
                if color_tag is not None:
                    styles['#'+st_id] = color_tag.text
                    
    colors = {}
    for pm in root.findall('.//Placemark'):
        name_elem = pm.find('name')
        name = name_elem.text if name_elem is not None else None
        
        s_url = pm.find('styleUrl')
        color = None
        if s_url is not None:
            url = s_url.text
            if url in style_maps:
                url = style_maps[url]
            if url in styles:
                color = styles[url]
                
        if name and color:
            colors[name] = color
            
    return colors

def convert_kml_to_geojson(kml_path, geojson_path):
    """
    Reads features from a KML file and exports them to a GeoJSON file.
    Extracts placemark colors from KML styling as well.
    """
    if not os.path.exists(kml_path):
        raise FileNotFoundError(f"Error: Input file not found at '{kml_path}'")

    try:
        # Enable KML driver support
        fiona.supported_drivers['KML'] = 'r'
        
        gdf = gpd.read_file(kml_path, driver='KML')
        
        # Extract colors and map them to the GeoDataFrame
        try:
            colors_dict = get_kml_colors(kml_path)
            gdf['Color'] = gdf['Name'].map(colors_dict)
        except Exception as e:
            print(f"⚠️ Could not extract colors from KML: {e}")
            
        gdf.to_file(geojson_path, driver='GeoJSON')
        print(f"✅ Success! Converted '{kml_path}' to '{geojson_path}'")
        return gdf
    except Exception as e:
        print(f"❌ An error occurred during conversion: {e}")
        raise


def save_geojson_pretty(gdf, output_path, indent=2):
    """
    Save a GeoDataFrame to a GeoJSON file with pretty print formatting.
    
    Parameters:
        gdf (GeoDataFrame): The GeoDataFrame to save
        output_path (str): Path where to save the GeoJSON file
        indent (int): Number of spaces for indentation (default: 2)
    
    Returns:
        GeoDataFrame: The original GeoDataFrame
    
    Examples:
        >>> # Save with default 2-space indentation
        >>> geo.save_geojson_pretty(gdf, "output.geojson")
        
        >>> # Save with 4-space indentation
        >>> geo.save_geojson_pretty(gdf, "output.geojson", indent=4)
    """
    try:
        # Convert GeoDataFrame to GeoJSON dict
        geojson_dict = json.loads(gdf.to_json())
        
        # Write with pretty formatting
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(geojson_dict, f, indent=indent, ensure_ascii=False)
        
        print(f"✅ Success! Saved pretty GeoJSON to '{output_path}'")
        return gdf
        
    except Exception as e:
        print(f"❌ An error occurred during pretty save: {e}")
        raise




def get_clean_text(html_text):
    """Extract and return only the visible text from HTML, removing all tags and links."""
    if not html_text:
        return ""
    soup = BeautifulSoup(html_text, 'html.parser')
    # Remove all <a> tags and their content
    for a in soup.find_all('a'):
        a.decompose()
    # Get only the visible text
    text = soup.get_text(separator=' ', strip=True)
    # Clean up extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def get_first_url(html_text):
    """Return only the first http(s) url found in the HTML description, or None if not found."""
    if not html_text:
        return None

    soup = BeautifulSoup(html_text, 'html.parser')

    for link in soup.find_all('a', href=True):
        href = link.get('href')
        if href and href.startswith('http'):
            return href

    return None


def point_in_feature(point, feature, point_crs=None, feature_crs=None):
    """
    Check if a point is inside a feature (polygon or multipolygon).
    
    Parameters:
        point: Can be one of:
            - tuple/list of (longitude, latitude) or (x, y)
            - shapely Point object
            - GeoDataFrame/GeoSeries with a single point geometry
        feature: Can be one of:
            - shapely Polygon/MultiPolygon object
            - GeoDataFrame/GeoSeries with a single polygon geometry
        point_crs (str or dict, optional): CRS of the point (e.g., 'EPSG:4326'). 
            Only needed if point is a tuple/list.
        feature_crs (str or dict, optional): CRS of the feature (e.g., 'EPSG:4326').
            Only needed if feature is a shapely geometry without CRS info.
    
    Returns:
        bool: True if point is inside the feature, False otherwise.
    
    Examples:
        >>> # Using coordinates
        >>> point_in_feature((-43.1729, -22.9068), polygon_gdf.iloc[0].geometry)
        
        >>> # Using geometries from GeoDataFrames
        >>> point_in_feature(point_gdf.iloc[0].geometry, polygon_gdf.iloc[0].geometry)
        
        >>> # With different CRS
        >>> point_in_feature((-43.1729, -22.9068), polygon, point_crs='EPSG:4326')
    """
    from shapely.geometry import Point
    
    # Convert point to geometry if needed
    if isinstance(point, (tuple, list)):
        point_geom = Point(point[0], point[1])
        if point_crs:
            point_gdf = gpd.GeoDataFrame(geometry=[point_geom], crs=point_crs)
            point_geom = point_gdf.iloc[0].geometry
    elif isinstance(point, (gpd.GeoDataFrame, gpd.GeoSeries)):
        point_geom = point.geometry.iloc[0] if isinstance(point, gpd.GeoDataFrame) else point.iloc[0]
        point_crs = point.crs
    else:
        point_geom = point
    
    # Get feature geometry
    if isinstance(feature, (gpd.GeoDataFrame, gpd.GeoSeries)):
        feature_geom = feature.geometry.iloc[0] if isinstance(feature, gpd.GeoDataFrame) else feature.iloc[0]
        feature_crs = feature.crs
    else:
        feature_geom = feature
    
    # Handle CRS transformation if needed
    if point_crs and feature_crs and point_crs != feature_crs:
        point_gdf = gpd.GeoDataFrame(geometry=[point_geom], crs=point_crs)
        point_gdf = point_gdf.to_crs(feature_crs)
        point_geom = point_gdf.iloc[0].geometry
    
    # Check if point is within feature
    return feature_geom.contains(point_geom)


def split_by_color(gdf, color, color_column='Color'):
    """
    Split a GeoDataFrame into the features matching a color and the rest.

    Use case: separating the *apelos coletivos* (purple ``"ab47bc"`` placemarks
    that belong to one collective appeal) from the *apelos individuais* (every
    other feature).

    Parameters
    ----------
    gdf : GeoDataFrame
        Source features.
    color : str
        Color code to match on (e.g. ``'ab47bc'``).
    color_column : str
        Column holding the color code (default ``'Color'``).

    Returns
    -------
    (GeoDataFrame, GeoDataFrame)
        ``(matching, others)`` — the features whose color equals ``color`` and
        the remaining features. Both preserve the input CRS.

    Examples
    --------
    >>> coletivos_raw, individuais = geo.split_by_color(apelos, 'ab47bc')
    """
    matching = gdf[gdf[color_column] == color]
    others = gdf[gdf[color_column] != color]
    return matching, others


def aggregate_features_by_color(gdf, color, color_column='Color',
                                concat_columns=('Link', 'Description'),
                                sep=' | ', name=None, name_column='Name'):
    """
    Collapse every feature matching a color into a single aggregated feature.

    Use case: many individual placemarks share one "Key Color" (e.g. the purple
    ``"ab47bc"`` apelos) and should be represented on the map as a single
    grouped point rather than dozens of overlapping ones.

    The returned single-row feature:
        - geometry: the average point (mean of the matching features'
          representative points, so it works for any geometry type)
        - color: kept equal to ``color``
        - columns listed in ``concat_columns``: their non-empty values are
          concatenated with ``sep`` (so no links/descriptions are lost)
        - ``name_column``: set to ``name`` if given, otherwise a default label

    Parameters
    ----------
    gdf : GeoDataFrame
        Source features.
    color : str
        Color code to aggregate (e.g. ``'ab47bc'``).
    color_column : str
        Column holding the color code (default ``'Color'``).
    concat_columns : iterable of str
        Text columns whose values are concatenated into the new feature.
    sep : str
        Separator used when concatenating (default ``' | '``).
    name : str, optional
        Name for the aggregated feature. If omitted a default label is built
        from the color and the number of grouped features.
    name_column : str
        Column to write ``name`` into (default ``'Name'``).

    Returns
    -------
    GeoDataFrame
        A single-row GeoDataFrame with the aggregated feature, in the input CRS.
        Empty (same columns) if no feature matches ``color``.

    Examples
    --------
    >>> coletivos = geo.aggregate_features_by_color(apelos, 'ab47bc')
    >>> geo.save_geojson_pretty(coletivos, "processed_data/apelos_coletivos.geojson")
    """
    from shapely.geometry import Point

    matching, _ = split_by_color(gdf, color, color_column)

    if matching.empty:
        print(f"⚠️ No features found with {color_column} == '{color}'. "
              "Returning an empty GeoDataFrame.")
        return gdf.iloc[0:0].copy()

    # Average point from representative points (a Point's representative point
    # is itself, so this is just the mean coordinate for point layers).
    reps = matching.geometry.representative_point()
    # Preserve the Z (altitude) coordinate when the source layer is 3D, so the
    # aggregated point matches the [lon, lat, z] shape of the other features.
    geoms = matching.geometry
    if (geoms.geom_type == 'Point').all() and geoms.has_z.all():
        avg_point = Point(reps.x.mean(), reps.y.mean(), geoms.z.mean())
    else:
        avg_point = Point(reps.x.mean(), reps.y.mean())

    # Build the aggregated record, defaulting every column to None.
    new_row = {col: None for col in gdf.columns}
    new_row['geometry'] = avg_point
    new_row[color_column] = color
    new_row[name_column] = name if name else f"Grupo {color} ({len(matching)} apelos)"

    for col in concat_columns:
        if col in matching.columns:
            values = [str(v).strip() for v in matching[col].dropna()
                      if str(v).strip()]
            new_row[col] = sep.join(values) if values else None

    new_gdf = gpd.GeoDataFrame([new_row], geometry='geometry', crs=gdf.crs)

    print(f"✅ Aggregated {len(matching)} '{color}' features into 1 feature.")
    return new_gdf


def group_features_by_color(gdf, color, color_column='Color',
                            concat_columns=('Link', 'Description'),
                            sep=' | ', name=None, name_column='Name'):
    """
    Replace every feature of a color with one aggregated feature, in place.

    Convenience wrapper around :func:`split_by_color` +
    :func:`aggregate_features_by_color`: it returns the non-matching features
    plus the single aggregated feature, all in one GeoDataFrame. Use this when
    you want a single combined output; use the two underlying functions when
    you want the *individuais* and *coletivos* as separate files.

    Parameters are identical to :func:`aggregate_features_by_color`.

    Returns
    -------
    GeoDataFrame
        The non-matching features plus one aggregated feature, in the same CRS
        as the input. If no feature matches ``color`` the input is returned
        unchanged (a copy).

    Examples
    --------
    >>> grouped = geo.group_features_by_color(apelos, 'ab47bc')
    >>> geo.save_geojson_pretty(grouped, "processed_data/apelos_grouped.geojson")
    """
    _, others = split_by_color(gdf, color, color_column)
    group = aggregate_features_by_color(
        gdf, color, color_column, concat_columns, sep, name, name_column
    )

    if group.empty:
        return gdf.copy()

    result = pd.concat([others, group], ignore_index=True)
    result = gpd.GeoDataFrame(result, geometry='geometry', crs=gdf.crs)

    print(f"✅ Grouped into {len(result)} total features "
          f"({len(others)} others + 1 aggregated).")
    return result


def group_all_colors_except(gdf, exclude_colors=("fbc02d",), color_column='Color',
                            color_names=None, concat_columns=('Link',), sep=' | ',
                            name_column='Name', description_column='Description',
                            description_template=(
                                "Grupo {nome} reunindo {n} apelos relativos à "
                                "desapropriação de imóveis para a abertura da "
                                "Avenida Presidente Vargas.")):
    """
    Collapse every color group into ONE aggregated feature, EXCEPT the colors in
    ``exclude_colors``, whose features are kept individually (as-is).

    Use case: every "Key Color" except one (the *apelos amarelos*, ``"fbc02d"``)
    represents a set of appeals that should appear on the map as a single grouped
    point. The excluded color stays as individual placemarks.

    Builds on :func:`aggregate_features_by_color` (averaged point keeping the Z
    coordinate, concatenated ``concat_columns``) — once per non-excluded color.
    Each aggregated feature is then labelled with its Portuguese color name
    (looked up in ``color_names``) and given an auto-generated description.

    Parameters
    ----------
    gdf : GeoDataFrame
        Source features.
    exclude_colors : iterable of str
        Color codes to keep as-is (default ``("fbc02d",)`` — amarelo).
    color_column : str
        Column holding the color code (default ``'Color'``).
    color_names : dict, optional
        Mapping ``{hex: nome}`` (e.g. ``{"ab47bc": "roxo"}``) used to label the
        grouped features. Missing colors fall back to the hex code.
    concat_columns : iterable of str
        Text columns whose values are concatenated into each grouped feature.
    sep : str
        Separator used when concatenating (default ``' | '``).
    name_column, description_column : str
        Columns to write the label and description into.
    description_template : str
        Format string receiving ``nome`` and ``n`` (the group size).

    Returns
    -------
    GeoDataFrame
        The excluded features unchanged + one aggregated feature per remaining
        color, in the input CRS.

    Examples
    --------
    >>> clean = geo.group_all_colors_except(
    ...     apelos, exclude_colors=("fbc02d",), color_names=COLOR_NAMES)
    """
    color_names = color_names or {}

    excluded = gdf[gdf[color_column].isin(exclude_colors)]
    rest = gdf[~gdf[color_column].isin(exclude_colors)]

    groups = []
    for color in rest[color_column].dropna().unique():
        agg = aggregate_features_by_color(
            rest, color, color_column, concat_columns, sep
        )
        if agg.empty:
            continue
        nome = color_names.get(color, color)
        n = int((rest[color_column] == color).sum())
        agg.loc[agg.index[0], name_column] = f"Apelos coletivos ({nome})"
        agg.loc[agg.index[0], description_column] = description_template.format(
            nome=nome, n=n
        )
        groups.append(agg)

    result = pd.concat([excluded, *groups], ignore_index=True)
    result = gpd.GeoDataFrame(result, geometry='geometry', crs=gdf.crs)

    print(f"✅ Grouped into {len(result)} total features "
          f"({len(excluded)} kept as-is + {len(groups)} aggregated groups).")
    return result


def export_raster_overlay(tif_path, out_image, out_bounds_json=None,
                          max_width=2048, src_crs=None, dst_crs='EPSG:4326',
                          quality=80, process=None, coordinates=None):
    """
    Turn a georeferenced raster (GeoTIFF) into a web-ready overlay for MapLibre.

    Use case: the 1928 aerial montage (``images/Montagem aero 1928_modified.tif``)
    is a georeferenced GeoTIFF in SIRGAS 2000 / UTM 23S. The web map renders it as
    a MapLibre ``image`` source, which needs (a) a lightweight image and (b) the
    four corner coordinates in WGS84. This helper produces both, reading the
    georeferencing straight from the GeoTIFF tags with **PIL** (no GDAL/rasterio
    dependency) and reprojecting the corners with **pyproj**.

    What it does:
        - reads ``ModelPixelScale`` (tag 33550) and ``ModelTiepoint`` (tag 33922)
          to compute the raster's bounding box in its source CRS;
        - reads the source EPSG from the ``GeoKeyDirectory`` (tag 34735) unless
          ``src_crs`` is given;
        - reprojects the four corners to ``dst_crs`` (WGS84 by default);
        - downscales the image to ``max_width`` (preserving aspect + alpha) and
          saves it (WebP by default — keeps the montage's transparent edges and
          is far smaller than PNG);
        - optionally writes ``out_bounds_json`` with the corner coordinates in the
          order MapLibre expects: ``[top-left, top-right, bottom-right, bottom-left]``.

    Parameters
    ----------
    tif_path : str
        Path to the georeferenced source GeoTIFF.
    out_image : str
        Path for the optimized output image (extension picks the format, e.g.
        ``.webp`` or ``.png``).
    out_bounds_json : str, optional
        If given, the corner coordinates are written here as JSON.
    max_width : int
        Maximum output width in pixels (default 2048). Larger images are
        downscaled; smaller ones are left untouched.
    src_crs : str, optional
        Source CRS (e.g. ``'EPSG:31983'``). If omitted it is read from the
        GeoTIFF's GeoKeyDirectory.
    dst_crs : str
        Target CRS for the corner coordinates (default ``'EPSG:4326'``).
    quality : int
        Quality for lossy formats like WebP (default 80).
    process : callable, optional
        ``Image -> Image`` treatment applied to the (resized) image before saving,
        e.g. one of :data:`RASTER_TREATMENTS` or :func:`reattach_alpha_from`. Used
        to produce visual *versions* of the same overlay.
    coordinates : list, optional
        Pre-computed ``[TL, TR, BR, BL]`` corner coordinates. When given, the
        GeoTIFF georeferencing tags are **not** read (use this for inputs without
        geo tags, such as an AI-restored PNG, reusing the original's corners).

    Returns
    -------
    dict
        ``{'coordinates': [[lon, lat], ...], 'src_crs': ..., 'dst_crs': ...,
        'image': out_image, 'size': [w, h]}`` where ``coordinates`` is the
        ``[TL, TR, BR, BL]`` corner list.

    Examples
    --------
    >>> geo.export_raster_overlay(
    ...     "images/Montagem aero 1928_modified.tif",
    ...     "web/public/historical/aero_1928.webp",
    ...     "web/public/historical/aero_1928_bounds.json")
    """
    from PIL import Image
    from pyproj import Transformer

    # Allow the very large montage to be opened without the decompression-bomb guard.
    Image.MAX_IMAGE_PIXELS = None

    if not os.path.exists(tif_path):
        raise FileNotFoundError(f"Error: Input raster not found at '{tif_path}'")

    img = Image.open(tif_path)
    w_px, h_px = img.size

    # --- georeferencing from GeoTIFF tags (unless corners were supplied) ---
    if coordinates is None:
        tags = getattr(img, 'tag_v2', {})
        pixel_scale = tags.get(33550)   # ModelPixelScale: (sx, sy, sz)
        tiepoint = tags.get(33922)      # ModelTiepoint: (i, j, k, X, Y, Z)
        if not pixel_scale or not tiepoint:
            raise ValueError(
                f"'{tif_path}' lacks ModelPixelScale/ModelTiepoint GeoTIFF tags; "
                "cannot derive its bounds. Pass coordinates=... explicitly.")

        sx, sy = float(pixel_scale[0]), float(pixel_scale[1])
        # Tiepoint maps raster pixel (i, j) to world (X, Y). For the usual top-left
        # tiepoint, world-X increases with i and world-Y decreases with j.
        i0, j0, _, x0, y0, _ = (float(v) for v in tiepoint[:6])

        e_min = x0 - i0 * sx
        e_max = e_min + w_px * sx
        n_max = y0 + j0 * sy
        n_min = n_max - h_px * sy

        # Source CRS: explicit arg, else read the projected/geographic EPSG from
        # the GeoKeyDirectory (flat list of shorts: 4-value header, then 4-tuples
        # of (KeyID, TIFFTagLocation, Count, Value)).
        if src_crs is None:
            gkd = tags.get(34735)
            epsg = None
            if gkd:
                entries = list(gkd)
                for k in range(4, len(entries) - 3, 4):
                    key_id, tag_loc, _, value = entries[k:k + 4]
                    # 3072 = ProjectedCSTypeGeoKey, 2048 = GeographicTypeGeoKey.
                    if key_id in (3072, 2048) and tag_loc == 0:
                        epsg = value
                        break
            if epsg is None:
                raise ValueError(
                    f"Could not read a CRS from '{tif_path}'. Pass src_crs "
                    "explicitly (e.g. src_crs='EPSG:31983').")
            src_crs = f"EPSG:{epsg}"

        # --- reproject the four corners to dst_crs ------------------------
        transformer = Transformer.from_crs(src_crs, dst_crs, always_xy=True)
        corners_src = {
            'TL': (e_min, n_max), 'TR': (e_max, n_max),
            'BR': (e_max, n_min), 'BL': (e_min, n_min),
        }
        coordinates = [list(transformer.transform(*corners_src[k]))
                       for k in ('TL', 'TR', 'BR', 'BL')]

    # --- optimized image --------------------------------------------------
    if img.mode not in ('RGB', 'RGBA'):
        img = img.convert('RGBA')
    if w_px > max_width:
        new_h = round(h_px * max_width / w_px)
        img = img.resize((max_width, new_h), Image.LANCZOS)

    # Optional visual treatment (grayscale, contours, AI alpha reattach, ...).
    if process is not None:
        img = process(img)

    os.makedirs(os.path.dirname(os.path.abspath(out_image)), exist_ok=True)
    save_kwargs = {}
    if os.path.splitext(out_image)[1].lower() == '.webp':
        save_kwargs = {'quality': quality, 'method': 6}
    img.save(out_image, **save_kwargs)

    result = {
        'coordinates': coordinates,
        'src_crs': src_crs,
        'dst_crs': dst_crs,
        'image': out_image,
        'size': list(img.size),
    }

    if out_bounds_json:
        os.makedirs(os.path.dirname(os.path.abspath(out_bounds_json)),
                    exist_ok=True)
        with open(out_bounds_json, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"✅ Exported overlay '{out_image}' ({img.size[0]}x{img.size[1]}) "
          f"with corners in {dst_crs}.")
    return result


# --------------------------------------------------------------------------- #
# Visual treatments ("versions") for raster overlays
# --------------------------------------------------------------------------- #
# Each treatment is an ``Image -> Image`` callable that preserves the source
# alpha (so the montage's transparent edges survive). Used by
# :func:`export_raster_overlay_variants` and :func:`export_raster_overlay`'s
# ``process`` argument to produce several looks of the same georeferenced aerial.

def _reattach_alpha(rgb_img, src_img):
    """Return ``rgb_img`` as RGB, carrying ``src_img``'s alpha if it has one."""
    out = rgb_img.convert('RGB')
    if src_img.mode == 'RGBA':
        out.putalpha(src_img.split()[3])
    return out


def _treat_grayscale(img):
    """Neutral black-and-white underlay."""
    from PIL import ImageOps
    return _reattach_alpha(ImageOps.grayscale(img.convert('RGB')), img)


def _treat_contrast(img):
    """Auto-contrast + boosted contrast so the old street grid pops."""
    from PIL import ImageOps, ImageEnhance
    base = ImageOps.autocontrast(img.convert('RGB'), cutoff=1)
    base = ImageEnhance.Contrast(base).enhance(1.35)
    return _reattach_alpha(base, img)


def _treat_sepia(img):
    """Warm archival tone."""
    from PIL import ImageOps
    gray = ImageOps.grayscale(img.convert('RGB'))
    sepia = ImageOps.colorize(gray, black=(40, 22, 8), white=(255, 235, 190))
    return _reattach_alpha(sepia, img)


def _treat_contours(img):
    """Edge-detection line art: dark lines on transparency so the live map shows
    through. Edges outside the montage (its alpha border) are suppressed."""
    from PIL import Image, ImageOps, ImageFilter, ImageChops
    gray = ImageOps.grayscale(img.convert('RGB'))
    edges = ImageOps.autocontrast(gray.filter(ImageFilter.FIND_EDGES))
    if img.mode == 'RGBA':
        # Drop the edge ring created at the transparent border.
        edges = ImageChops.multiply(edges, img.split()[3])
    lines = Image.new('RGB', img.size, (25, 25, 25))  # near-black lines
    lines.putalpha(edges)  # bright edge => opaque line, flat => transparent
    return lines


# id -> treatment callable. ``'original'`` is intentionally absent (identity).
RASTER_TREATMENTS = {
    'grayscale': _treat_grayscale,
    'contrast': _treat_contrast,
    'sepia': _treat_sepia,
    'contours': _treat_contours,
}

# id -> Portuguese label for the web version switcher (kept bilingual: ids in
# English for code, labels in Portuguese for the UI).
RASTER_VARIANT_LABELS = {
    'original': 'Original',
    'grayscale': 'Tons de cinza',
    'contrast': 'Alto contraste',
    'contours': 'Contornos',
    'sepia': 'Sépia',
    'ai': 'Ultrarrealista',
}


def reattach_alpha_from(alpha_source_path):
    """
    Build a ``process`` callable that replaces an image's alpha with the alpha of
    ``alpha_source_path`` (resized to match).

    Use case: an AI-restored aerial (super-resolution output) is RGB without the
    montage's transparent edges. Reattach the original's alpha so the restored
    version masks the same way as the others.

    Examples
    --------
    >>> geo.export_raster_overlay(
    ...     "images/aero_1928_ai.png",
    ...     "web/public/historical/aero_1928_ai.webp",
    ...     coordinates=corners,
    ...     process=geo.reattach_alpha_from("images/Montagem aero 1928_modified.tif"))
    """
    def _process(img):
        from PIL import Image
        Image.MAX_IMAGE_PIXELS = None
        src = Image.open(alpha_source_path).convert('RGBA')
        alpha = src.split()[3].resize(img.size, Image.LANCZOS)
        out = img.convert('RGB')
        out.putalpha(alpha)
        return out
    return _process


def export_raster_overlay_variants(tif_path, out_dir, base_name='aero_1928',
                                   variants=('original', 'grayscale', 'contrast',
                                             'sepia'),
                                   labels=None, manifest_name=None,
                                   max_width=2048, src_crs=None,
                                   dst_crs='EPSG:4326', quality=80):
    """
    Generate several visual *versions* of one georeferenced raster + a manifest.

    Runs the georeferencing once (from the source GeoTIFF) and writes one image
    per variant — ``<out_dir>/<base_name>_<id>.webp`` — applying the matching
    treatment from :data:`RASTER_TREATMENTS` (``'original'`` = untouched). All
    versions share the same four WGS84 corners, so the web app can swap the image
    without touching geometry.

    Parameters
    ----------
    tif_path : str
        Source georeferenced GeoTIFF.
    out_dir : str
        Directory for the output images + manifest.
    base_name : str
        Filename stem (default ``'aero_1928'``).
    variants : iterable of str
        Variant ids to produce. Unknown ids (and ``'original'``) are written
        untouched. The ``'ai'`` variant is produced separately (see
        :func:`reattach_alpha_from`) and appended to the manifest by the caller.
    labels : dict, optional
        ``{id: label}`` for the manifest (defaults to :data:`RASTER_VARIANT_LABELS`).
    manifest_name : str, optional
        Manifest filename (default ``'<base_name>_manifest.json'``).
    max_width, src_crs, dst_crs, quality
        Passed through to :func:`export_raster_overlay`.

    Returns
    -------
    dict
        ``{'coordinates': [...], 'variants': [{'id', 'label', 'file'}, ...]}`` —
        also written to the manifest file.

    Examples
    --------
    >>> geo.export_raster_overlay_variants(
    ...     "images/Montagem aero 1928_modified.tif",
    ...     "web/public/historical")
    """
    labels = labels or RASTER_VARIANT_LABELS

    coordinates = None
    entries = []
    for vid in variants:
        process = RASTER_TREATMENTS.get(vid)  # None for 'original' / unknown
        out_image = os.path.join(out_dir, f"{base_name}_{vid}.webp")
        res = export_raster_overlay(
            tif_path, out_image, max_width=max_width, src_crs=src_crs,
            dst_crs=dst_crs, quality=quality, process=process,
            coordinates=coordinates,
        )
        # Reuse the corners computed on the first (untreated) pass.
        coordinates = res['coordinates']
        entries.append({'id': vid, 'label': labels.get(vid, vid),
                        'file': os.path.basename(out_image)})

    manifest = {'coordinates': coordinates, 'variants': entries}
    manifest_path = os.path.join(out_dir, manifest_name or
                                 f"{base_name}_manifest.json")
    os.makedirs(os.path.dirname(os.path.abspath(manifest_path)), exist_ok=True)
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print(f"✅ Exported {len(entries)} overlay versions to '{out_dir}' "
          f"(+ {os.path.basename(manifest_path)}).")
    return manifest


def get_centroids(gdf, target_crs='EPSG:4326'):
    """
    Get accurate centroids by converting to projected CRS first.
    
    Parameters:
        gdf (GeoDataFrame): GeoDataFrame to get centroids from
        target_crs (str): Target CRS for output centroids (default: 'EPSG:4326')
    
    Returns:
        GeoSeries: Centroids in the target CRS
    
    Examples:
        >>> centroids = geo.get_centroids(filtro_bairros)
        >>> for label, x, y in zip(filtro_bairros.nome, centroids.x, centroids.y):
        >>>     ax.text(x, y, label)
    """
    # Convert to projected CRS for accurate centroid calculation
    projected_crs = 'EPSG:3857'  # Web Mercator
    gdf_projected = gdf.to_crs(projected_crs)
    centroids_projected = gdf_projected.geometry.centroid
    
    # Convert centroids to target CRS
    centroids_target = centroids_projected.to_crs(target_crs)

    return centroids_target


def dissolve_boundary(gdf, name=None, target_crs='EPSG:4326', buffer_clean=True,
                      simplify_m=None, min_area_m2=None):
    """
    Dissolve all features of a GeoDataFrame into a single outer boundary polygon.

    Useful for deriving a municipal limit from a neighborhood/quadra layer: the
    union of every bairro polygon is the city boundary. Internal gaps/slivers
    between adjacent polygons are optionally healed with a tiny buffer round-trip
    so the result is a clean single (multi)polygon. The raw union of a detailed
    bairro layer can carry >100k vertices (too heavy for the web), so pass
    ``simplify_m`` to thin it and ``min_area_m2`` to drop negligible islands.

    Parameters:
        gdf (GeoDataFrame): Input polygons (e.g. all bairros).
        name (str): Optional value for a 'nome' property on the output feature.
        target_crs (str): CRS of the returned GeoDataFrame (default 'EPSG:4326').
        buffer_clean (bool): Heal sliver gaps via a small buffer(+/-) in a
            projected CRS before dissolving (default True).
        simplify_m (float): Douglas-Peucker tolerance in meters applied to the
            dissolved geometry (default None = no simplification).
        min_area_m2 (float): Drop polygon parts smaller than this area in m²
            (default None = keep all parts, including small islands).

    Returns:
        GeoDataFrame: One row holding the dissolved boundary, in target_crs.

    Examples:
        >>> bairros = gpd.read_file("DATA.RIO/Limite_de_Bairros.geojson")
        >>> limite = geo.dissolve_boundary(bairros, name="Rio de Janeiro",
        ...                                simplify_m=15, min_area_m2=50_000)
        >>> geo.save_geojson_pretty(limite, "processed_data/limite_municipio.geojson")
    """
    from shapely.geometry import MultiPolygon, Polygon

    # Work in a metric CRS so tolerances are in meters and the union is robust.
    projected_crs = 'EPSG:3857'  # Web Mercator
    geom = gdf.to_crs(projected_crs).geometry

    if buffer_clean:
        # +/- 1 m closes hairline gaps between adjacent polygons without distorting shape.
        geom = geom.buffer(1.0)

    dissolved = geom.union_all() if hasattr(geom, 'union_all') else geom.unary_union

    if buffer_clean:
        dissolved = dissolved.buffer(-1.0)

    if min_area_m2:
        parts = dissolved.geoms if isinstance(dissolved, MultiPolygon) else [dissolved]
        kept = [p for p in parts if p.area >= min_area_m2]
        dissolved = MultiPolygon(kept) if len(kept) != 1 else kept[0]

    if simplify_m:
        dissolved = dissolved.simplify(simplify_m, preserve_topology=True)

    out = gpd.GeoDataFrame(
        {'nome': [name]} if name is not None else {},
        geometry=[dissolved],
        crs=projected_crs,
    ).to_crs(target_crs)

    return out