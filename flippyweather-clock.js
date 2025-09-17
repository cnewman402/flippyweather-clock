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
                min-height: 200px;
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
                min-height: 200px;
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
                min-height: 200px;
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
                min-height: 200px;
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
                min-height: 200px;
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
    temperature_unit: 'fahrenheit',
    compact_mode: false,
    show_date: true,
    show_condition: true,
    clock_size: 'medium',
    temperature_size: 'medium',
    text_shadow: true,
    blur_background: true,
    icon_opacity: 'medium',
    date_size: 'medium'
};

const flippyVersion = "4.10.0";

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
            temperature_unit: 'fahrenheit',
            compact_mode: false,
            show_date: true,
            show_condition: true,
            clock_size: 'medium',
            temperature_size: 'medium',
            text_shadow: true,
            blur_background: true,
            icon_opacity: 'medium',
            date_size: 'medium'
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

    getClockSize() {
        const clockSize = this._config.clock_size || 'medium';
        
        const sizes = {
            small: { 
                width: '30px', 
                height: '45px', 
                font: '1.4em', 
                separator: '2em' 
            },
            medium: { 
                width: '40px', 
                height: '60px', 
                font: '2em', 
                separator: '2.5em' 
            },
            large: { 
                width: '40px',     
                height: '80px',    
                font: '3em',       
                separator: '3.5em' 
            },
            'extra-large': { 
                width: '40px',     
                height: '100px',   
                font: '4em',       
                separator: '4.5em' 
            },
            huge: { 
                width: '45px',     
                height: '120px',   
                font: '5em',       
                separator: '5.5em' 
            }
        };
        
        return sizes[clockSize] || sizes.medium;
    }

    getTemperatureSize() {
        const tempSize = this._config.temperature_size || 'medium';
        
        const sizes = {
            small: 'clamp(0.8em, 3vw, 1.8em)',
            medium: 'clamp(1em, 4vw, 2.5em)',
            large: 'clamp(1.3em, 5vw, 3.2em)',
            'extra-large': 'clamp(1.6em, 6vw, 4em)',
            huge: 'clamp(2em, 7vw, 5em)'
        };
        
        return sizes[tempSize] || sizes.medium;
    }

    getDateSize() {
        const dateSize = this._config.date_size || 'medium';
        
        const sizes = {
            small: 'clamp(0.6em, 2vw, 0.75em)',
            medium: 'clamp(0.7em, 2.5vw, 0.9em)',
            large: 'clamp(0.85em, 3vw, 1.1em)',
            'extra-large': 'clamp(1em, 3.5vw, 1.3em)'
        };
        
        return sizes[dateSize] || sizes.medium;
    }

    getIconOpacity() {
        const opacities = {
            hidden: 0,
            low: 0.15,
            medium: 0.4,
            high: 0.6,
            full: 1.0
        };
        return opacities[this._config.icon_opacity] || opacities.medium;
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
        const clockSize = this.getClockSize();
        const temperatureSize = this.getTemperatureSize();
        const dateSize = this.getDateSize();
        const iconOpacity = this.getIconOpacity();

        return html`
            <style>
                ${selectedTheme.css}
                
                .flippy-container {
                    position: relative;
                    overflow: hidden;
                    transition: background 1s ease-in-out;
                    display: flex;
                    flex-direction: column;
                    min-height: ${this._config.compact_mode ? '150px' : '200px'};
                    padding-bottom: 5px;
                }
                
                .main-content {
                    display: flex;
                    flex-direction: ${this._config.compact_mode ? 'column' : 'row'};
                    align-items: ${this._config.compact_mode ? 'center' : 'center'};
                    justify-content: ${this._config.compact_mode ? 'center' : 'space-between'};
                    flex: 1;
                    gap: clamp(4px, 2vw, 12px);
                    min-width: 0;
                    width: 100%;
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
                    font-size: clamp(150px, 20vw, 300px);
                    z-index: 1;
                    pointer-events: none;
                    line-height: 1;
                    opacity: ${iconOpacity};
                }
                
                .left-section {
                    display: flex;
                    align-items: center;
                    gap: clamp(3px, 0.8vw, 6px);
                    position: relative;
                    z-index: 2;
                    flex-shrink: 0;
                }
                
                .right-section {
                    display: flex;
                    flex-direction: column;
                    align-items: ${this._config.compact_mode ? 'center' : 'flex-end'};
                    position: relative;
                    z-index: 2;
                    text-align: ${this._config.compact_mode ? 'center' : 'right'};
                    min-width: 0;
                    flex: 1;
                    overflow: hidden;
                    width: 100%;
                    max-width: 100%;
                }
                
                .date-bottom {
                    position: relative;
                    z-index: 2;
                    text-align: right;
                    margin-top: auto;
                    margin-bottom: 0;
                    padding-top: 15px;
                    min-width: 0;
                    overflow: hidden;
                    width: 100%;
                }
                
                .flip-card {
                    width: ${clockSize.width};
                    height: ${clockSize.height};
                    perspective: 1000px;
                    flex-shrink: 0;
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
                    border-radius: clamp(6px, 1.2vw, 12px);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: ${clockSize.font};
                    font-weight: bold;
                    color: #ffffff;
                    font-family: 'Courier New', monospace;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    text-shadow: ${this._config.text_shadow ? '3px 3px 6px rgba(0,0,0,0.9)' : 'none'};
                    backdrop-filter: ${this._config.blur_background ? 'blur(8px)' : 'none'};
                }
                
                .clock-separator {
                    font-size: ${clockSize.separator};
                    color: white;
                    animation: blink 2s infinite;
                    text-shadow: ${this._config.text_shadow ? '3px 3px 6px rgba(0,0,0,0.7)' : 'none'};
                    margin: 0 clamp(2px, 0.5vw, 6px);
                    flex-shrink: 0;
                    font-weight: bold;
                }
                
                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0.3; }
                }
                
                .am-pm-indicator {
                    margin-left: clamp(3px, 0.8vw, 6px);
                    font-size: clamp(0.6em, 2vw, 0.8em);
                    background: rgba(255,255,255,0.2);
                    padding: 3px 6px;
                    border-radius: 8px;
                    font-weight: bold;
                    text-shadow: ${this._config.text_shadow ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none'};
                    white-space: nowrap;
                    flex-shrink: 0;
                }
                
                .temperature {
                    font-size: ${temperatureSize};
                    font-weight: bold;
                    color: white;
                    text-shadow: ${this._config.text_shadow ? '3px 3px 6px rgba(0,0,0,0.9)' : 'none'};
                    margin-bottom: 2px;
                    white-space: nowrap;
                    overflow: visible;
                    width: 100%;
                    word-break: keep-all;
                    display: block;
                }
                
                .condition {
                    font-size: clamp(0.7em, 2.2vw, 1em);
                    font-weight: bold;
                    color: white;
                    text-shadow: ${this._config.text_shadow ? '2px 2px 4px rgba(0,0,0,0.7)' : 'none'};
                    margin-bottom: 2px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    width: 100%;
                    max-width: 100%;
                }
                
                .date {
                    font-size: ${dateSize};
                    color: white;
                    text-shadow: ${this._config.text_shadow ? '1px 1px 2px rgba(0,0,0,0.7)' : 'none'};
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    width: 100%;
                    max-width: 100%;
                }

                /* Responsive adjustments */
                @container (max-width: 450px) {
                    .main-content {
                        gap: clamp(3px, 1.5vw, 8px);
                    }
                    
                    .left-section {
                        gap: clamp(2px, 0.6vw, 4px);
                    }
                    
                    .condition {
                        font-size: clamp(0.65em, 2vw, 0.9em);
                    }
                }
                
                @container (max-width: 380px) {
                    .condition {
                        font-size: clamp(0.6em, 1.8vw, 0.8em);
                    }
                    
                    .left-section {
                        gap: clamp(1px, 0.4vw, 3px);
                    }
                    
                    .clock-separator {
                        margin: 0 clamp(1px, 0.3vw, 3px);
                    }
                }
                
                @container (max-width: 350px) {
                    .main-content {
                        flex-direction: column;
                        gap: 6px;
                        text-align: center;
                    }
                    
                    .right-section {
                        align-items: center;
                        text-align: center;
                    }
                    
                    .date-bottom {
                        text-align: center;
                    }
                    
                    .weather-icon-large {
                        font-size: 120px;
                        opacity: ${iconOpacity * 0.8};
                    }
                    
                    .flip-card {
                        width: calc(${clockSize.width} * 0.85);
                        height: calc(${clockSize.height} * 0.85);
                    }
                    
                    .condition {
                        font-size: clamp(0.8em, 2.5vw, 1.1em);
                    }
                }
                
                @container (max-width: 280px) {
                    .left-section {
                        gap: 1px;
                    }
                    
                    .flip-card {
                        width: calc(${clockSize.width} * 0.75);
                        height: calc(${clockSize.height} * 0.75);
                    }
                    
                    .am-pm-indicator {
                        padding: 2px 4px;
                        font-size: 0.55em;
                    }
                    
                    .weather-icon-large {
                        font-size: 100px;
                        opacity: ${iconOpacity * 0.7};
                    }
                    
                    .condition {
                        font-size: clamp(0.7em, 1.8vw, 0.9em);
                    }
                    
                    .clock-separator {
                        margin: 0 1px;
                    }
                }
            </style>
            <ha-card style="container-type: inline-size;">
                <div class="flippy-container ${weatherAnimationClass} ${nightModeClass}">
                    <div class="weather-icon-large ${iconClass}">${weatherIcon}</div>
                    
                    <div class="main-content">
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
                            ${this._config.show_condition ? html`
                                <div class="condition">${weatherData.condition.charAt(0).toUpperCase() + weatherData.condition.slice(1)}</div>
                            ` : ''}
                        </div>
                    </div>
                    
                    ${this._config.show_date ? html`
                        <div class="date-bottom">
                            <div class="date">${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        </div>
                    ` : ''}
                </div>
            </ha-card>
        `;
    }

    getCardSize() {
        return this._config.compact_mode ? 1 : 2;
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