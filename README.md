# 🌤️ FlippyWeather Clock

A modern, animated flip clock weather card for Home Assistant. Features beautiful flip animations and real-time weather forecasting using the National Weather Service API.

![FlippyWeather Clock](https://img.shields.io/badge/Home%20Assistant-Compatible-blue) ![Version](https://img.shields.io/badge/Version-2.4.1-green) ![No Dependencies](https://img.shields.io/badge/jQuery-Free-red)

## ✨ Features

- 🕐 **Animated Flip Clock** - Smooth digit animations every minute with CSS transitions
- 🌦️ **Weather Integration** - Real-time weather data from National Weather Service
- 📦 **Self-Contained** - No external files or dependencies required
- 📱 **Responsive Design** - Works on desktop and mobile devices
- ⚡ **Modern Performance** - Pure vanilla JavaScript, no jQuery
- 🎨 **Visual Appeal** - Beautiful gradient backgrounds and glassmorphism effects

## 🚀 Installation

### 🎯 Option A: Install via HACS (Recommended)

1. 🏠 **Open HACS** in Home Assistant
2. 🎨 Go to **Frontend** section
3. ⚙️ Click the menu (⋮) → **Custom Repositories**
4. 📝 Add repository URL: `https://github.com/cnewman402/flippyweather-clock`
5. 📂 Select category: **Dashboard**
6. ⬇️ Click **Add** → **Install** → **Download**
7. 🔄 **Restart Home Assistant**
8. 🧹 Clear browser cache (Ctrl+F5)

### 📁 Option B: Manual Installation

1. 💾 Download `flippyweather-clock.js` from this repository
2. 📂 Place it in `/config/www/flippyweather-clock/`
3. ⚙️ Go to **Settings** → **Dashboards** → **Resources** → **Add Resource**:
   - 🔗 **URL**: `/local/flippyweather-clock/flippyweather-clock.js`
   - 📄 **Type**: JavaScript Module
4. 🔄 **Restart Home Assistant**
5. 🧹 Clear browser cache (Ctrl+F5)

## ⚙️ Configuration

No additional Home Assistant configuration is required! The card uses your browser's local time and your Home Assistant's configured coordinates for weather data.

## 🎴 Card Configuration

### 🎯 Basic Example
```yaml
type: custom:flippyweather-card
```

### 📍 With Custom Location Name
```yaml
type: custom:flippyweather-card
location_name: "Living Room"
```

### 🕐 With 12-Hour Format
```yaml
type: custom:flippyweather-card
location_name: "Home Weather"
am_pm: true
```

## 📋 Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `location_name` | string | `"Weather"` | Display name for the weather location |
| `am_pm` | boolean | `false` | Use 12-hour time format with AM/PM indicator |

## 🌦️ Weather Data Source

This card uses the **National Weather Service (NWS) API** which:
- 🎯 Provides accurate weather data for US locations
- 🏠 Uses your Home Assistant's configured coordinates automatically
- 🔄 Updates every 10 minutes
- 📅 Shows current conditions and 4-day forecast
- 🔓 Requires no API keys or external configuration

## 🔧 Technical Details

### 🏗️ Modern Architecture
- ⚡ **No jQuery dependency** - 85KB smaller than predecessor
- 📦 **Self-contained component** - All CSS and logic in one file
- 🌤️ **Uses National Weather Service API** - No API keys required
- 🎨 **CSS3 animations** - Smooth flip transitions and visual effects
- 🚀 **Modern JavaScript** - ES6+ features with proper error handling

### 🚀 Performance Benefits
- ⚡ **Faster loading** - No external asset dependencies
- 💾 **Better memory usage** - No jQuery object wrapping
- 🎬 **Modern animations** - Hardware-accelerated CSS transforms
- 📱 **Responsive design** - Flexbox layouts that adapt to screen size

## 🌐 Browser Compatibility

Works with all modern browsers that support:
- ⚙️ ES6 JavaScript features
- 🎨 CSS Custom Properties
- 📐 CSS Grid and Flexbox
- 🧩 Web Components (LitElement)

## 🔧 Troubleshooting

### ❌ Card doesn't appear
- 🎯 **HACS**: Verify resource path is `/hacsfiles/flippyweather-clock/flippyweather-clock.js`
- 📁 **Manual**: Verify resource path is `/local/flippyweather-clock/flippyweather-clock.js`
- 🧹 Clear browser cache (Ctrl+F5)
- 🐛 Check browser console for JavaScript errors
- 🔄 Ensure Home Assistant is restarted after installation

### 🌤️ Weather data not loading
- 📍 Verify your Home Assistant has latitude/longitude configured
- 🇺🇸 Check that your location is within the United States (NWS coverage area)
- 🌐 Ensure internet connectivity for API access
- 🐛 Check browser console for API error messages

### ⏰ Time not updating
- ⚙️ Verify `sensor.date_time_iso` exists in Home Assistant
- 🕐 Check that time_date platform sensors are configured
- 🔄 Restart Home Assistant if sensors were just added

### 🎬 Clock animations not working
- 🧹 Clear browser cache and reload the page
- 🎨 Check that the browser supports CSS transforms
- 🐛 Verify no JavaScript errors in browser console

## 📝 Version History

**v2.4.1** - Current
- ✨ Self-contained implementation with inline CSS
- 🌦️ National Weather Service API integration
- 🗑️ Removed external file dependencies
- 🚀 Modern ES6+ JavaScript with error handling
- 📱 Improved responsive design

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 💬 Support

If you encounter issues:
1. 📖 Check the troubleshooting section above
2. 🐛 Open an issue on GitHub with:
   - 🏠 Your Home Assistant version
   - 🌐 Browser and version
   - ❌ Any console error messages
   - ⚙️ Your card configuration

## 🙏 Credits

- 📱 Inspired by the original HTC Flip Clock design
- 🌤️ Weather data provided by the National Weather Service
- 🏠 Built for the Home Assistant community
