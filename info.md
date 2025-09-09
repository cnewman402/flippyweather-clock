# Flippy Weather Clock

A modern, animated flip clock weather card for Home Assistant with beautiful flip animations and comprehensive weather forecasting.

## Features
- 🕐 Animated flip clock with smooth digit transitions
- 🌤️ Real-time weather data and multi-day forecasts  
- 🎨 Multiple themes (Default blue gradient, Dark dusk theme)
- 🌍 Multi-language support (9 languages)
- 📱 Responsive design for mobile and desktop
- ⚡ Modern performance - no jQuery dependency

## Quick Setup
1. Install via HACS
2. Add time_date sensors to configuration.yaml
3. Add card to dashboard:

```yaml
type: custom:flippyweather-card
entity: weather.your_weather_provider
```

Perfect for creating an elegant weather display with retro flip clock styling!