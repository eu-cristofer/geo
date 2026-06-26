# src/geodata/__init__.py

import geopandas as gpd
import fiona
import os

import re
import pandas as pd
import geopandas as gpd
from bs4 import BeautifulSoup
import json

__version__ = "0.3.0"

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