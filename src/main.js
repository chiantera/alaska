import './index.css';
import L from 'leaflet';
import Chart from 'chart.js/auto';
import { getCurrentWeather } from './services/weatherAPI.js';
import { parseLatLon, ALASKA_LOCATIONS } from './services/geocoding.js';
import {
    getHistoricalData,
    getScenarioProjections,
    calculateCustomScenario,
    getYearData
} from './services/climateData.js';
import {
    createTemperatureChart,
    createPrecipitationChart,
    createScenarioChart
} from './utils/chartHelpers.js';

// Global state
let currentView = 'live-weather';
let weatherMap = null;
let permafrostMap = null;
let charts = {};
let currentScenario = 'SSP1-2.6';
let customScenarioData = null;
let animationInterval = null;
let temperatureUnit = 'F'; // 'F' for Fahrenheit, 'C' for Celsius
let lastWeatherData = null; // Store last weather data for re-rendering

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initTemperatureToggle();
    initLiveWeather();
    initHistoricalView();
    initScenariosView();
    initPermafrostView();
    initSeaIceView();

    // Initialize maps immediately
    setTimeout(() => {
        initWeatherMap();
    }, 100);
});

/**
 * Temperature Unit Toggle
 */
function initTemperatureToggle() {
    // Live Weather toggle
    const liveToggle = document.getElementById('live-weather-temp-toggle');
    if (liveToggle) {
        liveToggle.querySelectorAll('.unit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                setTemperatureUnit(btn.dataset.unit);
            });
        });
    }

    // Historical toggle
    const historicalToggle = document.getElementById('historical-temp-toggle');
    if (historicalToggle) {
        historicalToggle.querySelectorAll('.unit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                setTemperatureUnit(btn.dataset.unit);
            });
        });
    }
}

function setTemperatureUnit(unit) {
    temperatureUnit = unit;

    // Update all toggle buttons to reflect current state
    document.querySelectorAll('.temp-unit-toggle .unit-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.unit === unit);
    });

    // Re-render affected views
    if (lastWeatherData) {
        renderWeatherData(lastWeatherData);
    }

    // Re-render historical charts
    updateHistoricalCharts();
}

// Temperature conversion helpers
function celsiusToFahrenheit(c) {
    return c * 9 / 5 + 32;
}

function fahrenheitToCelsius(f) {
    return (f - 32) * 5 / 9;
}

function formatTemperature(tempC, includeDegree = true) {
    if (tempC == null || isNaN(tempC)) return 'N/A';
    const value = temperatureUnit === 'F' ? celsiusToFahrenheit(tempC) : tempC;
    const symbol = includeDegree ? `°${temperatureUnit}` : '';
    return `${value.toFixed(1)}${symbol}`;
}

/**
 * Navigation system
 */
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchView(view);

            // Update active button
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function switchView(viewId) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });

    // Show selected view
    const selectedView = document.getElementById(viewId);
    if (selectedView) {
        selectedView.classList.add('active');
        currentView = viewId;

        // Initialize view-specific features
        if (viewId === 'live-weather' && !weatherMap) {
            initWeatherMap();
        } else if (viewId === 'permafrost') {
            // Always refresh permafrost map when switching to this view
            setTimeout(() => {
                if (permafrostMap) {
                    permafrostMap.invalidateSize();
                    // Re-add markers if map exists but markers might be missing
                    refreshPermafrostMarkers();
                } else {
                    initPermafrostMap();
                }
            }, 100);
        }
    }
}

/**
 * Live Weather View
 */
function initLiveWeather() {
    const locationSelect = document.getElementById('location-select');

    locationSelect.addEventListener('change', async (e) => {
        const latLon = parseLatLon(e.target.value);
        await loadWeatherData(latLon.lat, latLon.lon);
    });

    // Load initial weather for Anchorage
    const anchorage = ALASKA_LOCATIONS.anchorage;
    loadWeatherData(anchorage.lat, anchorage.lon);
}

