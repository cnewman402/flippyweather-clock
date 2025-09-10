import "https://unpkg.com/wired-card@0.8.1/wired-card.js?module";
import "https://unpkg.com/wired-toggle@0.8.0/wired-toggle.js?module";
import {
    LitElement,
    html,
    css
} from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

// Inline regional data to avoid 404 errors
const regional = {
    en: {
        days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        daysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    }
};

// Inline themes data to avoid 404 errors
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

var forecastFinished = false;
var forecasts = {};

const weatherDefaults = {
    widgetPath: 'https://raw.githubusercontent.com/cnewman402/flippyweather-clock/main/',
    lang: 'en',
    am_pm: false,
    svrOffset: 0,
    renderForecast: true,
    renderDetails: true,
    high_low_entity: false,
    theme: {
        name: 'default',
        weather_icon_set: 'default'
    }
};

const flippyVersion = "1.5.0";

console.info("%c Flippy Flip Clock %c ".concat(flippyVersion, " "), "color: white; background: #555555; ", "color: white; background: #3a7ec6; ");

class FlippyWeather extends LitElement {
    constructor() {
        super();
        this.dataInitialized = false;
        this.lastRenderedMinute = null;
        this.previousTime = { hour1: null, hour2: null, minute1: null, minute2: null };
        this.animatingDigits = new Set();
        this.oldTime = {};
    }

    static getStubConfig() {
        return { entity: "weather.demo" };
    }

    setConfig(config) {
        if (!config.entity) {
            throw new Error("You need to define an entity");
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
        
        // Force GitHub CDN path
        defaultConfig.widgetPath = 'https://raw.githubusercontent.com/cnewman402/flippyweather-clock/main/';
        
        this._config = defaultConfig;
    }

    async connectedCallback() {
        super.connectedCallback();
        
        console.log('FlippyWeather: Using GitHub CDN for assets');
        
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
        const emojiMap = {
            'clear-night': '🌙',
            'cloudy': '☁️',
            'partlycloudy': '⛅',
            'sunny': '☀️',
            'rainy': '🌧️',
            'pouring': '🌧️',
            'fog': '🌫️',
            'hail': '🌨️',
            'lightning': '⛈️',
            'lightning-rainy': '⛈️',
            'snowy': '❄️',
            'snowy-rainy': '🌨️',
            'windy': '💨',
            'windy-variant': '💨',
            'exceptional': '🌡️'
        };
        return emojiMap[condition] || '🌤️';
    }

    renderSimpleForecast(stateObj) {
    console.log('Forecast debug:', stateObj.attributes.forecast); // Add this debug line
    
    if (!stateObj.attributes.forecast || !Array.isArray(stateObj.attributes.forecast)) {
        return html``;
    }

        const forecast = stateObj.attributes.forecast.slice(0, 4);
        
        return html`
            <div style="display: flex; justify-content: center; gap: 15px; margin-top: 20px; flex-wrap: wrap;">
                ${forecast.map(day => {
                    const date = new Date(day.datetime);
                    const dayName = date.toLocaleDateString('en', { weekday: 'short' });
                    const temp = Math.round(day.temperature);
                    const condition = day.condition;
                    
                    return html`
                        <div style="text-align: center; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px; min-width: 60px; transition: all 0.3s ease;">
                            <div style="font-size: 0.8em; opacity: 0.8; margin-bottom: 5px;">${dayName}</div>
                            <div style="font-size: 1.5em; margin: 5px 0;">${this.getWeatherEmoji(condition)}</div>
                            <div style="font-size: 0.9em; font-weight: bold;">${temp}°</div>
                        </div>
                    `;
                })}
            </div>
        `;
    }

    render() {
        if (!this._config || !this.hass) {
            return html`<ha-card><div style="padding: 20px;">Loading configuration...</div></ha-card>`;
        }

        const stateObj = this.hass.states[this._config.entity];
        const timeObj = this.hass.states["sensor.date_time_iso"];
        
        if (!stateObj) {
            return html`<ha-card><div style="padding: 20px; color: red;">Weather entity not found: ${this._config.entity}</div></ha-card>`;
        }

        if (!timeObj) {
            return html`<ha-card><div style="padding: 20px; color: orange;">Time sensor not found. Add time_date sensors to configuration.yaml</div></ha-card>`;
        }

        const now = new Date();
        let hour = now.getHours();
        
        if (this._config.am_pm) {
            hour = hour > 12 ? hour - 12 : hour;
            if (hour === 0) hour = 12;
        }
        
        const hourStr = hour < 10 ? "0" + hour : "" + hour;
        const minuteStr = now.getMinutes() < 10 ? "0" + now.getMinutes() : "" + now.getMinutes();
        
        const temperature = Math.round(stateObj.attributes.temperature);
        const condition = stateObj.state;
        const location = stateObj.attributes.friendly_name;

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
                    font-size: 1.2em;
                    text-transform: capitalize;
                    opacity: 0.9;
                    margin-bottom: 10px;
                }
                
                .forecast-card {
                    background: rgba(255,255,255,0.1);
                    border-radius: 8px;
                    padding: 10px;
                    min-width: 60px;
                    transition: all 0.3s ease;
                    cursor: pointer;
                }
                
                .forecast-card:hover {
                    background: rgba(255,255,255,0.2);
                    transform: translateY(-2px);
                }
            </style>
            <ha-card @click="${this._handleClick}">
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
                        
                        <div class="current-weather">
                            <div class="weather-icon">${this.getWeatherEmoji(condition)}</div>
                            <div class="temperature">${temperature}°</div>
                        </div>
                        
                        <div class="condition">${condition}</div>
                        
                        ${this.renderSimpleForecast(stateObj)}
                    </div>
                    
                    <div style="font-size: 0.8em; opacity: 0.7; margin-top: 15px; color: white; text-align: center;">
                        FlippyWeather Clock v${flippyVersion}
                    </div>
                </div>
            </ha-card>
        `;
    }

    _handleClick() {
        const event = new Event("hass-more-info", {
            bubbles: true,
            composed: true
        });
        event.detail = { entityId: this._config.entity };
        this.dispatchEvent(event);
    }

    getCardSize() {
        return 4;
    }

    set hass(hass) {
        this._hass = hass;
        this.requestUpdate();
    }

    get hass() {
        return this._hass;
    }
}

customElements.define("flippyweather-card", FlippyWeather);