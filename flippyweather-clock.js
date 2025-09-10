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
    theme: {
        name: 'default'
    }
};

const flippyVersion = "2.4.0";

console.info("%c Flippy Flip Clock %c ".concat(flippyVersion, " "), "color: white; background: #555555; ", "color: white; background: #3a7ec6; ");

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
    }

    static getStubConfig() {
        return { 
            location_name: 'Home Assistant Location'
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
            <div style="display: flex; justify-content: center; gap: 20px; margin-top: 30px; flex-wrap: wrap;">
                ${forecast.map(period => {
                    const temp = period.temperature;
                    const condition = period.shortForecast;
                    const name = period.name;
                    
                    return html`
                        <div style="text-align: center; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px; min-width: 100px;">
                            <div style="font-size: 0.8em; opacity: 0.8; margin-bottom: 8px;">${name}</div>
                            <div style="font-size: 4em; margin: 10px 0;">${this.getWeatherEmoji(condition)}</div>
                            <div style="font-size: 1.1em; font-weight: bold;">${temp}°</div>
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

        return html`
            <style>
                ${themes['default']['css']}
                
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
                    font-size: 4em;
                    font-weight: 300;
                    line-height: 1;
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
                <div class="flippy-container">
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
                    
                    <div style="font-size: 0.8em; opacity: 0.7; margin-top: 20px; color: white; text-align: center;">
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