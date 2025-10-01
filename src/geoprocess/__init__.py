# src/geodata/__init__.py

import geopandas as gpd
import fiona
import os

import re
import pandas as pd
import geopandas as gpd
from bs4 import BeautifulSoup
import json

__version__ = "0.1.0"

def convert_kml_to_geojson(kml_path, geojson_path):
    """
    Reads features from a KML file and exports them to a GeoJSON file.
    """
    if not os.path.exists(kml_path):
        raise FileNotFoundError(f"Error: Input file not found at '{kml_path}'")

    try:
        # Enable KML driver support
        fiona.supported_drivers['KML'] = 'r'
        
        gdf = gpd.read_file(kml_path, driver='KML')
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