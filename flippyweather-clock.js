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
        // Update every minute for the clock
        this.updateInterval = setInterval(() => {
            this.requestUpdate();
        }, 60000);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
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
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 8px;
                    padding: 15px 20px;
                    font-size: 3em;
                    font-weight: bold;
                    font-family: 'Courier New', monospace;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                    transition: all 0.3s ease;
                    min-width: 80px;
                }
                .flip-separator {
                    font-size: 3em;
                    font-weight: bold;
                    opacity: 0.8;
                }
                .weather-info {
                    margin: 20px 0;
                }
                .location {
                    font-size: 1.4em;
                    margin-bottom: 10px;
                    font-weight: 500;
                }
                .temperature {
                    font-size: 2.5em;
                    font-weight: 300;
                    margin: 15px 0;
                }
                .condition {
                    font-size: 1.2em;
                    text-transform: capitalize;
                    opacity: 0.9;
                }
                .am-pm {
                    font-size: 1.2em;
                    background: rgba(255, 255, 255, 0.2);
                    padding: 5px 10px;
                    border-radius: 15px;
                    margin-left: 10px;
                }
            </style>
            <ha-card @click="${this._handleClick}">
                <div class="flippy-container">
                    <div class="flip-clock">
                        <div class="flip-digit">${hourStr[0]}</div>
                        <div class="flip-digit">${hourStr[1]}</div>
                        <div class="flip-separator">:</div>
                        <div class="flip-digit">${minuteStr[0]}</div>
                        <div class="flip-digit">${minuteStr[1]}</div>
                        ${this._config.am_pm ? html`<div class="am-pm">${hour >= 12 ? 'PM' : 'AM'}</div>` : ''}
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