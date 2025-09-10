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
    latitude: 40.7128,  // Default to NYC
    longitude: -74.0060,
    location_name: 'New York, NY',
    am_pm: false,
    theme: {
        name: 'default'
    }
};

const flippyVersion = "2.0.0";

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
    }

    static getStubConfig() {
        return { 
            latitude: 40.7128,
            longitude: -74.0060,
            location_name: 'New York, NY'
        };
    }

    setConfig(config) {
        if (!config.latitude || !config.longitude) {
            throw new Error("You need to define latitude and longitude");
        }
        
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
        
        console.log('FlippyWeather: Using NWS API with coordinates:', this._config.latitude, this._config.longitude);
        
        // Initial weather fetch
        await this.fetchWeatherData();
        
        // Update time every second, weather every 10 minutes
        this.updateInterval = setInterval(() => {
            this.requestUpdate();
        }, 1000);
        
        this.weatherInterval = setInterval(async () => {
            await this.fetchWeatherData();
        }, 600000); // 10 minutes
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

    async fetchWeatherData() {
        try {
            console.log('Fetching weather data from NWS...');
            
            // Step 1: Get grid points from coordinates
            const pointsResponse = await fetch(`https://api.weather.gov/points/${this._config.latitude},${this._config.longitude}`);
            
            if (!pointsResponse.ok) {
                throw new Error(`Points API error: ${pointsResponse.status}`);
            }
            
            const pointsData = await pointsResponse.json();
            
            // Step 2: Get current conditions
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
            
            // Step 3: Get forecast
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
            // Don't fail silently - show error in UI
            this.weatherData = { error: error.message };
            this.requestUpdate();
        }
    }

    updated(changedProperties) {
        super.updated(changedProperties);
        
        // Check if any time digits changed and trigger animations
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
        
        // Trigger animations for changed digits
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
            
            // Create flip animation using GitHub CDN images
            this.performFlipAnimation(digitElement, digitKey, oldDigit, newDigit);
        }
    }

    performFlipAnimation(element, digitKey, oldDigit, newDigit) {
        const clockPath = 'https://raw.githubusercontent.com/cnewman402/flippyweather-clock/main/themes/default/clock/';
        
        // Original repo used animation frames like: 01-1.png, 01-2.png, 01-3.png
        const animationKey = oldDigit + newDigit;
        
        // Phase 1: Show first half of flip animation
        element.style.backgroundImage = `url(${clockPath}${animationKey}-1.png)`;
        
        setTimeout(() => {
            // Phase 2: Show middle of flip
            element.style.backgroundImage = `url(${clockPath}${animationKey}-2.png)`;
        }, 100);
        
        setTimeout(() => {
            // Phase 3: Show second half of flip
            element.style.backgroundImage = `url(${clockPath}${animationKey}-3.png)`;
        }, 200);
        
        setTimeout(() => {
            // Final: Show the new digit
            element.style.backgroundImage = `url(${clockPath}${newDigit}.png)`;
            this.animatingDigits.delete(digitKey);
        }, 300);
    }

    getWeatherEmoji(condition) {
        if (!condition) return '🌤️';
        
        const lowerCondition = condition.toLowerCase();
        
        // Map NWS conditions to emojis
        if (lowerCondition.includes('sunny') || lowerCondition.includes('clear')) return '☀️';
        if (lowerCondition.includes('partly cloudy') || lowerCondition.includes('partly sunny')) return '⛅';
        if (lowerCondition.includes('mostly cloudy') || lowerCondition.includes('cloudy')) return '☁️';
        if (lowerCondition.includes('rain') || lowerCondition.includes('shower')) return '🌧️';
        if (lowerCondition.includes('thunderstorm') || lowerCondition.includes('storm')) return '⛈️';
        if (lowerCondition.includes('snow') || lowerCondition.includes('blizzard')) return '❄️';
        if (lowerCondition.includes('fog') || lowerCondition.includes('mist')) return '🌫️';
        if (lowerCondition.includes('wind')) return '💨';
        
        return '🌤️'; // Default
    }

    getCurrentTemperature() {
        if (!this.weatherData || this.weatherData.error) return '--';
        
        if (this.weatherData.temperature && this.weatherData.temperature.value !== null) {
            // Convert Celsius to Fahrenheit
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

        // Take first 4 forecast periods
        const forecast = this.forecastData.slice(0, 4);
        
        return html`
            <div style="display: flex; justify-content: center; gap: 15px; margin-top: 20px; flex-wrap: wrap;">
                ${forecast.map(period => {
                    const temp = period.temperature;
                    const condition = period.shortForecast;
                    const name = period.name;
                    
                    return html`
                        <div style="text-align: center; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px; min-width: 65px;">
                            <div style="font-size: 0.8em; opacity: 0.8; margin-bottom: 5px;">${name}</div>
                            <div style="font-size: 1.5em; margin: 5px 0;">${this.getWeatherEmoji(condition)}</div>
                            <div style="font-size: 0.9em; font-weight: bold;">${temp}°</div>
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
        const location = this._config.location_name || 'Weather';

        const clockImagePath = 'https://raw.githubusercontent.com/cnewman402/flippyweather-clock/main/themes/default/clock/';

        return html`
            <style>
                ${themes['default']['css']}
                
                .htc-clock {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin: 20px 0;
                    gap: 10px;
                }
                
                .clock-digit {
                    position: relative;
                    width: 80px;
                    height: 120px;
                    background-size: contain;
                    background-repeat: no-repeat;
                    background-position: center;
                    display: inline-block;
                }
                
                .digit-image {
                    width: 100%;
                    height: 100%;
                    background-size: contain;
                    background-repeat: no-repeat;
                    background-position: center;
                }
                
                .clock-separator {
                    width: 20px;
                    height: 120px;
                    font-size: 3em;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: blink 2s infinite;
                }
                
                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0.5; }
                }
                
                .weather-info {
                    margin: 20px 0;
                    color: white;
                    text-align: center;
                }
                
                .location {
                    font-size: 1.4em;
                    margin-bottom: 15px;
                    font-weight: 500;
                }
                
                .current-weather {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 20px;
                    margin: 20px 0;
                }
                
                .weather-icon {
                    font-size: 4em;
                    line-height: 1;
                }
                
                .temperature {
                    font-size: 3em;
                    font-weight: 300;
                    line-height: 1;
                }
                
                .condition {
                    font-size: 1.1em;
                    opacity: 0.9;
                    margin-bottom: 10px;
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
                        <div class="clock-digit">
                            <div class="digit-image" 
                                 data-digit="firstHourDigit"
                                 style="background-image: url('${clockImagePath}${hourStr[0]}.png')">
                            </div>
                        </div>
                        
                        <div class="clock-digit">
                            <div class="digit-image" 
                                 data-digit="secondHourDigit"
                                 style="background-image: url('${clockImagePath}${hourStr[1]}.png')">
                            </div>
                        </div>
                        
                        <div class="clock-separator">:</div>
                        
                        <div class="clock-digit">
                            <div class="digit-image" 
                                 data-digit="firstMinuteDigit"
                                 style="background-image: url('${clockImagePath}${minuteStr[0]}.png')">
                            </div>
                        </div>
                        
                        <div class="clock-digit">
                            <div class="digit-image" 
                                 data-digit="secondMinuteDigit"
                                 style="background-image: url('${clockImagePath}${minuteStr[1]}.png')">
                            </div>
                        </div>
                        
                        ${this._config.am_pm ? html`
                            <div style="margin-left: 10px; font-size: 1.2em; background: rgba(255,255,255,0.2); padding: 5px 10px; border-radius: 15px;">
                                ${now.getHours() >= 12 ? 'PM' : 'AM'}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="weather-info">
                        <div class="location">${location}</div>
                        
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
                    
                    <div style="font-size: 0.8em; opacity: 0.7; margin-top: 15px; color: white; text-align: center;">
                        FlippyWeather Clock v${flippyVersion} | NWS API
                    </div>
                </div>
            </ha-card>
        `;
    }

    getCardSize() {
        return 4;
    }
}

customElements.define("flippyweather-card", FlippyWeather);