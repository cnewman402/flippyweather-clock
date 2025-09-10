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
    },
    es: {
        days: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
        daysShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
        months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
        monthsShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    },
    fr: {
        days: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
        daysShort: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
        months: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
        monthsShort: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
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
    },
    dusk: {
        css: `
            .flippy-container {
                background: linear-gradient(135deg, #2d3436, #636e72);
                color: white;
                padding: 20px;
                border-radius: 15px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
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

const flippyVersion = "1.4.3";

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
        
        // Force GitHub CDN path - override any local paths
        defaultConfig.widgetPath = 'https://raw.githubusercontent.com/cnewman402/flippyweather-clock/main/';
        
        // Set up image paths to use GitHub CDN
        defaultConfig['imagesPath'] = defaultConfig.widgetPath + 'themes/' + defaultConfig.theme['name'] + '/';
        defaultConfig['clockImagesPath'] = defaultConfig.imagesPath + 'clock/';
        defaultConfig['weatherImagesPath'] = defaultConfig.imagesPath + 'weather/';
        
        // Debug: Log paths to console for troubleshooting
        console.log('FlippyWeather using GitHub CDN paths:', {
            widgetPath: defaultConfig.widgetPath,
            clockImagesPath: defaultConfig.clockImagesPath,
            weatherImagesPath: defaultConfig.weatherImagesPath
        });
        
        this._config = defaultConfig;
    }

    async connectedCallback() {
        super.connectedCallback();
        
        // No need to check assets - they're hosted on GitHub CDN!
        console.log('FlippyWeather: Using GitHub CDN for assets - no local installation required!');
        
        // Update every second to catch exact minute changes for smooth animations
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
        
        // Trigger animations for changed digits (like original repo)
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
            
            // Create flip animation using the original repo's method with image frames
            this.performFlipAnimation(digitElement, digitKey, oldDigit, newDigit);
        }
    }

    performFlipAnimation(element, digitKey, oldDigit, newDigit) {
        const clockPath = 'https://raw.githubusercontent.com/cnewman402/flippyweather-clock/main/themes/default/clock/';
        
        // Original repo used animation frames like: 01-1.png, 01-2.png, 01-3.png for flipping from 0 to 1
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
        const currentMinute = now.getMinutes();
        let hour = now.getHours();
        
        if (this._config.am_pm) {
            hour = hour > 12 ? hour - 12 : hour;
            if (hour === 0) hour = 12;
        }
        
        const hourStr = hour < 10 ? "0" + hour : "" + hour;
        const minuteStr = currentMinute < 10 ? "0" + currentMinute : "" + currentMinute;
        
        const temperature = Math.round(stateObj.attributes.temperature);
        const condition = stateObj.state;
        const location = stateObj.attributes.friendly_name;

        // FORCE GitHub CDN paths - override any configuration
        const GITHUB_CDN_BASE = 'https://raw.githubusercontent.com/cnewman402/flippyweather-clock/main/';
        const clockImagePath = GITHUB_CDN_BASE + 'themes/default/clock/';
        
        // Debug: Log the actual image URLs being used
        console.log('FlippyWeather render paths (forced GitHub CDN):', {
            baseUrl: GITHUB_CDN_BASE,
            clockPath: clockImagePath,
            hourDigit0: `${clockImagePath}${hourStr[0]}.png`,
            hourDigit1: `${clockImagePath}${hourStr[1]}.png`,
            minuteDigit0: `${clockImagePath}${minuteStr[0]}.png`,
            minuteDigit1: `${clockImagePath}${minuteStr[1]}.png`,
            separator: `${clockImagePath}dots.png`
        });

        return html`
            <style>
                ${themes[this._config.theme.name] ? themes[this._config.theme.name]['css'] : themes['default']['css']}
                
                .flippy-container {
                    position: relative;
                    text-align: center;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                .htc-clock {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin: 20px 0;
                    gap: 10px;
                    position: relative;
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
                
                .clock-background {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-image: url('https://raw.githubusercontent.com/cnewman402/flippyweather-clock/main/themes/default/clock/clockbg1.png');
                    background-size: contain;
                    background-repeat: no-repeat;
                    background-position: center;
                    z-index: 1;
                }
                
                .digit-image {
                    position: relative;
                    z-index: 2;
                    width: 100%;
                    height: 100%;
                    background-size: contain;
                    background-repeat: no-repeat;
                    background-position: center;
                }
                
                .clock-separator {
                    width: 20px;
                    height: 120px;
                    background-size: contain;
                    background-repeat: no-repeat;
                    background-position: center;
                    animation: blink 2s infinite;
                }
                
                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0.5; }
                }
                
                .am-pm-indicator {
                    position: absolute;
                    right: -60px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 40px;
                    height: 30px;
                    background-size: contain;
                    background-repeat: no-repeat;
                    background-position: center;
                }
                
                .weather-info {
                    margin: 20px 0;
                    color: white;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                }
                
                .current-weather {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 20px;
                    margin: 15px 0;
                }
                
                .main-weather-icon {
                    width: 64px;
                    height: 64px;
                    background-size: contain;
                    background-repeat: no-repeat;
                    background-position: center;
                    position: relative;
                    transition: transform 0.3s ease;
                }
                
                .main-weather-icon:hover {
                    transform: scale(1.1);
                }
                
                .weather-icon-fallback {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 2em;
                    display: none;
                }
                
                .location {
                    font-size: 1.4em;
                    margin-bottom: 10px;
                    font-weight: 500;
                }
                
                .temperature {
                    font-size: 2.5em;
                    font-weight: 300;
                }
                
                .condition {
                    font-size: 1.2em;
                    text-transform: capitalize;
                    opacity: 0.9;
                    margin-top: 10px;
                }
                
                .forecast-container {
                    display: flex;
                    justify-content: center;
                    gap: 15px;
                    margin-top: 20px;
                    flex-wrap: wrap;
                }
                
                .forecast-day {
                    text-align: center;
                    color: white;
                    min-width: 60px;
                    padding: 10px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    transition: all 0.3s ease;
                }
                
                .forecast-day:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: translateY(-2px);
                }
                
                .forecast-icon {
                    width: 40px;
                    height: 40px;
                    background-size: contain;
                    background-repeat: no-repeat;
                    background-position: center;
                    margin: 0 auto 8px;
                    position: relative;
                    transition: transform 0.3s ease;
                }
                
                .forecast-icon:hover {
                    transform: scale(1.1);
                }
                
                .weather-fallback {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 1.5em;
                    color: white;
                    text-align: center;
                    display: block; /* Show emoji fallbacks for now */
                    width: 40px;
                }
                
                .forecast-temp {
                    font-size: 0.9em;
                    font-weight: bold;
                }
                
                .forecast-day-name {
                    font-size: 0.8em;
                    opacity: 0.8;
                    margin-bottom: 5px;
                }
                
                .digit-fallback, .separator-fallback {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 3em;
                    font-weight: bold;
                    color: white;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
                    font-family: 'Courier New', monospace;
                    display: none; /* Hidden when images load */
                }
            </style>
            <ha-card @click="${this._handleClick}">
                <div class="flippy-container">
                    <div class="htc-clock">
                        <div class="clock-digit">
                            <div class="clock-background"></div>
                            <div class="digit-image" 
                                 data-digit="firstHourDigit"
                                 style="background-image: url('${clockImagePath}${hourStr[0]}.png')">
                                <span class="digit-fallback">${hourStr[0]}</span>
                            </div>
                        </div>
                        
                        <div class="clock-digit">
                            <div class="clock-background"></div>
                            <div class="digit-image" 
                                 data-digit="secondHourDigit"
                                 style="background-image: url('${clockImagePath}${hourStr[1]}.png')">
                                <span class="digit-fallback">${hourStr[1]}</span>
                            </div>
                        </div>
                        
                        <div class="clock-separator" 
                             style="background-image: url('${clockImagePath}dots.png')">
                            <span class="separator-fallback">:</span>
                        </div>
                        
                        <div class="clock-digit">
                            <div class="clock-background"></div>
                            <div class="digit-image" 
                                 data-digit="firstMinuteDigit"
                                 style="background-image: url('${clockImagePath}${minuteStr[0]}.png')">
                                <span class="digit-fallback">${minuteStr[0]}</span>
                            </div>
                        </div>
                        
                        <div class="clock-digit">
                            <div class="clock-background"></div>
                            <div class="digit-image" 
                                 data-digit="secondMinuteDigit"
                                 style="background-image: url('${clockImagePath}${minuteStr[1]}.png')">
                                <span class="digit-fallback">${minuteStr[1]}</span>
                            </div>
                        </div>
                        
                        ${this._config.am_pm ? html`
                            <div class="am-pm-indicator"
                                 style="background-image: url('${clockImagePath}${now.getHours() >= 12 ? 'pm' : 'am'}.png')">
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="weather-info">
                        <div class="location">${location}</div>
                        <div class="temperature">${temperature}°</div>
                        <div class="condition">${condition}</div>
                    </div>
                    
                    ${this._config.renderForecast ? this.renderForecast(stateObj) : ''}
                    
                    <!-- Force show a test forecast to debug -->
                    <div class="test-forecast" style="margin: 20px 0; color: white;">
                        <div style="font-size: 1.2em; margin-bottom: 10px;">Test Forecast:</div>
                        <div style="display: flex; gap: 10px; justify-content: center;">
                            <div style="text-align: center; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                                <div style="font-size: 1.5em;">☀️</div>
                                <div>Today</div>
                                <div>25°</div>
                            </div>
                            <div style="text-align: center; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                                <div style="font-size: 1.5em;">⛅</div>
                                <div>Tomorrow</div>
                                <div>22°</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="font-size: 0.8em; opacity: 0.7; margin-top: 15px; color: white;">
                        FlippyWeather Clock v${flippyVersion}
                    </div>
                </div>
            </ha-card>
        `;
    }

    renderForecast(stateObj) {
        if (!stateObj.attributes.forecast || !Array.isArray(stateObj.attributes.forecast)) {
            return html``;
        }

        const forecast = stateObj.attributes.forecast.slice(0, 4); // Show 4 days like original
        
        return html`
            <div class="forecast-container">
                ${forecast.map(day => {
                    const date = new Date(day.datetime);
                    const dayName = date.toLocaleDateString(this._config.lang, { weekday: 'short' });
                    const temp = Math.round(day.temperature);
                    const condition = day.condition;
                    
                    return html`
                        <div class="forecast-day">
                            <div class="forecast-day-name">${dayName}</div>
                            <div class="forecast-icon" 
                                 style="background-image: url('${this._config.weatherImagesPath}${this._config.theme.weather_icon_set}/${condition}.png')">
                            </div>
                            <div class="forecast-temp">${temp}°</div>
                        </div>
                    `;
                })}
            </div>
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