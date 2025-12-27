import Chart from 'chart.js/auto';

/**
 * Create temperature trend chart
 */
export function createTemperatureChart(canvasId, data, options = {}) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    const years = Object.keys(data).map(Number);
    const temps = Object.values(data);

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: options.label || 'Temperature (°F)',
                data: temps,
                borderColor: '#00E676',
                backgroundColor: 'rgba(0, 230, 118, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5
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
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(10, 25, 41, 0.9)',
                    titleColor: '#00E676',
                    bodyColor: '#FFFFFF'
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#B2BAC2' }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#B2BAC2' }
                }
            },
            ...options.chartOptions
        }
    });
}

/**
 * Create precipitation chart
 */
export function createPrecipitationChart(canvasId, data, options = {}) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    const years = Object.keys(data).map(Number);
    const precip = Object.values(data);

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [{
                label: options.label || 'Precipitation (inches)',
                data: precip,
                backgroundColor: 'rgba(124, 77, 255, 0.6)',
                borderColor: '#7C4DFF',
                borderWidth: 1
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
                    titleColor: '#7C4DFF',
                    bodyColor: '#FFFFFF'
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#B2BAC2' }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#B2BAC2' }
                }
            },
            ...options.chartOptions
        }
    });
}

/**
 * Create scenario comparison chart
 */
export function createScenarioChart(canvasId, scenarioData, variable, options = {}) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    const years = Object.keys(scenarioData[variable]).map(Number);
    const values = Object.values(scenarioData[variable]);

    const colors = {
        temperature: '#FF5252',
        precipitation: '#7C4DFF',
        seaIce: '#00E676',
        permafrost: '#FFB74D'
    };

    // Calculate dynamic Y-axis range
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const padding = Math.abs(maxValue - minValue) * 0.1 || 1; // 10% padding or minimum 1

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: options.label || variable,
                data: values,
                borderColor: colors[variable] || '#00E676',
                backgroundColor: `${colors[variable] || '#00E676'}33`,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 25, 41, 0.9)',
                    titleColor: colors[variable] || '#00E676',
                    bodyColor: '#FFFFFF'
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: {
                        color: '#B2BAC2',
                        maxTicksLimit: 8
                    }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#B2BAC2' },
                    min: minValue - padding,
                    max: maxValue + padding
                }
            },
            ...options.chartOptions
        }
    });
}
