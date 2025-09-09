# 🏠 Home Assistant Setup Guide for Flippy Weather Clock

## 🎯 Installation Options

Choose your preferred installation method:

### 🚀 Option A: HACS Installation (Recommended)

1. **Ensure HACS is installed** in your Home Assistant
2. **Open HACS** → Go to **Frontend** section
3. Click the **⋮** menu (three dots) → **Custom Repositories**
4. **Add Repository**:
   - **Repository**: `https://github.com/cnewman402/flippyweather-clock`
   - **Category**: `Lovelace`
5. Click **Add** then **Install** → **Download**
6. **Restart Home Assistant**
7. **Clear browser cache** (Ctrl+F5)

> ✅ **HACS Benefits**: Automatic updates, easy management, no manual file handling

### 📂 Option B: Manual Installation

#### Step 1: File Placement
Place your files in Home Assistant's `www` folder:

```
/config/www/flippy-weather/
├── flippyweather-clock.js       (your main file)
├── themes.js                    (theme definitions)
├── regional.js                  (language support)
└── themes/
    ├── default/
    │   ├── clock/
    │   │   ├── clockbg1.png → clockbg6.png
    │   │   ├── 0.png → 9.png
    │   │   ├── am.png, pm.png
    │   │   └── flip animation frames
    │   └── weather/
    │       └── default/
    │           ├── sunny.png
    │           ├── cloudy.png
    │           ├── night.png
    │           └── other weather icons...
    └── dusk/
        ├── clock/
        └── weather/
```

#### Step 2: Register Resource Manually
Go to **Settings** → **Dashboards** → **Resources** → **Add Resource**:
- **URL**: `/local/flippy-weather/flippyweather-clock.js`
- **Type**: JavaScript Module

## ⚙️ Required Home Assistant Sensors (Both Methods)

Add these sensors to your `configuration.yaml`:

```yaml
sensor:
  - platform: time_date
    display_options:
      - 'time'
      - 'date'
      - 'date_time'
      - 'date_time_utc'
      - 'date_time_iso'
      - 'time_date'
      - 'time_utc'
```

> **Note**: The "beat" option was deprecated and removed in Home Assistant 2024.2.0

**Restart Home Assistant after adding sensors**

## 🎴 Add Card to Dashboard (Both Methods)

### Basic Configuration
```yaml
type: custom:flippyweather-card
entity: weather.your_weather_provider
```

### Advanced Configuration
```yaml
type: custom:flippyweather-card
entity: weather.openweathermap
title: "Living Room Weather"
lang: en
am_pm: true
renderForecast: true
renderDetails: true
theme:
  name: default
  weather_icon_set: default
high_low_entity:
  entity_id: sensor.outdoor_temperature
  name: "Outdoor Temp"
```

## 🔄 Final Steps

1. **Restart Home Assistant** (if not done already)
2. **Clear browser cache** (Ctrl+F5)
3. **Add card to dashboard**
4. **Check browser console** for any errors

## 🛠️ Troubleshooting

### HACS Installation Issues
- ✅ Verify HACS is properly installed and updated
- ✅ Check if custom repository was added correctly
- ✅ Ensure repository URL is exact: `https://github.com/cnewman402/flippyweather-clock`
- ✅ Try removing and re-adding the custom repository

### "Custom element not found: flippyweather-card"
- ✅ **HACS**: Check if installation completed successfully
- ✅ **Manual**: Verify resource URL: `/local/flippy-weather/flippyweather-clock.js`
- ✅ Clear browser cache and reload
- ✅ Check browser console for JavaScript errors

### "Failed to load resource"
- ✅ **HACS**: Try reinstalling the component
- ✅ **Manual**: Verify file path: `/config/www/flippy-weather/flippyweather-clock.js`
- ✅ Check file permissions
- ✅ Restart Home Assistant

### Card appears but no images
- ✅ Create `themes/default/clock/` folder structure
- ✅ Add required image files (for both installation methods)
- ✅ Check file naming matches expected format

### Weather data not loading
- ✅ Verify weather entity exists: `weather.openweathermap`
- ✅ Check if `sensor.date_time_iso` sensor is working
- ✅ Confirm internet connectivity for weather data

## ✨ Success Indicators

When working properly, you should see:
- ✅ Animated flip clock with current time
- ✅ Weather icon and current temperature
- ✅ Smooth digit animations every minute
- ✅ Weather forecast (if enabled)
- ✅ No errors in browser console

## 🔄 Updates

### HACS Users
Updates will appear automatically in HACS when new versions are released.

### Manual Installation Users  
Check the GitHub repository periodically for updates and replace files manually.

Your Flippy Weather Clock is now ready to use! 🌤️