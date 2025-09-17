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
                padding: 15px;
                border-radius: 15px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                height: 220px;
            }
            .flippy-container.night-mode {
                background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
            }
        `
    },
    dark: {
        css: `
            .flippy-container {
                background: linear-gradient(135deg, #2c3e50, #34495e);
                color: white;
                padding: 15px;
                border-radius: 15px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                height: 200px;
            }
        `
    },
    light: {
        css: `
            .flippy-container {
                background: linear-gradient(135deg, #ecf0f1, #bdc3c7);
                color: #2c3e50;
                padding: 15px;
                border-radius: 15px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                height: 200px;
            }
        `
    },
    sunset: {
        css: `
            .flippy-container {
                background: linear-gradient(135deg, #ff7675, #fd79a8, #fdcb6e);
                color: white;
                padding: 15px;
                border-radius: 15px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                box-shadow: 0 8px 32px rgba(255, 118, 117, 0.3);
                height: 200px;
            }
        `
    },
    ocean: {
        css: `
            .flippy-container {
                background: linear-gradient(135deg, #00b894, #00cec9, #74b9ff);
                color: white;
                padding: 15px;
                border-radius: 15px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                box-shadow: 0 8px 32px rgba(0, 184, 148, 0.3);
                height: 200px;
            }
        `
    }
};

const weatherDefaults = {
    location_name: 'Weather',
    am_pm: false,
    animated_background: true,
    theme: 'default',
    weather_entity: null,
    temperature_unit: 'fahrenheit'
};

const flippyVersion = "3.0.0";

console.info("%c 🌤️ FlippyWeather Clock %c " + flippyVersion + " ", "color: white; background: #555555; border-radius: 3px 0 0 3px; padding: 1px 0;", "color: white; background: #3a7ec6; border-radius: 0 3px 3px 0; padding: 1px 0;");

class FlippyWeatherClock extends LitElement {
    constructor() {
        super();
        this.weatherData = null;
        this.previousTime = {};
        this.animatingDigits = new Set();
        this.oldTime = {};
        this.currentCondition = '';
        this.currentTemperature = '--';
    }

    static getStubConfig() {
        return { 
            location_name: 'Home Assistant Location',
            animated_background: true,
            theme: 'default',
            weather_entity: 'weather.home',
            temperature_unit: 'fahrenheit'
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
        
        this.updateInterval = setInterval(() => {
            this.requestUpdate();
        }, 1000);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
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
        }, 150);
        
        setTimeout(() => {
            element.classList.remove('flipping');
            this.animatingDigits.delete(digitKey);
        }, 300);
    }

    getTemperatureUnit() {
        return this._config.temperature_unit === 'celsius' ? 'C' : 'F';
    }

    isNightTime() {
        const hour = new Date().getHours();
        return hour >= 20 || hour < 6;
    }

    getWeatherFromEntity() {
        if (!this.hass || !this._config.weather_entity) {
            return {
                temperature: '--',
                condition: 'Unknown',
                icon: this.isNightTime() ? '🌙' : '🌤️'
            };
        }

        const entity = this.hass.states[this._config.weather_entity];
        if (!entity) {
            return {
                temperature: '--',
                condition: 'Entity not found',
                icon: '❓'
            };
        }

        const temperature = entity.attributes.temperature || '--';
        const condition = entity.state || 'Unknown';
        
        const displayTemp = temperature === '--' ? '--' : Math.round(temperature);
        
        return {
            temperature: displayTemp,
            condition: condition,
            icon: this.getWeatherEmoji(condition)
        };
    }

    getWeatherEmoji(condition) {
        if (!condition) {
            return this.isNightTime() ? '🌙' : '🌤️';
        }
        
        const lowerCondition = condition.toLowerCase();
        const isNight = this.isNightTime();
        
        if (lowerCondition.includes('sunny') || lowerCondition.includes('clear')) {
            return isNight ? '🌙' : '☀️';
        }
        if (lowerCondition.includes('partlycloudy') || lowerCondition.includes('partly-cloudy')) return '⛅';
        if (lowerCondition.includes('cloudy')) return '☁️';
        if (lowerCondition.includes('rainy') || lowerCondition.includes('rain')) return '🌧️';
        if (lowerCondition.includes('lightning') || lowerCondition.includes('storm')) return '⛈️';
        if (lowerCondition.includes('snowy') || lowerCondition.includes('snow')) return '❄️';
        if (lowerCondition.includes('fog')) return '🌫️';
        if (lowerCondition.includes('windy') || lowerCondition.includes('wind')) return '💨';
        
        return isNight ? '🌙' : '🌤️';
    }

    getWeatherAnimationClass(condition) {
        if (!condition || !this._config.animated_background) return '';
        
        const lowerCondition = condition.toLowerCase();
        const isNight = this.isNightTime();
        
        if (lowerCondition.includes('rainy') || lowerCondition.includes('rain')) {
            return `weather-rain${isNight ? '-night' : ''}`;
        }
        if (lowerCondition.includes('snowy') || lowerCondition.includes('snow')) {
            return `weather-snow${isNight ? '-night' : ''}`;
        }
        if (lowerCondition.includes('lightning') || lowerCondition.includes('storm')) {
            return `weather-storm${isNight ? '-night' : ''}`;
        }
        if (lowerCondition.includes('cloudy')) {
            return `weather-cloudy${isNight ? '-night' : ''}`;
        }
        if (lowerCondition.includes('sunny') || lowerCondition.includes('clear')) {
            return isNight ? 'weather-clear-night' : 'weather-sunny';
        }
        if (lowerCondition.includes('fog')) {
            return `weather-fog${isNight ? '-night' : ''}`;
        }
        
        return isNight ? 'weather-default-night' : 'weather-default';
    }

    getWeatherIconClass(condition) {
        if (!condition) return 'sun';
        
        const lowerCondition = condition.toLowerCase();
        
        if (lowerCondition.includes('sunny') || lowerCondition.includes('clear')) return 'sun';
        if (lowerCondition.includes('rainy') || lowerCondition.includes('rain')) return 'rain';
        if (lowerCondition.includes('snowy') || lowerCondition.includes('snow')) return 'snow';
        if (lowerCondition.includes('lightning') || lowerCondition.includes('storm')) return 'storm';
        if (lowerCondition.includes('cloudy')) return 'cloud';
        if (lowerCondition.includes('fog')) return 'fog';
        
        return 'sun';
    }

    getNightModeClass() {
        return this.isNightTime() ? 'night-mode' : '';
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
        
        const weatherData = this.getWeatherFromEntity();
        const weatherAnimationClass = this.getWeatherAnimationClass(weatherData.condition);
        const selectedTheme = themes[this._config.theme] || themes.default;
        
        const weatherIcon = this.getWeatherEmoji(weatherData.condition);
        const iconClass = this.getWeatherIconClass(weatherData.condition);
        const tempUnit = this.getTemperatureUnit();
        const nightModeClass = this.getNightModeClass();

        return html`
            <style>
                ${selectedTheme.css}
                
                .flippy-container {
                    position: relative;
                    overflow: hidden;
                    transition: background 1s ease-in-out;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    height: 100%;
                }
                
                .weather-icon-large {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 300px;
                    z-index: 1;
                    pointer-events: none;
                    line-height: 1;
                }
                
                .left-section {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    position: relative;
                    z-index: 2;
                }
                
                .right-section {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    position: relative;
                    z-index: 2;
                }
                
                .flip-card {
                    width: 40px;
                    height: 60px;
                    perspective: 1000px;
                }
                
                .flip-card-inner {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    transition: transform 0.3s;
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
                    border-radius: 8px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2em;
                    font-weight: bold;
                    color: #ffffff;
                    font-family: 'Courier New', monospace;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
                    backdrop-filter: blur(5px);
                }
                
                .clock-separator {
                    font-size: 2.5em;
                    color: white;
                    animation: blink 2s infinite;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                    margin: 0 5px;
                }
                
                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0.3; }
                }
                
                .am-pm-indicator {
                    margin-left: 8px;
                    font-size: 0.9em;
                    background: rgba(255,255,255,0.2);
                    padding: 4px 8px;
                    border-radius: 10px;
                    font-weight: bold;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                }
                
                .temperature {
                    font-size: 4em;
                    font-weight: bold;
                    color: white;
                    text-shadow: 3px 3px 6px rgba(0,0,0,0.9);
                    text-align: right;
                    margin-bottom: 5px;
                }
                
                .condition {
                    font-size: 1.2em;
                    font-weight: bold;
                    color: white;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
                    text-align: right;
                    margin-bottom: 5px;
                }
                
                .date {
                    font-size: 0.9em;
                    color: white;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
                    text-align: right;
                    margin-bottom: 2px;
                }
                
                .time {
                    font-size: 0.8em;
                    color: white;
                    opacity: 0.9;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
                    text-align: right;
                }
            </style>
            <ha-card>
                <div class="flippy-container ${weatherAnimationClass} ${nightModeClass}">
                    <div class="weather-icon-large ${iconClass}">${weatherIcon}</div>
                    
                    <div class="left-section">
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
                    
                    <div class="right-section">
                        <div class="temperature">${weatherData.temperature}°${tempUnit}</div>
                        <div class="condition">${weatherData.condition.charAt(0).toUpperCase() + weatherData.condition.slice(1)}</div>
                        <div class="date">${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        <div class="time">${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</div>
                    </div>
                </div>
            </ha-card>
        `;
    }

    getCardSize() {
        return 2;
    }

    set hass(hass) {
        this._hass = hass;
        this.requestUpdate();
    }

    get hass() {
        return this._hass;
    }
}

customElements.define("flippyweather-clock", FlippyWeatherClock);
