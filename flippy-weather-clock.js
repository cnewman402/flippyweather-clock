import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit-element@3.3.3/lit-element.min.js';

class FlippyWeatherClock extends LitElement {
  static properties = {
    hass: {},
    config: {}
  };

  static styles = css`
    :host {
      display: block;
      font-family: 'Roboto', sans-serif;
      color: var(--primary-text-color, #fff);
    }

    .flippy-card {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .clock {
      display: flex;
      align-items: center;
    }

    .colon {
      font-size: 3rem;
      margin: 0 0.2em;
    }

    .flip-digit {
      display: inline-block;
      perspective: 1000px;
      margin: 0 2px;
    }

    .digit {
      position: relative;
      display: block;
      width: 50px;
      height: 70px;
      background: var(--card-background-color, #222);
      color: var(--primary-text-color, #fff);
      font-size: 3rem;
      font-weight: bold;
      text-align: center;
      line-height: 70px;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    }

    .top,
    .bottom {
      height: 50%;
      overflow: hidden;
    }

    .top {
      border-bottom: 1px solid rgba(0,0,0,0.3);
    }

    .bottom {
      border-top: 1px solid rgba(0,0,0,0.3);
    }

    .flip {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 50%;
      background: var(--card-background-color, #222);
      backface-visibility: hidden;
      transform-origin: bottom;
      z-index: 2;
      transform: rotateX(0deg);
    }

    .flip.animate {
      animation: flipDown 0.5s ease-in-out forwards;
    }

    @keyframes flipDown {
      0% { transform: rotateX(0deg); }
      100% { transform: rotateX(-90deg); }
    }

    .weather {
      margin-top: 0.5em;
      font-size: 1.2rem;
      display: flex;
      align-items: center;
      gap: 0.5em;
    }

    .weather svg {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }
  `;

  setConfig(config) {
    if (!config.entity) throw new Error("Entity is required (weather entity)");
    this.config = config;
  }

  getCardSize() {
    return 3;
  }

  render() {
    const weather = this.hass.states[this.config.entity];
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');

    return html`
      <div class="flippy-card">
        <div class="clock">
          ${this.renderTimeDigits(hours)}
          <span class="colon">:</span>
          ${this.renderTimeDigits(minutes)}
        </div>
        ${weather ? html`
          <div class="weather">
            ${this.renderWeatherIcon(weather.state)}
            <span class="temp">${weather.attributes.temperature}°${weather.attributes.temperature_unit}</span>
          </div>
        ` : html`<div class="weather">No weather data</div>`}
      </div>
    `;
  }

  renderTimeDigits(str) {
    return str.split('').map(d => html`
      <div class="flip-digit">
        <div class="digit">
          <div class="top">${d}</div>
          <div class="bottom">${d}</div>
          <div class="flip">${d}</div>
        </div>
      </div>
    `);
  }

  renderWeatherIcon(condition) {
    const icons