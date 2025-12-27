const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const cache = new Map();

/**
 * Fetch current weather and forecast from NOAA NWS API
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} Weather data
 */
export async function getCurrentWeather(lat, lon) {
    // Validate parameters
    if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) {
        console.error('Invalid coordinates:', { lat, lon });
        return {
            current: null,
            forecast: [],
            error: 'Invalid coordinates provided'
        };
    }

    const cacheKey = `weather_${lat}_${lon}`;

    // Check cache
    if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }
    }

    try {
        // Step 1: Get grid point data
        const pointsUrl = `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`;
        const pointsResponse = await fetch(pointsUrl, {
            headers: { 'User-Agent': 'AlaskaClimateExplorer/1.0' }
        });

        if (!pointsResponse.ok) {
            throw new Error(`Points API error: ${pointsResponse.status}`);
        }

        const pointsData = await pointsResponse.json();

        // Step 2: Get forecast
        const forecastUrl = pointsData.properties.forecast;
        const forecastResponse = await fetch(forecastUrl, {
            headers: { 'User-Agent': 'AlaskaClimateExplorer/1.0' }
        });

        if (!forecastResponse.ok) {
            throw new Error(`Forecast API error: ${forecastResponse.status}`);
        }

        const forecastData = await forecastResponse.json();

        // Step 3: Get current observations
        const stationsUrl = pointsData.properties.observationStations;
        const stationsResponse = await fetch(stationsUrl, {
            headers: { 'User-Agent': 'AlaskaClimateExplorer/1.0' }
        });

        let currentConditions = null;
        if (stationsResponse.ok) {
            const stationsData = await stationsResponse.json();
            if (stationsData.features && stationsData.features.length > 0) {
                const stationId = stationsData.features[0].id;
                const obsUrl = `${stationId}/observations/latest`;
                const obsResponse = await fetch(obsUrl, {
                    headers: { 'User-Agent': 'AlaskaClimateExplorer/1.0' }
                });

                if (obsResponse.ok) {
                    const obsData = await obsResponse.json();
                    currentConditions = obsData.properties;
                }
            }
        }

        const weatherData = {
            current: currentConditions,
            forecast: forecastData.properties.periods,
            location: pointsData.properties.relativeLocation.properties
        };

        // Cache the result
        cache.set(cacheKey, {
            data: weatherData,
            timestamp: Date.now()
        });

        return weatherData;
    } catch (error) {
        console.error('Weather API error:', error);
        return {
            current: null,
            forecast: [],
            error: error.message
        };
    }
}

/**
 * Get weather alerts for Alaska
 * @returns {Promise<Array>} Array of active alerts
 */
export async function getAlerts() {
    try {
        const alertsUrl = 'https://api.weather.gov/alerts/active?area=AK';
        const response = await fetch(alertsUrl, {
            headers: { 'User-Agent': 'AlaskaClimateExplorer/1.0' }
        });

        if (!response.ok) {
            throw new Error(`Alerts API error: ${response.status}`);
        }

        const data = await response.json();
        return data.features || [];
    } catch (error) {
        console.error('Alerts API error:', error);
        return [];
    }
}
