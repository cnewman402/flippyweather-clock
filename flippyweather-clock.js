import "https://unpkg.com/wired-card@0.8.1/wired-card.js?module";
import "https://unpkg.com/wired-toggle@0.8.0/wired-toggle.js?module";
import {
    LitElement,
    html,
    css
} from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

const themes = {
    default: {
        css: `
            .flippy-container {
                background: linear-gradient(135deg, #74b9ff, #0984e3);
                color: white;
                padding: 20px;
                border-radius: 15px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            }
        `
    }
};

const weatherDefaults = {
    location_name: 'Weather',
    am_pm: false,
    animated_background: true,
    theme: {
        name: 'default'
    }
};

const flippyVersion = "2.5.0";

console.info("%c 🕐 FlippyWeather Clock %c ".concat(flippyVersion, " "), "color: white; background: #555555; border-radius: 3px 0 0 3px; padding: 1px 0;", "color: white; background: #3a7ec6; border-radius: 0 3px 3px 0; padding: 1px 0;");

class FlippyWeather extends LitElement {
    constructor() {
        super();
        this.weatherData = null;
        this.forecastData = null;
        this.lastWeatherUpdate = 0;
        this.previousTime = {};
        this.animatingDigits = new Set();
        this.oldTime = {};
        this.latitude = null;
        this.longitude = null;
        this.currentCondition = '';
    }

    static getStubConfig() {
        return { 
            location_name: 'Home Assistant Location',
            animated_background: true
        };
    }

    setConfig(config) {
        var defaultConfig = {};
        for (const property in config) {
            defaultConfig[property] = config[property];
        }
        
        for (const property in weatherDefaults) {
            if (config[property] === undefined) {
                defaultConfig[property] = weatherDefaults[property];
            }
        }
        
        this._config = defaultConfig;
    }

    async connectedCallback() {
        super.connectedCallback();
        
        if (this.hass) {
            this.initializeWeather();
        }
        
        this.updateInterval = setInterval(() => {
            this.requestUpdate();
        }, 1000);
        
        this.weatherInterval = setInterval(async () => {
            if (this.hass) {
                await this.fetchWeatherData();
            }
        }, 600000);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        if (this.weatherInterval) {
            clearInterval(this.weatherInterval);
        }
    }

    async initializeWeather() {
        const lat = this.hass.config.latitude;
        const lon = this.hass.config.longitude;
        
        console.log('FlippyWeather: Using Home Assistant coordinates:', lat, lon);
        
        if (lat && lon) {
            this.latitude = lat;
            this.longitude = lon;
            await this.fetchWeatherData();
        } else {
            console.error('FlippyWeather: Could not get coordinates from Home Assistant');
        }
    }

    async fetchWeatherData() {
        if (!this.latitude || !this.longitude) {
            console.error('FlippyWeather: No coordinates available');
            return;
        }
        
        try {
            console.log('Fetching weather data from NWS...');
            
            const pointsResponse = await fetch(`https://api.weather.gov/points/${this.latitude},${this.longitude}`);
            
            if (!pointsResponse.ok) {
                throw new Error(`Points API error: ${pointsResponse.status}`);
            }
            
            const pointsData = await pointsResponse.json();
            
            const stationsResponse = await fetch(pointsData.properties.observationStations);
            const stationsData = await stationsResponse.json();
            
            if (stationsData.features && stationsData.features.length > 0) {
                const stationId = stationsData.features[0].properties.stationIdentifier;
                const currentResponse = await fetch(`https://api.weather.gov/stations/${stationId}/observations/latest`);
                
                if (currentResponse.ok) {
                    const currentData = await currentResponse.json();
                    this.weatherData = currentData.properties;
                }
            }
            
            const forecastResponse = await fetch(pointsData.properties.forecast);
            
            if (forecastResponse.ok) {
                const forecastData = await forecastResponse.json();
                this.forecastData = forecastData.properties.periods;
            }
            
            this.lastWeatherUpdate = Date.now();
            this.requestUpdate();
            
            console.log('Weather data updated successfully');
            
        } catch (error) {
            console.error('Error fetching weather data:', error);
            this.weatherData = { error: error.message };
            this.requestUpdate();
        }
    }

    updated(changedProperties) {
        super.updated(changedProperties);
        
        const now = new Date();
        let hour = now.getHours();
        
        if (this._config.am_pm) {
            hour = hour > 12 ? hour - 12 : hour;
            if (hour === 0) hour = 12;
        }
        
        const hourStr = hour < 10 ? "0" + hour : "" + hour;
        const minuteStr = now.getMinutes() < 10 ? "0" + now.getMinutes() : "" + now.getMinutes();
        
        const currentTime = {
            firstHourDigit: hourStr[0],
            secondHourDigit: hourStr[1],
            firstMinuteDigit: minuteStr[0],
            secondMinuteDigit: minuteStr[1]
        };
        
        Object.keys(currentTime).forEach(key => {
            if (this.oldTime[key] !== undefined && this.oldTime[key] !== currentTime[key]) {
                this.animateDigitFlip(key, this.oldTime[key], currentTime[key]);
            }
        });
        
        this.oldTime = currentTime;
    }