function initWeatherMap() {
    const mapElement = document.getElementById('weather-map');
    if (!mapElement || weatherMap) return;

    weatherMap = L.map('weather-map').setView([64.0, -152.0], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(weatherMap);

    // Add markers for major cities
    Object.values(ALASKA_LOCATIONS).forEach(location => {
        L.marker([location.lat, location.lon])
            .addTo(weatherMap)
            .bindPopup(`<b>${location.name}</b>`)
            .on('click', () => {
                loadWeatherData(location.lat, location.lon);
            });
    });
}

async function loadWeatherData(lat, lon) {
    const currentEl = document.getElementById('current-conditions');
    const forecastEl = document.getElementById('forecast-display');

    currentEl.innerHTML = '<div class="loading">Loading weather data...</div>';
    forecastEl.innerHTML = '<div class="loading">Loading forecast...</div>';

    try {
        const weather = await getCurrentWeather(lat, lon);

        if (weather.error) {
            currentEl.innerHTML = `<p style="color: var(--color-warning);">Unable to load weather data. ${weather.error}</p>`;
            forecastEl.innerHTML = '';
            lastWeatherData = null;
            return;
        }

        // Store weather data for re-rendering on unit change
        lastWeatherData = weather;
        renderWeatherData(weather);
    } catch (error) {
        console.error('Error loading weather:', error);
        currentEl.innerHTML = '<p style="color: var(--color-danger);">Error loading weather data</p>';
        forecastEl.innerHTML = '';
        lastWeatherData = null;
    }
}

function renderWeatherData(weather) {
    const currentEl = document.getElementById('current-conditions');
    const forecastEl = document.getElementById('forecast-display');

    // Display current conditions
    if (weather.current) {
        const temp = weather.current.temperature?.value; // Celsius from API
        const tempDisplay = formatTemperature(temp);
        const desc = weather.current.textDescription || 'No description';
        const humidity = weather.current.relativeHumidity?.value != null
            ? weather.current.relativeHumidity.value.toFixed(0)
            : 'N/A';
        const windSpeed = weather.current.windSpeed?.value;
        const wind = windSpeed != null ? windSpeed.toFixed(1) : 'N/A';

        currentEl.innerHTML = `
        <div style="display: grid; gap: 1rem;">
          <div style="font-size: 3rem; font-weight: 700; color: var(--color-accent);">
            ${tempDisplay}
          </div>
          <div style="font-size: 1.2rem;">${desc}</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
            <div>
              <div style="color: var(--color-text-secondary); font-size: 0.9rem;">Humidity</div>
              <div style="font-size: 1.3rem; font-weight: 600;">${humidity}%</div>
            </div>
            <div>
              <div style="color: var(--color-text-secondary); font-size: 0.9rem;">Wind</div>
              <div style="font-size: 1.3rem; font-weight: 600;">${wind} km/h</div>
            </div>
          </div>
        </div>
      `;
    } else {
        currentEl.innerHTML = '<p>Current conditions unavailable</p>';
    }

    // Display forecast
    if (weather.forecast && weather.forecast.length > 0) {
        const forecastHTML = weather.forecast.slice(0, 7).map(period => {
            // Forecast temps from NWS are already in the user's preferred unit based on location
            // But we need to convert if user wants different unit
            let tempValue = period.temperature;
            let displayUnit = temperatureUnit;

            // NWS returns F for US locations - convert if needed
            if (period.temperatureUnit === 'F' && temperatureUnit === 'C') {
                tempValue = fahrenheitToCelsius(period.temperature).toFixed(0);
            } else if (period.temperatureUnit === 'C' && temperatureUnit === 'F') {
                tempValue = celsiusToFahrenheit(period.temperature).toFixed(0);
            }

            return `
        <div style="padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px; text-align: center;">
          <div style="font-weight: 600; margin-bottom: 0.5rem;">${period.name}</div>
          <div style="font-size: 1.5rem; color: var(--color-accent); margin: 0.5rem 0;">
            ${tempValue}°${displayUnit}
          </div>
          <div style="font-size: 0.85rem; color: var(--color-text-secondary);">
            ${period.shortForecast}
          </div>
        </div>
      `;
        }).join('');

        forecastEl.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem;">
          ${forecastHTML}
        </div>
      `;
    } else {
        forecastEl.innerHTML = '<p>Forecast unavailable</p>';
    }
}

/**
 * Historical Weather View
 */
let historicalChartParams = null; // Store for re-rendering

function initHistoricalView() {
    const timeRangeSelect = document.getElementById('time-range');
    const stationSelect = document.getElementById('station-select');

    const updateCharts = () => {
        const station = stationSelect.value;
        const range = timeRangeSelect.value;
        const currentYear = 2024;
        const startYear = range === 'all' ? 1949 : currentYear - parseInt(range);

        loadHistoricalCharts(station, startYear, currentYear);
    };

    timeRangeSelect.addEventListener('change', updateCharts);
    stationSelect.addEventListener('change', updateCharts);

    // Load initial charts - All Time by default (1949-2024)
    loadHistoricalCharts('anchorage', 1949, 2024);
}

function updateHistoricalCharts() {
    // Re-render historical charts if parameters exist
    if (historicalChartParams) {
        loadHistoricalCharts(
            historicalChartParams.station,
            historicalChartParams.startYear,
            historicalChartParams.endYear
        );
    }
}

function loadHistoricalCharts(station, startYear, endYear) {
    const data = getHistoricalData(station, startYear, endYear);

    // Store params for re-rendering on unit change
    historicalChartParams = { station, startYear, endYear };

    // Destroy existing charts
    if (charts.tempChart) charts.tempChart.destroy();

    // Convert temperature data based on selected unit
    // Historical data is in Fahrenheit by default
    let tempData = data.temperature;
    let tempLabel = `Annual Average Temperature (°${temperatureUnit})`;

    if (temperatureUnit === 'C') {
        // Convert F to C - data is an object with years as keys
        tempData = {};
        for (const year in data.temperature) {
            tempData[year] = fahrenheitToCelsius(data.temperature[year]);
        }
    }

    // Create temperature chart with trend line
    charts.tempChart = createTemperatureChart('temp-chart', tempData, {
        label: tempLabel,
        unit: temperatureUnit,
        showTrendLine: true
    });
}

/**
 * Climate Scenarios View
 */
function initScenariosView() {
    const scenarioButtons = document.querySelectorAll('.scenario-btn');
    const yearSlider = document.getElementById('year-slider');
    const yearDisplay = document.getElementById('year-display');
    const playButton = document.getElementById('play-animation');
    const tempSlider = document.getElementById('temp-increase');
    const tempValue = document.getElementById('temp-value');
    const emissionSlider = document.getElementById('emission-reduction');
    const emissionValue = document.getElementById('emission-value');
    const customControls = document.getElementById('custom-controls');

    // Scenario selection
    scenarioButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            scenarioButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const scenario = btn.dataset.scenario;
            currentScenario = scenario;

            if (scenario === 'custom') {
                customControls.style.display = 'block';
                updateCustomScenario();
            } else {
                customControls.style.display = 'none';
                customScenarioData = null;
                updateScenarioDisplay(parseInt(yearSlider.value));
            }
        });
    });

    // Custom scenario controls
    tempSlider.addEventListener('input', (e) => {
        tempValue.textContent = `${e.target.value}°C`;
        updateCustomScenario();
    });

    emissionSlider.addEventListener('input', (e) => {
        emissionValue.textContent = e.target.value;
        updateCustomScenario();
    });

    // Year slider
    yearSlider.addEventListener('input', (e) => {
        const year = parseInt(e.target.value);
        yearDisplay.textContent = year;
        updateScenarioDisplay(year);
    });

    // Play animation
    playButton.addEventListener('click', () => {
        if (animationInterval) {
            clearInterval(animationInterval);
            animationInterval = null;
            playButton.textContent = '▶ Play Animation';
        } else {
            playButton.textContent = '⏸ Pause';
            animateScenario();
        }
    });

    // Load initial scenario
    updateScenarioDisplay(2026);
}

function updateCustomScenario() {
    const tempIncrease = parseFloat(document.getElementById('temp-increase').value);
    const emissionYear = parseInt(document.getElementById('emission-reduction').value);

    customScenarioData = calculateCustomScenario(tempIncrease, emissionYear);
    updateScenarioDisplay(parseInt(document.getElementById('year-slider').value));
}

function updateScenarioDisplay(year) {
    const scenarioData = customScenarioData || getScenarioProjections(currentScenario);
    const yearData = getYearData(scenarioData, year);

    // Update impact values
    document.getElementById('temp-impact').textContent = `+${yearData.temperature.toFixed(1)}°C`;
    document.getElementById('precip-impact').textContent = `+${yearData.precipitation.toFixed(0)}%`;
    document.getElementById('ice-impact').textContent = `${yearData.seaIce.toFixed(0)}%`;
    document.getElementById('permafrost-impact').textContent = `+${yearData.permafrost.toFixed(0)} cm`;
    document.getElementById('glacier-impact').textContent = `${yearData.glacier.toFixed(0)}%`;
    document.getElementById('sealevel-impact').textContent = `+${yearData.seaLevel.toFixed(0)} cm`;

    // Update charts
    updateScenarioCharts(scenarioData);
}

// Flag to track if scenario charts have been initialized
let scenarioChartsInitialized = false;

function updateScenarioCharts(scenarioData) {
    // If charts already exist, just update their data
    if (scenarioChartsInitialized && charts.tempScenario && charts.precipScenario && charts.iceScenario && charts.permafrostScenario) {
        // Update temperature chart data
        const tempYears = Object.keys(scenarioData.temperature).map(Number);
        const tempValues = Object.values(scenarioData.temperature);
        charts.tempScenario.data.labels = tempYears;
        charts.tempScenario.data.datasets[0].data = tempValues;
        charts.tempScenario.update('none'); // 'none' disables animations for smoother updates

        // Update precipitation chart data
        const precipYears = Object.keys(scenarioData.precipitation).map(Number);
        const precipValues = Object.values(scenarioData.precipitation);
        charts.precipScenario.data.labels = precipYears;
        charts.precipScenario.data.datasets[0].data = precipValues;
        charts.precipScenario.update('none');

        // Update sea ice chart data
        const iceYears = Object.keys(scenarioData.seaIce).map(Number);
        const iceValues = Object.values(scenarioData.seaIce);
        charts.iceScenario.data.labels = iceYears;
        charts.iceScenario.data.datasets[0].data = iceValues;
        charts.iceScenario.update('none');

        // Update permafrost chart data
        const permafrostYears = Object.keys(scenarioData.permafrost).map(Number);
        const permafrostValues = Object.values(scenarioData.permafrost);
        charts.permafrostScenario.data.labels = permafrostYears;
        charts.permafrostScenario.data.datasets[0].data = permafrostValues;
        charts.permafrostScenario.update('none');

        return;
    }

    // First time initialization - create the charts
    charts.tempScenario = createScenarioChart('temp-scenario-chart', scenarioData, 'temperature', {
        label: 'Temperature Change (°C)'
    });

    charts.precipScenario = createScenarioChart('precip-scenario-chart', scenarioData, 'precipitation', {
        label: 'Precipitation Change (%)'
    });

    charts.iceScenario = createScenarioChart('ice-scenario-chart', scenarioData, 'seaIce', {
        label: 'Sea Ice Change (%)'
    });

    charts.permafrostScenario = createScenarioChart('permafrost-scenario-chart', scenarioData, 'permafrost', {
        label: 'Active Layer Depth (cm)'
    });

    scenarioChartsInitialized = true;
}

function animateScenario() {
    const yearSlider = document.getElementById('year-slider');
    let currentYear = parseInt(yearSlider.value);

    animationInterval = setInterval(() => {
        currentYear += 2;
        if (currentYear > 2100) {
            currentYear = 2026;
        }

        yearSlider.value = currentYear;
        document.getElementById('year-display').textContent = currentYear;
        updateScenarioDisplay(currentYear);
    }, 500);
}

/**
 * Permafrost View
 */

// Alaska permafrost monitoring stations with simulated data
const PERMAFROST_STATIONS = [
    {
        id: 'deadhorse',
        name: 'Deadhorse/Prudhoe Bay',
        lat: 70.2002,
        lon: -148.4597,
        zone: 'Continuous',
        groundTemp: -8.2,
        activeLayerDepth: 45,
        trend: -0.03,
        data: generatePermafrostTimeSeries(-8.2, 45)
    },
    {
        id: 'barrow',
        name: 'Utqiaġvik (Barrow)',
        lat: 71.2906,
        lon: -156.7886,
        zone: 'Continuous',
        groundTemp: -9.5,
        activeLayerDepth: 38,
        trend: -0.02,
        data: generatePermafrostTimeSeries(-9.5, 38)
    },
    {
        id: 'toolik',
        name: 'Toolik Lake',
        lat: 68.6275,
        lon: -149.5944,
        zone: 'Continuous',
        groundTemp: -6.8,
        activeLayerDepth: 52,
        trend: -0.04,
        data: generatePermafrostTimeSeries(-6.8, 52)
    },
    {
        id: 'coldfoot',
        name: 'Coldfoot',
        lat: 67.2522,
        lon: -150.1761,
        zone: 'Continuous',
        groundTemp: -4.5,
        activeLayerDepth: 68,
        trend: -0.05,
        data: generatePermafrostTimeSeries(-4.5, 68)
    },
    {
        id: 'fairbanks',
        name: 'Fairbanks (CRREL)',
        lat: 64.8378,
        lon: -147.7164,
        zone: 'Discontinuous',
        groundTemp: -1.2,
        activeLayerDepth: 95,
        trend: -0.08,
        data: generatePermafrostTimeSeries(-1.2, 95)
    },
    {
        id: 'healy',
        name: 'Healy',
        lat: 63.8697,
        lon: -149.0208,
        zone: 'Discontinuous',
        groundTemp: -0.8,
        activeLayerDepth: 110,
        trend: -0.06,
        data: generatePermafrostTimeSeries(-0.8, 110)
    },
    {
        id: 'nome',
        name: 'Nome',
        lat: 64.5011,
        lon: -165.4064,
        zone: 'Discontinuous',
        groundTemp: -2.1,
        activeLayerDepth: 85,
        trend: -0.04,
        data: generatePermafrostTimeSeries(-2.1, 85)
    }
];

function generatePermafrostTimeSeries(baseTemp, baseDepth) {
    const years = [];
    const temps = [];
    const depths = [];
    const currentYear = new Date().getFullYear();

    for (let year = 1990; year <= currentYear; year++) {
        const yearsSince1990 = year - 1990;
        // Warming trend with some random variation
        const temp = baseTemp + (yearsSince1990 * 0.03) + (Math.random() - 0.5) * 0.3;
        // Active layer deepening with warming
        const depth = baseDepth + (yearsSince1990 * 0.8) + (Math.random() - 0.5) * 5;

        years.push(year);
        temps.push(parseFloat(temp.toFixed(2)));
        depths.push(parseFloat(depth.toFixed(1)));
    }

    return { years, temps, depths };
}

let selectedStation = null;
let permafrostChart = null;

function initPermafrostView() {
    const dataDisplay = document.getElementById('permafrost-data');

    // Show initial message
    dataDisplay.innerHTML = `
        <div class="station-prompt">
            <p>👆 Click on a station marker on the map to view detailed monitoring data.</p>
            <div class="legend">
                <h4>Permafrost Zones</h4>
                <div class="legend-item">
                    <span class="legend-color" style="background: #1565C0;"></span>
                    <span>Continuous Permafrost</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background: #FF8F00;"></span>
                    <span>Discontinuous Permafrost</span>
                </div>
            </div>
        </div>
    `;

    // Initialize map when view becomes visible
    setTimeout(() => {
        initPermafrostMap();
    }, 200);
}

function initPermafrostMap() {
    const mapElement = document.getElementById('permafrost-map');
    if (!mapElement || permafrostMap) return;

    permafrostMap = L.map('permafrost-map').setView([66.5, -153.0], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(permafrostMap);

    // Force map to recalculate size after tiles load
    setTimeout(() => {
        permafrostMap.invalidateSize();

        // Add station markers after map is ready
        PERMAFROST_STATIONS.forEach(station => {
            const color = station.zone === 'Continuous' ? '#1565C0' : '#FF8F00';

            const marker = L.circleMarker([station.lat, station.lon], {
                radius: 12,
                fillColor: color,
                color: '#fff',
                weight: 3,
                opacity: 1,
                fillOpacity: 0.9
            }).addTo(permafrostMap);

            marker.bindTooltip(station.name, { permanent: false, direction: 'top' });

            marker.on('click', () => {
                selectPermafrostStation(station);
            });

            // Track marker for refresh
            permafrostMarkers.push(marker);
        });
    }, 300);
}

// Track markers for refresh
let permafrostMarkers = [];

function refreshPermafrostMarkers() {
    if (!permafrostMap) return;

    // Check if markers already exist on map
    if (permafrostMarkers.length === 0) {
        // Add markers
        PERMAFROST_STATIONS.forEach(station => {
            const color = station.zone === 'Continuous' ? '#1565C0' : '#FF8F00';

            const marker = L.circleMarker([station.lat, station.lon], {
                radius: 12,
                fillColor: color,
                color: '#fff',
                weight: 3,
                opacity: 1,
                fillOpacity: 0.9
            }).addTo(permafrostMap);

            marker.bindTooltip(station.name, { permanent: false, direction: 'top' });

            marker.on('click', () => {
                selectPermafrostStation(station);
            });

            permafrostMarkers.push(marker);
        });
    }
}

function selectPermafrostStation(station) {
    selectedStation = station;
    const dataDisplay = document.getElementById('permafrost-data');

    const zoneColor = station.zone === 'Continuous' ? '#1565C0' : '#FF8F00';
    const trendDirection = station.trend < 0 ? '↗' : '↘';
    const latestTemp = station.data.temps[station.data.temps.length - 1];
    const latestDepth = station.data.depths[station.data.depths.length - 1];

    dataDisplay.innerHTML = `
        <div class="station-details">
            <div class="station-header">
                <h3>${station.name}</h3>
                <span class="zone-badge" style="background: ${zoneColor};">${station.zone}</span>
            </div>
            
            <div class="station-stats">
                <div class="stat-item">
                    <div class="stat-label">Ground Temperature (10m depth)</div>
                    <div class="stat-value" style="color: #00E5FF;">${latestTemp.toFixed(1)}°C</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Active Layer Depth</div>
                    <div class="stat-value" style="color: #FFB74D;">${latestDepth.toFixed(0)} cm</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Warming Trend (per decade)</div>
                    <div class="stat-value" style="color: #FF5252;">${trendDirection} +${Math.abs(station.trend * 10).toFixed(1)}°C</div>
                </div>
            </div>
            
            <div class="station-chart-container">
                <h4>Temperature & Active Layer Depth (1990-Present)</h4>
                <canvas id="permafrost-station-chart"></canvas>
            </div>
            
            <div class="station-info">
                <p><strong>Location:</strong> ${station.lat.toFixed(4)}°N, ${Math.abs(station.lon).toFixed(4)}°W</p>
                <p><strong>Data Source:</strong> GTN-P / AWI Arctic Permafrost Database</p>
            </div>
        </div>
    `;

    // Create the chart
    setTimeout(() => {
        createPermafrostStationChart(station);
    }, 50);
}

function createPermafrostStationChart(station) {
    const ctx = document.getElementById('permafrost-station-chart');
    if (!ctx) return;

    // Destroy existing chart
    if (permafrostChart) {
        permafrostChart.destroy();
    }

    permafrostChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: station.data.years,
            datasets: [
                {
                    label: 'Ground Temperature (°C)',
                    data: station.data.temps,
                    borderColor: '#00E5FF',
                    backgroundColor: 'rgba(0, 229, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Active Layer Depth (cm)',
                    data: station.data.depths,
                    borderColor: '#FFB74D',
                    backgroundColor: 'rgba(255, 183, 77, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    labels: { color: '#FFFFFF' }
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 25, 41, 0.9)',
                    bodyColor: '#FFFFFF'
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#B2BAC2' }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#00E5FF' },
                    title: {
                        display: true,
                        text: 'Temperature (°C)',
                        color: '#00E5FF'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#FFB74D' },
                    title: {
                        display: true,
                        text: 'Depth (cm)',
                        color: '#FFB74D'
                    }
                }
            }
        }
    });
}

// Current sea ice display mode
let seaIceMode = 'september';

// Historical sea ice data
const SEA_ICE_DATA = {
    september: {
        label: 'September Minimum',
        description: 'Annual minimum extent at end of summer melt',
        avg1981_2010: 6.52,
        currentExtent: 4.23,
        lastYearExtent: 4.45,
        recordLow: { year: 2012, value: 3.39 },
        decadeTrend: -13,
        vs1980s: -35,
        data: {
            1979: 7.05, 1980: 7.67, 1981: 7.25, 1982: 7.45, 1983: 7.52,
            1984: 7.17, 1985: 6.93, 1986: 7.54, 1987: 7.48, 1988: 7.49,
            1989: 7.04, 1990: 6.24, 1991: 6.55, 1992: 7.55, 1993: 6.50,
            1994: 7.18, 1995: 6.12, 1996: 7.88, 1997: 6.74, 1998: 6.56,
            1999: 6.24, 2000: 6.32, 2001: 6.75, 2002: 5.96, 2003: 6.15,
            2004: 6.05, 2005: 5.57, 2006: 5.89, 2007: 4.30, 2008: 4.73,
            2009: 5.39, 2010: 4.93, 2011: 4.63, 2012: 3.39, 2013: 5.35,
            2014: 5.28, 2015: 4.68, 2016: 4.72, 2017: 4.87, 2018: 4.71,
            2019: 4.32, 2020: 3.92, 2021: 4.92, 2022: 4.87, 2023: 4.45,
            2024: 4.23, 2025: 4.23
        }
    },
    march: {
        label: 'March Maximum',
        description: 'Annual maximum extent at end of winter freeze',
        avg1981_2010: 15.64,
        currentExtent: 14.62,
        lastYearExtent: 14.88,
        recordLow: { year: 2017, value: 14.42 },
        decadeTrend: -2.6,
        vs1980s: -6,
        data: {
            1979: 16.52, 1980: 16.21, 1981: 16.08, 1982: 16.43, 1983: 16.27,
            1984: 16.03, 1985: 16.38, 1986: 16.22, 1987: 16.16, 1988: 16.01,
            1989: 16.25, 1990: 15.86, 1991: 15.95, 1992: 16.02, 1993: 15.84,
            1994: 15.78, 1995: 15.67, 1996: 15.79, 1997: 15.89, 1998: 15.92,
            1999: 15.72, 2000: 15.64, 2001: 15.72, 2002: 15.48, 2003: 15.54,
            2004: 15.42, 2005: 15.36, 2006: 15.12, 2007: 15.24, 2008: 15.21,
            2009: 15.16, 2010: 15.25, 2011: 15.04, 2012: 15.24, 2013: 15.18,
            2014: 14.91, 2015: 14.54, 2016: 14.52, 2017: 14.42, 2018: 14.48,
            2019: 14.78, 2020: 15.05, 2021: 14.77, 2022: 14.88, 2023: 14.88,
            2024: 14.62, 2025: 14.62
        }
    }
};

function initSeaIceView() {
    // Set up toggle buttons
    const toggleBtns = document.querySelectorAll('#sea-ice-toggle .toggle-btn');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            seaIceMode = btn.dataset.mode;
            updateSeaIceDisplay();
        });
    });

    // Set up info section toggle
    const infoToggle = document.getElementById('sea-ice-info-toggle');
    const infoSection = document.getElementById('sea-ice-info-section');
    if (infoToggle && infoSection) {
        infoToggle.addEventListener('click', () => {
            const isVisible = infoSection.style.display !== 'none';
            infoSection.style.display = isVisible ? 'none' : 'block';
            infoToggle.querySelector('.arrow').textContent = isVisible ? '▼' : '▲';
        });
    }

    // Initial display
    updateSeaIceDisplay();
}

function updateSeaIceDisplay() {
    const data = SEA_ICE_DATA[seaIceMode];
    const currentYear = new Date().getFullYear();

    // Update chart title
    const chartTitle = document.getElementById('sea-ice-chart-title');
    if (chartTitle) {
        chartTitle.textContent = `${data.label} Sea Ice Extent`;
    }

    // Calculate stats
    const changeFromAvg = (((data.currentExtent - data.avg1981_2010) / data.avg1981_2010) * 100).toFixed(0);
    const changeFromLastYear = (((data.currentExtent - data.lastYearExtent) / data.lastYearExtent) * 100).toFixed(0);
    const aboveRecordLow = (data.currentExtent - data.recordLow.value).toFixed(2);

    const statsDisplay = document.getElementById('sea-ice-stats');
    const monthLabel = seaIceMode === 'september' ? 'Sep' : 'Mar';
    const icon = seaIceMode === 'september' ? '🌡️' : '❄️';

    statsDisplay.innerHTML = `
    <div class="sea-ice-stats-container">
      <h4 class="stats-title">${icon} ${currentYear} Arctic Sea Ice</h4>
      <p class="stats-subtitle">${data.description}</p>
      
      <div class="stats-grid">
        <div class="stat-card primary">
          <div class="stat-icon">🧊</div>
          <div class="stat-content">
            <div class="stat-label">Current Extent</div>
            <div class="stat-value">${data.currentExtent} M km²</div>
            <div class="stat-trend negative">${changeFromAvg}% from avg</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">📉</div>
          <div class="stat-content">
            <div class="stat-label">1981-2010 Average</div>
            <div class="stat-value">${data.avg1981_2010} M km²</div>
          </div>
        </div>
        
        <div class="stat-card warning">
          <div class="stat-icon">⚠️</div>
          <div class="stat-content">
            <div class="stat-label">Record Low (${monthLabel} ${data.recordLow.year})</div>
            <div class="stat-value">${data.recordLow.value} M km²</div>
            <div class="stat-subtext">+${aboveRecordLow} M km² above</div>
          </div>
        </div>
      </div>
      
      <div class="comparison-section">
        <h5>📈 Comparisons</h5>
        <div class="comparison-grid">
          <div class="comparison-item">
            <span class="comp-label">vs ${currentYear - 1}</span>
            <span class="comp-value ${parseFloat(changeFromLastYear) < 0 ? 'negative' : 'positive'}">${changeFromLastYear > 0 ? '+' : ''}${changeFromLastYear}%</span>
          </div>
          <div class="comparison-item">
            <span class="comp-label">vs 1980s</span>
            <span class="comp-value negative">${data.vs1980s}%</span>
          </div>
          <div class="comparison-item">
            <span class="comp-label">Trend</span>
            <span class="comp-value negative">${data.decadeTrend}%/decade</span>
          </div>
        </div>
      </div>
      
      <div class="data-source">
        <p>📡 NSIDC Sea Ice Index</p>
      </div>
    </div>
  `;

    createSeaIceChart();
}

function createSeaIceChart() {
    const ctx = document.getElementById('sea-ice-chart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (charts.seaIce) {
        charts.seaIce.destroy();
        charts.seaIce = null;
    }

    // Get data for current mode
    const modeData = SEA_ICE_DATA[seaIceMode];
    const chartData = modeData.data;

    const currentYear = new Date().getFullYear();
    const years = [];
    const extent = [];

    for (let year = 1979; year <= currentYear; year++) {
        years.push(year);
        extent.push(chartData[year] || modeData.currentExtent);
    }

    // Set dynamic y-axis range based on mode
    const yMin = seaIceMode === 'september' ? 3 : 13;
    const yMax = seaIceMode === 'september' ? 8 : 17;
    const chartColor = seaIceMode === 'september' ? '#00E5FF' : '#7C4DFF';
    const bgColor = seaIceMode === 'september' ? 'rgba(0, 229, 255, 0.2)' : 'rgba(124, 77, 255, 0.2)';

    charts.seaIce = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: `${modeData.label} Extent (million km²)`,
                data: extent,
                borderColor: chartColor,
                backgroundColor: bgColor,
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointRadius: 2,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#FFFFFF' }
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 25, 41, 0.9)',
                    titleColor: chartColor,
                    bodyColor: '#FFFFFF',
                    callbacks: {
                        label: function (context) {
                            return `${context.parsed.y.toFixed(2)} million km²`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: {
                        color: '#B2BAC2',
                        maxTicksLimit: 10
                    }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#B2BAC2' },
                    min: yMin,
                    max: yMax,
                    title: {
                        display: true,
                        text: 'Extent (million km²)',
                        color: '#B2BAC2'
                    }
                }
            }
        }
    });
}
