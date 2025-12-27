import Chart from 'chart.js/auto';

/**
 * Calculate linear regression for trend line
 */
function calculateLinearRegression(years, values) {
    const n = years.length;
    if (n === 0) return [];

    // Calculate means
    const meanX = years.reduce((a, b) => a + b, 0) / n;
    const meanY = values.reduce((a, b) => a + b, 0) / n;

    // Calculate slope and intercept
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
        numerator += (years[i] - meanX) * (values[i] - meanY);
        denominator += (years[i] - meanX) ** 2;
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = meanY - slope * meanX;

    // Generate trend line values
    return years.map(x => slope * x + intercept);
}

/**
 * Calculate 10-year centered rolling average for trend line
 * Uses ±5 years to create a smoother curve without steep edges
 */
function calculate10YearAverage(values) {
    const halfWindow = 5;  // 5 years before + current year + 5 years after = ~10 year window
    const n = values.length;
    const result = [];

    for (let i = 0; i < n; i++) {
        // Centered window: 5 years before to 5 years after
        const start = Math.max(0, i - halfWindow);
        const end = Math.min(n, i + halfWindow + 1);
        const window = values.slice(start, end);
        const avg = window.reduce((a, b) => a + b, 0) / window.length;
        result.push(avg);
    }

    return result;
}

/**
 * Calculate trend line - uses linear regression for short periods,
 * 10-year rolling average for longer periods
 */
function calculateTrendLine(years, values) {
    const n = values.length;

    // For 11 years or less (i.e. "Last 10 Years"), use linear regression (straight sloped line)
    // For longer periods, use 10-year rolling average (smooth curve)
    if (n <= 11) {
        return { values: calculateLinearRegression(years, values), isLinear: true };
    } else {
        return { values: calculate10YearAverage(values), isLinear: false };
    }
}

/**
 * Create temperature trend chart
 */
export function createTemperatureChart(canvasId, data, options = {}) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    const years = Object.keys(data).map(Number);
    const temps = Object.values(data);

    // Build datasets
    const datasets = [{
        label: options.label || 'Temperature (°F)',
        data: temps,
        borderColor: '#00E676',
        backgroundColor: 'rgba(0, 230, 118, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5
    }];

    // Add 10-year average trend line if requested
    if (options.showTrendLine) {
        const trendValues = calculate10YearAverage(temps);
        const trendStart = trendValues[0]?.toFixed(1);
        const trendEnd = trendValues[trendValues.length - 1]?.toFixed(1);
        const trendChange = (trendEnd - trendStart).toFixed(1);
        const sign = trendChange >= 0 ? '+' : '';

        datasets.push({
            label: `10-Year Average (${sign}${trendChange}°${options.unit || 'F'})`,
            data: trendValues,
            borderColor: '#FF5252',
            backgroundColor: 'transparent',
            borderWidth: 3,
            borderDash: [10, 5],
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 0
        });
    }

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: datasets
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
