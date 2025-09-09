import { LitElement, html } from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

class FlippyWeather extends LitElement {
    render() {
        return html`
            <ha-card>
                <div style="padding: 20px; text-align: center; background: #74b9ff; color: white; border-radius: 10px;">
                    <h2>🌤️ FlippyWeather Test</h2>
                    <p>✅ Card loaded successfully!</p>
                    <p>Time: ${new Date().toLocaleTimeString()}</p>
                </div>
            </ha-card>
        `;
    }
}

customElements.define("flippyweather-card", FlippyWeather);
console.log("✅ FlippyWeather minimal card registered!");