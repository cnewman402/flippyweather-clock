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
    render: true,
    renderClock: true,
    renderDetails: true,
    renderForecast: true,
    high_low_entity: false,
    theme: {
        name: 'default',
        weather_icon_set: 'default'
    }
};

weatherDefaults['imagesPath'] = weatherDefaults.widgetPath + 'themes/' + weatherDefaults.theme['name'] + '/';
weatherDefaults['clockImagesPath'] = weatherDefaults.imagesPath + 'clock/';
weatherDefaults['weatherImagesPath'] = weatherDefaults.imagesPath + 'weather/' + weatherDefaults.theme['weather_icon_set'] + '/';

const flippyVersion = "1.4.1";

const weatherIconsDay = {
    clear: "sunny",
    "clear-night": "night",
    cloudy: "cloudy",
    fog: "fog",
    hail: "hail",
    lightning: "thunder",
    "lightning-rainy": "thunder",
    partlycloudy: "partlycloudy",
    pouring: "pouring",
    rainy: "pouring",
    snowy: "snowy",
    "snowy-rainy": "snowy-rainy",
    sunny: "sunny",
    windy: "cloudy",
    "windy-variant": "cloudy-day-3",
    exceptional: "na"
};

const weatherIconsNight = {
    ...weatherIconsDay,
    fog: "fog",
    clear: "night",
    sunny: "night",
    partlycloudy: "cloudy-night-3",
    "windy-variant": "cloudy-night-3"
};

const fireEvent = (node, type, detail, options) => {
    options = options || {};
    detail = detail === null || detail === undefined ? {} : detail;
    const event = new Event(type, {
        bubbles: options.bubbles === undefined ? true : options.bubbles,
        cancelable: Boolean(options.cancelable),
        composed: options.composed === undefined ? true : options.composed
    });
    event.detail = detail;
    node.dispatchEvent(event);
    return event;
};

function hasConfigOrEntityChanged(element, changedProps) {
    if (changedProps.has("_config")) {
        return true;
    }
    const oldHass = changedProps.get("hass");
    if (oldHass) {
        return (
            oldHass.states[element._config.entity] !==
            element.hass.states[element._config.entity] ||
            oldHass.states["sun.sun"] !== element.hass.states["sun.sun"] ||
            oldHass.states["sensor.date_time_iso"] !== element.hass.states["sensor.date_time_iso"]
        );
    }
    return true;
}

console.info("%c Flippy Flip Clock %c ".concat(flippyVersion, " "), "color: white; background: #555555; ", "color: white; background: #3a7ec6; ");

class FlippyWeather extends LitElement {
    constructor() {
        super();
        this.numberElements = 0;
        this.lastRenderedMinute = null;
        this.dataInitialized = false;
    }

    static get getConfig() {
        return this._config;
    }
    
    static set setConfig(config) {
        this._config = config;
    }
    
    static get getHass() {
        return this.hass;
    }
    
    static set setHass(hass) {
        this.hass = hass;
    }

    async initializeData() {
        return { 
            config: this._config, 
            entity: this.hass.states[this._config.entity], 
            hass_states: this.hass.states 
        };
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
            if (property == 'lang') {
                if (!regional[config[property]]) {
                    defaultConfig[property] = weatherDefaults[property];
                }
            }
        }
        
        for (const property in weatherDefaults) {
            if (config[property] === undefined) {
                defaultConfig[property] = weatherDefaults[property];
            }
        }
        
        defaultConfig['imagesPath'] = defaultConfig.widgetPath + 'themes/' + defaultConfig.theme['name'] + '/';
        defaultConfig['clockImagesPath'] = defaultConfig.imagesPath + 'clock/';
        defaultConfig['weatherImagesPath'] = defaultConfig.imagesPath + 'weather/' + defaultConfig.theme['weather_icon_set'] + '/';
        
        this._config = defaultConfig;
    }

    shouldUpdate(changedProps) {
        var shouldUpdate = hasConfigOrEntityChanged(this, changedProps);
        if (shouldUpdate) {
            FlippyWeather.setHass = this.hass;
            this.render();
        }
        if (!forecastFinished) {
            this.updateForecasts();
        }
        return shouldUpdate;
    }

    updateForecasts() {
        if (!this._config || !this.hass) {
            return;
        }
        
        const self = this;
        FlippyWeather.setConfig = this._config;
        FlippyWeather.setHass = this.hass;
        
        if (!this._config.high_low_entity) {
            FlippyWeather.getHass.callService('weather', 'get_forecasts', 
                { 'type': 'daily' }, 
                { 'entity_id': self._config.entity }, 
                false, true
            ).then(function (res) {
                forecastFinished = true;
                forecasts = res.response[self._config.entity].forecast;
            });
        }
        this.render();
    }

    render() {
        if (!this._config || !this.hass) {
            return html``;
        }

        return html`
            <ha-card>
                <div style="padding: 16px;">
                    <div style="background: linear-gradient(135deg, #74b9ff, #0984e3); color: white; padding: 20px; border-radius: 10px; text-align: center;">
                        <h2>🌤️ FlippyWeather Clock</h2>
                        <p>Entity: ${this._config.entity}</p>
                        <p>Time: ${new Date().toLocaleTimeString()}</p>
                        <p>Status: Loading...</p>
                    </div>
                </div>
            </ha-card>
        `;
    }

    _handleClick() {
        fireEvent(this, "hass-more-info", { entityId: this._config.entity });
    }

    getCardSize() {
        return 3;
    }

    set hass(hass) {
        this._hass = hass;
    }

    get hass() {
        return this._hass;
    }
}

customElements.define("flippyweather-card", FlippyWeather);