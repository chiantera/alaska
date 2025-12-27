# Alaska Climate Explorer

A comprehensive web application for exploring Alaska's weather patterns, historical climate data, and interactive climate change scenarios.

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

Due to PowerShell execution policy restrictions, you'll need to run npm commands using one of these methods:

**Option 1: Run in Command Prompt (cmd.exe)**

```cmd
cd c:\safe\Alaska
npm install
npm run dev
```

**Option 2: Temporarily bypass PowerShell policy**

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm install
npm run dev
```

**Option 3: Use PowerShell with explicit path**

```powershell
& "C:\Program Files\nodejs\npm.cmd" install
& "C:\Program Files\nodejs\npm.cmd" run dev
```

### Running the App

After installation, the app will be available at `http://localhost:3000`

## 📊 Features

### 1. Live Weather & Forecasts

- Real-time weather data from NOAA National Weather Service
- 7-day forecasts for major Alaska cities
- Interactive map with clickable locations
- Temperature, precipitation, humidity, and wind data

### 2. Historical Weather Trends (1949-Present)

- Compare temperature and precipitation patterns over time
- Adjustable time ranges (10, 25, 50 years, or all-time)
- Multiple station data (Anchorage, Fairbanks, Juneau)
- Interactive charts showing climate trends

### 3. Climate Change Scenarios ⭐

**The flagship feature** - Interactive climate modeling:

#### IPCC Scenarios

- **SSP1-2.6**: Low emissions (Paris Agreement success)
- **SSP2-4.5**: Moderate emissions (current policies)
- **SSP3-7.0**: High emissions (limited action)
- **SSP5-8.5**: Very high emissions (fossil fuel intensive)

#### Custom Scenario Builder

- Adjust global temperature increase (1.5°C - 5°C)
- Set emission reduction timeline (2030-2100)
- Real-time projection updates

#### Visualized Impacts (2026-2100)

- 🌡️ Temperature changes
- 🌧️ Precipitation patterns
- 🧊 Sea ice extent decline
- ❄️ Permafrost thaw depth
- 🏔️ Glacial melt
- 🌊 Sea level rise

#### Interactive Features

- Timeline scrubber with year-by-year visualization
- Play/pause animation through scenarios
- Side-by-side impact comparisons
- Smooth animated transitions

### 4. Permafrost Monitoring

- Monitoring station locations
- Temperature depth profiles
- Thaw progression tracking

### 5. Sea Ice Tracker

- Arctic sea ice extent trends (1979-present)
- Historical comparison with baseline
- Decline rate visualization

## 🎨 Design Features

- **Alaska-inspired color palette**: Aurora greens, glacier blues, deep ocean tones
- **Glassmorphism effects**: Frosted glass cards with backdrop blur
- **Smooth animations**: Micro-interactions and hover effects
- **Dark mode optimized**: Perfect for data visualization
- **Fully responsive**: Works on mobile, tablet, and desktop

## 📡 Data Sources

- **Live Weather**: NOAA National Weather Service API
- **Historical Data**: Alaska Climate Research Center (UAF)
- **Climate Projections**: SNAP/ARDAC CMIP6 downscaled data
- **Sea Ice**: National Snow and Ice Data Center (NSIDC)
- **Permafrost**: Arctic Permafrost Geospatial Centre (AWI) & GTN-P

## 🛠️ Technology Stack

- **Framework**: Vite (fast build tool)
- **Mapping**: Leaflet.js
- **Charts**: Chart.js
- **Styling**: Vanilla CSS with custom design system
- **APIs**: NOAA NWS, ACRC, SNAP/ARDAC

## 📁 Project Structure

```
Alaska/
├── index.html              # Main HTML structure
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
├── src/
│   ├── main.js            # Application entry point
│   ├── index.css          # Design system & styles
│   ├── services/
│   │   ├── weatherAPI.js  # NOAA API integration
│   │   ├── climateData.js # Climate scenarios & historical data
│   │   └── geocoding.js   # Location coordinates
│   └── utils/
│       └── chartHelpers.js # Chart.js configurations
```

## 🌐 Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari

## 📝 Notes

- Weather data requires internet connection
- Some Alaska locations may have limited weather station coverage
- Climate scenarios use simplified models based on IPCC data
- Historical data is generated for demonstration (in production, would load from ACRC CSV files)

## 🔗 Useful Links

- [NOAA National Weather Service](https://weather.gov)
- [Alaska Climate Research Center](https://akclimate.org)
- [NSIDC](https://nsidc.org)
- [SNAP - UAF](https://snap.uaf.edu)

## 📄 License

This project uses open data from U.S. government sources and academic institutions.
