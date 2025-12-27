// Alaska locations with coordinates
export const ALASKA_LOCATIONS = {
    anchorage: { name: 'Anchorage', lat: 61.2181, lon: -149.9003 },
    fairbanks: { name: 'Fairbanks', lat: 64.8378, lon: -147.7164 },
    juneau: { name: 'Juneau', lat: 58.3019, lon: -134.4197 },
    ketchikan: { name: 'Ketchikan', lat: 55.3422, lon: -131.6461 },
    barrow: { name: 'Utqiaġvik (Barrow)', lat: 71.2906, lon: -156.7886 },
    nome: { name: 'Nome', lat: 66.8983, lon: -162.5989 },
    kodiak: { name: 'Kodiak', lat: 57.7900, lon: -152.4072 }
};

/**
 * Convert location name to coordinates
 * @param {string} locationKey - Key from ALASKA_LOCATIONS
 * @returns {Object} {lat, lon, name}
 */
export function getLocationCoordinates(locationKey) {
    return ALASKA_LOCATIONS[locationKey] || ALASKA_LOCATIONS.anchorage;
}

/**
 * Parse lat,lon string to object
 * @param {string} latLonString - "lat,lon" format
 * @returns {Object} {lat, lon}
 */
export function parseLatLon(latLonString) {
    if (!latLonString || typeof latLonString !== 'string') {
        console.error('Invalid latLonString:', latLonString);
        return { lat: 61.2181, lon: -149.9003 }; // Default to Anchorage
    }
    const [lat, lon] = latLonString.split(',').map(Number);
    if (isNaN(lat) || isNaN(lon)) {
        console.error('Failed to parse coordinates:', latLonString);
        return { lat: 61.2181, lon: -149.9003 }; // Default to Anchorage
    }
    return { lat, lon };
}
