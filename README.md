# 🌤️ FlippyWeather Clock

A modern, animated flip clock weather card for Home Assistant. Features beautiful flip animations, real-time weather forecasting, and dynamic animated backgrounds that change based on weather conditions and time of day.

![FlippyWeather Clock](https://img.shields.io/badge/Home%20Assistant-Compatible-blue) ![Version](https://img.shields.io/badge/Version-2.5.0-green) ![No Dependencies](https://img.shields.io/badge/jQuery-Free-red) ![AI Powered](https://img.shields.io/badge/Built%20with-Claude.ai-orange)

## ✨ Features

- 🕐 **Animated Flip Clock** - Large, smooth digit animations every minute with CSS transitions
- 🌦️ **Weather Integration** - Real-time weather data from National Weather Service
- 🎨 **Dynamic Animated Backgrounds** - Weather-responsive backgrounds with day/night modes
- 🌙 **Automatic Night Mode** - Darker animations between 8 PM and 6 AM
- 📦 **Self-Contained** - No external files or dependencies required
- 📱 **Responsive Design** - Works on desktop and mobile devices
- ⚡ **Modern Performance** - Pure vanilla JavaScript, no jQuery
- 🎯 **Bold Forecast Display** - Easy-to-read 4-day weather forecast

## 🎬 Animated Weather Backgrounds

The card features beautiful animated backgrounds that automatically change based on current weather conditions:

### ☀️ Day Mode Animations
- **Sunny**: Warm gradients with pulsing sun glow effects
- **Rainy**: Blue tones with animated falling rain
- **Snowy**: Winter colors with floating snowflakes
- **Cloudy**: Overcast grays with drifting cloud overlays
- **Stormy**: Dark themes with lightning flash effects
- **Foggy**: Muted colors with wavy mist effects

### 🌙 Night Mode Animations (8 PM - 6 AM)
- **Clear Night**: Deep navy with glowing moon and twinkling stars
- **Rainy Night**: Dark blues with subtle rain effects
- **Snowy Night**: Dark grays with bright, visible snowflakes
- **Cloudy Night**: Darker storm clouds with muted movements
- **Stormy Night**: Near-black backgrounds with blue lightning
- **Foggy Night**: Dark grays with gentle mist effects

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

### 🎨 With Animation Settings
```yaml
type: custom:flippyweather-card
location_name: "Home Weather"
am_pm: true
animated_background: true  # Enable/disable weather animations
```

## 📋 Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `location_name` | string | `"Weather"` | Display name for the weather location |
| `am_pm` | boolean | `false` | Use 12-hour time format with AM/PM indicator |
| `animated_background` | boolean | `true` | Enable weather-responsive animated backgrounds |

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
- 🎨 **CSS3 animations** - Smooth flip transitions and weather effects
- 🚀 **Modern JavaScript** - ES6+ features with proper error handling
- 🌙 **Intelligent time detection** - Automatic day/night mode switching

### 🚀 Performance Benefits
- ⚡ **Faster loading** - No external asset dependencies
- 💾 **Better memory usage** - No jQuery object wrapping
- 🎬 **Hardware-accelerated animations** - CSS transforms for smooth effects
- 📱 **Responsive design** - Flexbox layouts that adapt to screen size
- 🧠 **Smart resource usage** - Animations only when needed

## 🌐 Browser Compatibility

Works with all modern browsers that support:
- ⚙️ ES6 JavaScript features
- 🎨 CSS Custom Properties
- 📐 CSS Grid and Flexbox
- 🧩 Web Components (LitElement)
- 🎬 CSS Animations and Transforms

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
- ⚙️ The card uses browser time, no sensors required
- 🧹 Clear browser cache and reload the page
- 🔄 Restart Home Assistant if needed

### 🎬 Animations not working
- 🧹 Clear browser cache and reload the page
- 🎨 Check that the browser supports CSS transforms
- 🐛 Verify no JavaScript errors in browser console
- ⚙️ Ensure `animated_background: true` in configuration

### 🌙 Night mode not activating
- 🕐 Night mode activates automatically between 8 PM and 6 AM
- 🌍 Uses your local browser time zone
- 🔄 Refresh the page if time recently crossed the threshold

## 📝 Version History

**v2.5.0** - Latest
- 🎨 Added dynamic animated weather backgrounds
- 🌙 Implemented automatic day/night mode switching
- 📏 Increased clock size for better readability
- 📱 Enhanced forecast display with bold day labels
- 🎬 Added weather-responsive background animations
- ⚡ Improved performance and visual effects

**v2.4.1** - Previous
- ✨ Self-contained implementation with inline CSS
- 🌦️ National Weather Service API integration
- 🗑️ Removed external file dependencies
- 🚀 Modern ES6+ JavaScript with error handling
- 📱 Improved responsive design

## 🤖 Development

This card was created entirely using [Claude.ai](https://claude.ai) by Anthropic. The development process showcased the power of AI-assisted coding for creating modern web components.

**Development Details:**
- 🧠 **AI Assistant**: Claude.ai (Pro subscription)
- 💻 **Development Process**: Collaborative coding with AI
- 🔧 **Technologies**: LitElement, CSS3, ES6+ JavaScript
- 🎯 **No Sponsorship**: This is an independent project, not sponsored by Anthropic

The entire codebase, from initial concept to advanced features like animated backgrounds and night mode detection, was developed through iterative collaboration with Claude.ai. This demonstrates the potential for AI-assisted development in creating polished, production-ready Home Assistant integrations.

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
   - 🕐 Current time if related to night mode issues

## 🙏 Credits

- 📱 Inspired by the original HTC Flip Clock design
- 🌤️ Weather data provided by the National Weather Service
- 🏠 Built for the Home Assistant community
- 🤖 Developed with assistance from [Claude.ai](https://claude.ai) by Anthropic
- 🎨 Weather animations inspired by modern web design trends

---

**Enjoy your new FlippyWeather Clock with dynamic animated backgrounds! 🌤️**
