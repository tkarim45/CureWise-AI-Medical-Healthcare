"""Find nearby hospitals via the public OpenStreetMap Overpass API.

This is a user-facing convenience for emergencies. It does NOT read our own
database (the hospital-management tables were removed); it queries live OSM.
"""

import logging

import requests

logger = logging.getLogger(__name__)

_OVERPASS_URL = "https://overpass-api.de/api/interpreter"


def find_nearby_hospitals(lat: float, lng: float, radius_m: int = 10000) -> list[dict]:
    query = f"""
    [out:json];
    node["amenity"="hospital"](around:{radius_m},{lat},{lng});
    out body;
    """
    response = requests.post(_OVERPASS_URL, data=query, timeout=30)
    response.raise_for_status()
    elements = response.json().get("elements", [])
    return [
        {
            "name": e["tags"].get("name", "Unnamed Hospital"),
            "address": e["tags"].get("addr:street", "Address not available"),
            "lat": e["lat"],
            "lng": e["lon"],
        }
        for e in elements[:15]
    ]