    animateDigitFlip(digitKey, oldDigit, newDigit) {
        const digitElement = this.shadowRoot.querySelector(`[data-digit="${digitKey}"]`);
        if (digitElement && !this.animatingDigits.has(digitKey)) {
            this.animatingDigits.add(digitKey);
            this.performFlipAnimation(digitElement, digitKey, oldDigit, newDigit);
        }
    }

    performFlipAnimation(element, digitKey, oldDigit, newDigit) {
        element.classList.add('flipping');
        
        setTimeout(() => {
            const digitDisplay = element.querySelector('.flip-card-face');
            if (digitDisplay) {
                digitDisplay.textContent = newDigit;
            }
        }, 300);
        
        setTimeout(() => {
            element.classList.remove('flipping');
            this.animatingDigits.delete(digitKey);
        }, 600);
    }

    getWeatherEmoji(condition) {
        if (!condition) return '🌤️';
        
        const lowerCondition = condition.toLowerCase();
        
        if (lowerCondition.includes('sunny') || lowerCondition.includes('clear')) return '☀️';
        if (lowerCondition.includes('partly cloudy') || lowerCondition.includes('partly sunny')) return '⛅';
        if (lowerCondition.includes('mostly cloudy') || lowerCondition.includes('cloudy')) return '☁️';
        if (lowerCondition.includes('rain') || lowerCondition.includes('shower')) return '🌧️';
        if (lowerCondition.includes('thunderstorm') || lowerCondition.includes('storm')) return '⛈️';
        if (lowerCondition.includes('snow') || lowerCondition.includes('blizzard')) return '❄️';
        if (lowerCondition.includes('fog') || lowerCondition.includes('mist')) return '🌫️';
        if (lowerCondition.includes('wind')) return '💨';
        
        return '🌤️';
    }

    getWeatherAnimationClass(condition) {
        if (!condition) return '';
        
        const lowerCondition = condition.toLowerCase();
        
        if (lowerCondition.includes('rain') || lowerCondition.includes('shower')) return 'weather-rain';
        if (lowerCondition.includes('snow') || lowerCondition.includes('blizzard')) return 'weather-snow';
        if (lowerCondition.includes('thunderstorm') || lowerCondition.includes('storm')) return 'weather-storm';
        if (lowerCondition.includes('cloudy')) return 'weather-cloudy';
        if (lowerCondition.includes('sunny') || lowerCondition.includes('clear')) return 'weather-sunny';
        if (lowerCondition.includes('fog') || lowerCondition.includes('mist')) return 'weather-fog';
        
        return 'weather-default';
    }

    getCurrentTemperature() {
        if (!this.weatherData || this.weatherData.error) return '--';
        
        if (this.weatherData.temperature && this.weatherData.temperature.value !== null) {
            const celsius = this.weatherData.temperature.value;
            const fahrenheit = (celsius * 9/5) + 32;
            return Math.round(fahrenheit);
        }
        
        return '--';
    }

    getCurrentCondition() {
        if (!this.weatherData || this.weatherData.error) return 'Loading...';
        
        return this.weatherData.textDescription || 'Unknown';
    }

    renderForecast() {
        if (!this.forecastData || this.forecastData.length === 0) {
            return html``;
        }

        const forecast = this.forecastData.slice(0, 4);
        
        return html`
            <div style="display: flex; justify-content: center; gap: 8px; margin-top: 30px; flex-wrap: nowrap;">
                ${forecast.map(period => {
                    const temp = period.temperature;
                    const condition = period.shortForecast;
                    const name = period.name;
                    
                    return html`
                        <div style="text-align: center; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 8px; min-width: 70px; flex: 1;">
                            <div style="font-size: 0.8em; opacity: 0.9; margin-bottom: 5px; font-weight: bold;">${name}</div>
                            <div style="font-size: 3em; margin: 5px 0;">${this.getWeatherEmoji(condition)}</div>
                            <div style="font-size: 1em; font-weight: bold;">${temp}°</div>
                        </div>
                    `;
                })}
            </div>
        `;
    }

