import { LitElement, html } from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

class FlippyWeather extends LitElement {
    setConfig(config) {
        this._config = config;
    }

    set hass(hass) {
        this._hass = hass;
    }

    render() {
        return html`
            <ha-card>
                <div style="padding: 20px; text-align: center; background: #74b9ff; color: white; border-radius: 10px;">
                    <h2>🌤️ FlippyWeather Test</h2>
                    <p>✅ Card loaded successfully!</p>
                    <p>Time: ${new Date().toLocaleTimeString()}</p>
                    ${this._config && this._config.entity ? html`<p>Entity: ${this._config.entity}</p>` : html`<p>No entity configured</p>`}
                </div>
            </ha-card>
        `;
    }

    getCardSize() {
        return 3;
    }

    static getStubConfig() {
        return {};
    }
}

customElements.define("flippyweather-card", FlippyWeather);
console.log("✅ FlippyWeather card registered with proper HA methods!");