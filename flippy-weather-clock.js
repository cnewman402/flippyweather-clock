class flippy-weather-card extends window.LitElement {
  static get properties() {
    return {
      config: {},
      weather: {},
      time: {},
    };
  }

  static get styles() {
    return window.css`
      :host {
        display: block;
        font-family: 'Segoe UI', sans-serif;
      }
      .card {
        background: var(--card-background-color, #1e1e1e);
        color: var(--primary-text-color, #fff);
        padding: 1em;
        border-radius: 12px;
      }
      .clock {
        font-size: 3em;
        font-weight: bold;
        text-align: center;
      }
      .weather {
        display: flex;
        justify-content: space-between;
        margin-top: 1em;
      }
    `;
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('Weather entity is required');
    }
    this.config = config;
  }

  connectedCallback() {
    super.connectedCallback();
    this._updateTime();
    this._timeInterval = setInterval(() => this._updateTime(), 60000);
  }

  disconnectedCallback() {
    clearInterval(this._timeInterval);
    super.disconnectedCallback();
  }

  _updateTime() {
    const now = new Date();
    this.time = {
      hours: now.getHours().toString().padStart(2, '0'),
      minutes: now.getMinutes().toString().padStart(2, '0'),
    };
  }

  set hass(hass) {
    this._hass = hass;
    const entity = this.config.entity;
    const stateObj = hass.states[entity];
    if (stateObj) {
      this.weather = stateObj.attributes;
    }
  }

  render() {
    return window.html`
      <ha-card class="card">
        <div class="clock">${this.time?.hours}:${this.time?.minutes}</div>
        <div class="weather">
          <div>${this.weather?.temperature ?? '--'}°</div>
          <div>${this.weather?.condition ?? 'Unknown'}</div>
        </div>
      </ha-card>
    `;
  }
}

customElements.define('flippy-weather-card', FlippyWeatherCard);