    render() {
        if (!this._config) {
            return html`<ha-card><div style="padding: 20px;">Loading configuration...</div></ha-card>`;
        }

        const now = new Date();
        let hour = now.getHours();
        
        if (this._config.am_pm) {
            hour = hour > 12 ? hour - 12 : hour;
            if (hour === 0) hour = 12;
        }
        
        const hourStr = hour < 10 ? "0" + hour : "" + hour;
        const minuteStr = now.getMinutes() < 10 ? "0" + now.getMinutes() : "" + now.getMinutes();
        
        const temperature = this.getCurrentTemperature();
        const condition = this.getCurrentCondition();
        const weatherAnimationClass = this._config.animated_background ? this.getWeatherAnimationClass(condition) : '';
        
        console.log(`FlippyWeather Main: animated_background=${this._config.animated_background}, condition=${condition}, class=${weatherAnimationClass}`);

        return html`
            <style>
                ${themes['default']['css']}
                
                .flippy-container {
                    position: relative;
                    overflow: hidden;
                    transition: background 1s ease-in-out;
                }
                
                /* Animated Weather Backgrounds */
                .weather-rain {
                    background: linear-gradient(135deg, #4a90e2, #7b68ee, #2c3e50) !important;
                }
                
                .weather-rain::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-image: 
                        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
                    background-size: 
                        3px 100%,
                        7px 100%,
                        11px 100%;
                    animation: rainFall 0.8s linear infinite,
                               rainFall2 1.2s linear infinite,
                               rainFall3 1.6s linear infinite;
                    pointer-events: none;
                    z-index: 1;
                }
                
                @keyframes rainFall {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                }
                
                @keyframes rainFall2 {
                    0% { transform: translateY(-100%) translateX(-2px); }
                    100% { transform: translateY(100%) translateX(-2px); }
                }
                
                @keyframes rainFall3 {
                    0% { transform: translateY(-100%) translateX(2px); }
                    100% { transform: translateY(100%) translateX(2px); }
                }
                
                .weather-snow {
                    background: linear-gradient(135deg, #e6e9f0, #b8bcc8, #4a5568) !important;
                }
                
                .weather-snow::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-image: 
                        radial-gradient(2px 2px at 20px 30px, white, transparent),
                        radial-gradient(2px 2px at 40px 70px, white, transparent),
                        radial-gradient(1px 1px at 90px 40px, white, transparent),
                        radial-gradient(1px 1px at 130px 80px, white, transparent),
                        radial-gradient(2px 2px at 160px 30px, white, transparent);
                    background-repeat: repeat;
                    background-size: 200px 100px;
                    animation: snowFall 10s linear infinite;
                    pointer-events: none;
                    z-index: 1;
                }
                
                @keyframes snowFall {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                }
                
                .weather-cloudy {
                    background: linear-gradient(135deg, #bdc3c7, #95a5a6, #34495e) !important;
                }
                
                .weather-cloudy::before {
                    content: '';
                    position: absolute;
                    top: 10%;
                    left: -20%;
                    width: 140%;
                    height: 80%;
                    background: 
                        radial-gradient(ellipse 100px 50px at 50% 50%, rgba(255,255,255,0.3), transparent),
                        radial-gradient(ellipse 80px 40px at 30% 40%, rgba(255,255,255,0.2), transparent),
                        radial-gradient(ellipse 120px 60px at 70% 60%, rgba(255,255,255,0.25), transparent);
                    animation: cloudDrift 20s ease-in-out infinite;
                    pointer-events: none;
                    z-index: 1;
                }
                
                @keyframes cloudDrift {
                    0%, 100% { transform: translateX(-10px); }
                    50% { transform: translateX(10px); }
                }
                
                .weather-sunny {
                    background: linear-gradient(135deg, #f39c12, #e74c3c, #f1c40f) !important;
                }
                
                .weather-sunny::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 200px;
                    height: 200px;
                    margin: -100px 0 0 -100px;
                    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                    animation: sunGlow 4s ease-in-out infinite;
                    pointer-events: none;
                    z-index: 1;
                }
                
                @keyframes sunGlow {
                    0%, 100% { transform: scale(1); opacity: 0.3; }
                    50% { transform: scale(1.1); opacity: 0.6; }
                }
                
                .weather-storm {
                    background: linear-gradient(135deg, #2c3e50, #34495e, #1a1a2e) !important;
                }
                
                .weather-storm::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(255,255,255,0.1);
                    animation: lightning 3s infinite;
                    pointer-events: none;
                    z-index: 1;
                }
                
                @keyframes lightning {
                    0%, 90%, 100% { opacity: 0; }
                    5%, 10% { opacity: 1; }
                }
                
                .weather-fog {
                    background: linear-gradient(135deg, #95a5a6, #bdc3c7, #ecf0f1) !important;
                }
                
                .weather-fog::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: 
                        linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.1) 100%);
                    animation: fogWave 8s ease-in-out infinite;
                    pointer-events: none;
                    z-index: 1;
                }
                
                @keyframes fogWave {
                    0%, 100% { transform: translateX(-20%); opacity: 0.7; }
                    50% { transform: translateX(20%); opacity: 0.3; }
                }
                
                @keyframes fogWave {
                    0%, 100% { transform: translateX(-20%); opacity: 0.7; }
                    50% { transform: translateX(20%); opacity: 0.3; }
                }
                
                /* Ensure content is above animations */
                .htc-clock,
                .weather-info {
                    position: relative;
                    z-index: 2;
                }
                
                .htc-clock {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin: 20px 0;
                    gap: 15px;
                }
                
                .flip-card {
                    width: 80px;
                    height: 120px;
                    perspective: 1000px;
                }
                
                .flip-card-inner {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    transition: transform 0.6s;
                    transform-style: preserve-3d;
                }
                
                .flip-card-inner.flipping {
                    transform: rotateX(180deg);
                }
                
                .flip-card-face {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    backface-visibility: hidden;
                    background: rgba(255, 255, 255, 0.15);
                    border-radius: 12px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 3.5em;
                    font-weight: bold;
                    color: #ffffff;
                    font-family: 'Courier New', monospace;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
                    backdrop-filter: blur(10px);
                }
                
                .flip-card-face::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(0,0,0,0.1) 100%);
                    border-radius: 12px;
                    pointer-events: none;
                }
                
                .clock-separator {
                    width: 20px;
                    height: 120px;
                    font-size: 4em;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: blink 2s infinite;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                }
                
                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0.3; }
                }
                
                .am-pm-indicator {
                    margin-left: 10px;
                    font-size: 1.2em;
                    background: rgba(255,255,255,0.2);
                    padding: 8px 12px;
                    border-radius: 15px;
                    font-weight: bold;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                }
                
                .weather-info {
                    margin: 30px 0;
                    color: white;
                    text-align: center;
                }
                
                .current-weather {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 30px;
                    margin: 30px 0;
                }
                
                .weather-icon {
                    font-size: 12em;
                    line-height: 1;
                }
                
                .temperature {
                    font-size: 12em;
                    font-weight: 600;
                    line-height: 0.8;
                    text-shadow: 3px 3px 6px rgba(0,0,0,0.8);
                }
                
                .condition {
                    font-size: 1.2em;
                    opacity: 0.9;
                    margin-bottom: 15px;
                    max-width: 300px;
                    margin-left: auto;
                    margin-right: auto;
                }
                
                .error-message {
                    background: rgba(255, 0, 0, 0.2);
                    border: 1px solid rgba(255, 0, 0, 0.5);
                    border-radius: 8px;
                    padding: 10px;
                    margin: 10px 0;
                    font-size: 0.9em;
                }
            </style>
            <ha-card>
                <div class="flippy-container ${weatherAnimationClass}">
                    <div class="htc-clock">
                        <div class="flip-card">
                            <div class="flip-card-inner" data-digit="firstHourDigit">
                                <div class="flip-card-face">${hourStr[0]}</div>
                            </div>
                        </div>
                        
                        <div class="flip-card">
                            <div class="flip-card-inner" data-digit="secondHourDigit">
                                <div class="flip-card-face">${hourStr[1]}</div>
                            </div>
                        </div>
                        
                        <div class="clock-separator">:</div>
                        
                        <div class="flip-card">
                            <div class="flip-card-inner" data-digit="firstMinuteDigit">
                                <div class="flip-card-face">${minuteStr[0]}</div>
                            </div>
                        </div>
                        
                        <div class="flip-card">
                            <div class="flip-card-inner" data-digit="secondMinuteDigit">
                                <div class="flip-card-face">${minuteStr[1]}</div>
                            </div>
                        </div>
                        
                        ${this._config.am_pm ? html`
                            <div class="am-pm-indicator">
                                ${now.getHours() >= 12 ? 'PM' : 'AM'}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="weather-info">
                        ${this.weatherData && this.weatherData.error ? html`
                            <div class="error-message">
                                Weather Error: ${this.weatherData.error}
                            </div>
                        ` : ''}
                        
                        <div class="current-weather">
                            <div class="weather-icon">${this.getWeatherEmoji(condition)}</div>
                            <div class="temperature">${temperature}°</div>
                        </div>
                        
                        <div class="condition">${condition}</div>
                        
                        ${this.renderForecast()}
                    </div>
                    
                    <div style="font-size: 0.8em; opacity: 0.7; margin-top: 20px; color: white; text-align: center; position: relative; z-index: 2;">
                        FlippyWeather Clock v${flippyVersion} | NWS API
                    </div>
                </div>
            </ha-card>
        `;
    }

    getCardSize() {
        return 5;
    }

    set hass(hass) {
        this._hass = hass;
        
        if (hass && !this.latitude && !this.longitude) {
            this.initializeWeather();
        }
        
        this.requestUpdate();
    }

    get hass() {
        return this._hass;
    }
}

customElements.define("flippyweather-card", FlippyWeather);
