import "https://unpkg.com/wired-card@0.8.1/wired-card.js?module";
import "https://unpkg.com/wired-toggle@0.8.0/wired-toggle.js?module";
import {
    LitElement,
    html,
    css
} from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

import { regional } from './regional.js?v1.1.5';
import { themes } from './themes.js?v1.0.2';

var forecastFinished = false;
var forecasts = {};

const weatherDefaults = {
    widgetPath: '/local/flippyweather-clock/',
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

const flippyVersion = "1.4.1";

console.info("%c Flippy Flip Clock %c ".concat(flippyVersion, " "), "color: white; background: #555555; ", "color: white; background: #3a7ec6; ");

class FlippyWeather extends LitElement {
    constructor() {
        super();
        this.dataInitialized = false;
        this.lastRenderedMinute = null;
        this.previousTime = { hour1: null, hour2: null, minute1: null, minute2: null };
        this.animatingDigits = new Set();
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
        
        this._config = defaultConfig;
    }

    connectedCallback() {
        super.connectedCallback();
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
            hour1: hourStr[0],
            hour2: hourStr[1],
            minute1: minuteStr[0],
            minute2: minuteStr[1]
        };
        
        // Trigger animations for changed digits
        Object.keys(currentTime).forEach(key => {
            if (this.previousTime[key] !== null && this.previousTime[key] !== currentTime[key]) {
                this.animateDigit(key);
            }
        });
        
        this.previousTime = currentTime;
    }

    animateDigit(digitKey) {
        const digitElement = this.shadowRoot.querySelector(`[data-digit="${digitKey}"]`);
        if (digitElement && !this.animatingDigits.has(digitKey)) {
            this.animatingDigits.add(digitKey);
            
            // Add flip animation class
            digitElement.classList.add('flipping');
            
            // Remove animation class after animation completes
            setTimeout(() => {
                digitElement.classList.remove('flipping');
                this.animatingDigits.delete(digitKey);
            }, 600);
        }
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

        return html`
            <style>
                ${themes[this._config.theme.name]['css']}
                .flippy-container {
                    background: linear-gradient(135deg, #74b9ff, #0984e3);
                    color: white;
                    padding: 20px;
                    border-radius: 15px;
                    text-align: center;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                }
                .flip-clock {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin: 20px 0;
                    gap: 20px;
                }
                .flip-digit {
                    position: relative;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 8px;
                    padding: 15px 20px;
                    font-size: 3em;
                    font-weight: bold;
                    font-family: 'Courier New', monospace;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                    min-width: 80px;
                    overflow: hidden;
                    perspective: 1000px;
                    transition: transform 0.1s ease;
                }
                
                .flip-digit.flipping {
                    animation: flipAnimation 0.6s ease-in-out;
                }
                
                @keyframes flipAnimation {
                    0% {
                        transform: rotateX(0deg);
                    }
                    50% {
                        transform: rotateX(-90deg);
                        background: rgba(255, 255, 255, 0.4);
                        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
                    }
                    100% {
                        transform: rotateX(0deg);
                    }
                }
                
                .flip-digit:hover {
                    transform: scale(1.05);
                    background: rgba(255, 255, 255, 0.3);
                }
                
                .flip-separator {
                    font-size: 3em;
                    font-weight: bold;
                    opacity: 0.8;
                    animation: blink 2s infinite;
                }
                
                @keyframes blink {
                    0%, 50% { opacity: 0.8; }
                    51%, 100% { opacity: 0.3; }
                }
                
                .weather-info {
                    margin: 20px 0;
                    animation: fadeInUp 0.8s ease-out;
                }
                
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .location {
                    font-size: 1.4em;
                    margin-bottom: 10px;
                    font-weight: 500;
                    transition: color 0.3s ease;
                }
                
                .temperature {
                    font-size: 2.5em;
                    font-weight: 300;
                    margin: 15px 0;
                    transition: all 0.3s ease;
                }
                
                .temperature:hover {
                    transform: scale(1.1);
                    text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
                }
                
                .condition {
                    font-size: 1.2em;
                    text-transform: capitalize;
                    opacity: 0.9;
                    transition: opacity 0.3s ease;
                }
                
                .am-pm {
                    font-size: 1.2em;
                    background: rgba(255, 255, 255, 0.2);
                    padding: 5px 10px;
                    border-radius: 15px;
                    margin-left: 10px;
                    transition: all 0.3s ease;
                    animation: pulse 3s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                        background: rgba(255, 255, 255, 0.2);
                    }
                    50% {
                        transform: scale(1.05);
                        background: rgba(255, 255, 255, 0.3);
                    }
                }
                
                .flippy-container:hover .flip-digit {
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
                }
                
                .flippy-container:hover .weather-info {
                    transform: translateY(-2px);
                }
                
                /* Loading shimmer effect */
                .loading-shimmer {
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                    background-size: 200% 100%;
                    animation: shimmer 2s infinite;
                }
                
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            </style>
            <ha-card @click="${this._handleClick}">
                <div class="flippy-container">
                    <div class="flip-clock">
                        <div class="flip-digit" data-digit="hour1">${hourStr[0]}</div>
                        <div class="flip-digit" data-digit="hour2">${hourStr[1]}</div>
                        <div class="flip-separator">:</div>
                        <div class="flip-digit" data-digit="minute1">${minuteStr[0]}</div>
                        <div class="flip-digit" data-digit="minute2">${minuteStr[1]}</div>
                        ${this._config.am_pm ? html`<div class="am-pm">${now.getHours() >= 12 ? 'PM' : 'AM'}</div>` : ''}
                    </div>
                    
                    <div class="weather-info">
                        <div class="location">${location}</div>
                        <div class="temperature">${temperature}°</div>
                        <div class="condition">${condition}</div>
                    </div>
                    
                    <div style="font-size: 0.8em; opacity: 0.7; margin-top: 15px;">
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
        return 3;
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