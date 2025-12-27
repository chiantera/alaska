// Sample historical data (1949-2024)
// In production, this would be loaded from ACRC CSV files
const HISTORICAL_DATA = {
    anchorage: {
        temperature: generateHistoricalTemp(1949, 2024, 35, 2.5), // Base 35°F, warming trend
        precipitation: generateHistoricalPrecip(1949, 2024, 16) // Base 16 inches
    },
    fairbanks: {
        temperature: generateHistoricalTemp(1949, 2024, 26, 3.0), // Base 26°F, stronger warming
        precipitation: generateHistoricalPrecip(1949, 2024, 11)
    },
    juneau: {
        temperature: generateHistoricalTemp(1949, 2024, 40, 2.0), // Base 40°F, milder warming
        precipitation: generateHistoricalPrecip(1949, 2024, 54) // Much wetter
    }
};

// IPCC Climate Scenarios (simplified projections for Alaska)
const CLIMATE_SCENARIOS = {
    'SSP1-2.6': {
        name: 'Low Emissions',
        description: 'Strong climate action, Paris Agreement success',
        temperature: generateScenarioData(2026, 2100, 1.5, 0.02), // +1.5°C by 2100
        precipitation: generateScenarioData(2026, 2100, 10, 0.1), // +10% by 2100
        seaIce: generateScenarioData(2026, 2100, -15, -0.15), // -15% by 2100
        permafrost: generateScenarioData(2026, 2100, 30, 0.3) // +30cm active layer by 2100
    },
    'SSP2-4.5': {
        name: 'Moderate Emissions',
        description: 'Current policies maintained',
        temperature: generateScenarioData(2026, 2100, 2.5, 0.03),
        precipitation: generateScenarioData(2026, 2100, 15, 0.15),
        seaIce: generateScenarioData(2026, 2100, -35, -0.35),
        permafrost: generateScenarioData(2026, 2100, 50, 0.5)
    },
    'SSP3-7.0': {
        name: 'High Emissions',
        description: 'Limited climate action',
        temperature: generateScenarioData(2026, 2100, 3.8, 0.045),
        precipitation: generateScenarioData(2026, 2100, 20, 0.2),
        seaIce: generateScenarioData(2026, 2100, -60, -0.6),
        permafrost: generateScenarioData(2026, 2100, 80, 0.8)
    },
    'SSP5-8.5': {
        name: 'Very High Emissions',
        description: 'Fossil fuel intensive development',
        temperature: generateScenarioData(2026, 2100, 5.0, 0.06),
        precipitation: generateScenarioData(2026, 2100, 25, 0.25),
        seaIce: generateScenarioData(2026, 2100, -85, -0.85),
        permafrost: generateScenarioData(2026, 2100, 120, 1.2)
    }
};

/**
 * Generate historical temperature data with warming trend
 */
function generateHistoricalTemp(startYear, endYear, baseTemp, warmingRate) {
    const data = {};
    for (let year = startYear; year <= endYear; year++) {
        const yearsSince1949 = year - 1949;
        const warming = warmingRate * (yearsSince1949 / 75); // Warming over 75 years
        const annualVariation = (Math.random() - 0.5) * 3; // Random variation
        data[year] = baseTemp + warming + annualVariation;
    }
    return data;
}

/**
 * Generate historical precipitation data
 */
function generateHistoricalPrecip(startYear, endYear, basePrecip) {
    const data = {};
    for (let year = startYear; year <= endYear; year++) {
        const variation = (Math.random() - 0.5) * basePrecip * 0.3; // 30% variation
        data[year] = Math.max(0, basePrecip + variation);
    }
    return data;
}

/**
 * Generate scenario projection data
 */
function generateScenarioData(startYear, endYear, totalChange, annualRate) {
    const data = {};
    for (let year = startYear; year <= endYear; year++) {
        const yearsSinceStart = year - startYear;
        const progress = yearsSinceStart / (endYear - startYear);
        // Non-linear acceleration
        const acceleratedProgress = Math.pow(progress, 1.2);
        data[year] = totalChange * acceleratedProgress;
    }
    return data;
}

/**
 * Get historical data for a station
 */
export function getHistoricalData(station, startYear, endYear) {
    const stationData = HISTORICAL_DATA[station] || HISTORICAL_DATA.anchorage;

    const filteredTemp = {};
    const filteredPrecip = {};

    for (let year = startYear; year <= endYear; year++) {
        if (stationData.temperature[year]) {
            filteredTemp[year] = stationData.temperature[year];
        }
        if (stationData.precipitation[year]) {
            filteredPrecip[year] = stationData.precipitation[year];
        }
    }

    return {
        temperature: filteredTemp,
        precipitation: filteredPrecip
    };
}

/**
 * Get scenario projections
 */
export function getScenarioProjections(scenario) {
    return CLIMATE_SCENARIOS[scenario] || CLIMATE_SCENARIOS['SSP2-4.5'];
}

/**
 * Calculate custom scenario based on user parameters
 */
export function calculateCustomScenario(tempIncrease, emissionReductionYear) {
    const startYear = 2026;
    const endYear = 2100;

    // Interpolate between scenarios based on temperature increase
    let baseScenario;
    if (tempIncrease <= 2.0) baseScenario = 'SSP1-2.6';
    else if (tempIncrease <= 3.0) baseScenario = 'SSP2-4.5';
    else if (tempIncrease <= 4.0) baseScenario = 'SSP3-7.0';
    else baseScenario = 'SSP5-8.5';

    const base = CLIMATE_SCENARIOS[baseScenario];

    // Adjust based on emission reduction year
    const reductionFactor = (emissionReductionYear - 2026) / (2080 - 2026);

    return {
        name: 'Custom Scenario',
        description: `${tempIncrease}°C warming, emissions peak ${emissionReductionYear}`,
        temperature: adjustScenarioData(base.temperature, tempIncrease / 2.5, reductionFactor),
        precipitation: adjustScenarioData(base.precipitation, tempIncrease / 2.5, reductionFactor * 0.8),
        seaIce: adjustScenarioData(base.seaIce, tempIncrease / 2.5, reductionFactor),
        permafrost: adjustScenarioData(base.permafrost, tempIncrease / 2.5, reductionFactor)
    };
}

/**
 * Adjust scenario data based on custom parameters
 */
function adjustScenarioData(baseData, scaleFactor, reductionFactor) {
    const adjusted = {};
    const years = Object.keys(baseData).map(Number);

    for (const year of years) {
        const baseValue = baseData[year];
        const yearProgress = (year - 2026) / (2100 - 2026);

        // Apply reduction factor - later reduction = more impact
        const impactMultiplier = 1 + (reductionFactor * yearProgress * 0.3);

        adjusted[year] = baseValue * scaleFactor * impactMultiplier;
    }

    return adjusted;
}

/**
 * Get data for specific year and scenario
 */
export function getYearData(scenario, year) {
    const scenarioData = typeof scenario === 'string'
        ? getScenarioProjections(scenario)
        : scenario;

    return {
        temperature: scenarioData.temperature[year] || 0,
        precipitation: scenarioData.precipitation[year] || 0,
        seaIce: scenarioData.seaIce[year] || 0,
        permafrost: scenarioData.permafrost[year] || 0,
        glacier: (scenarioData.seaIce[year] || 0) * 0.7, // Simplified correlation
        seaLevel: (scenarioData.temperature[year] || 0) * 8 // ~8cm per degree
    };
}
