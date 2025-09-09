import { LitElement, html, css } from 'https://unpkg.com/lit@2.8.0/index.js?module';

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
      width: 50px;
      height: 70px;
      background: var(--card-background-color, #222);
      color: var(--primary-text-color, #fff);
      font-weight: bold;
      text-align: center;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    }

    .top, .bottom {
      position: absolute;
      width: 100%;
      height: 50%;
      font-size: 3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .top {
      top: 0;
      clip-path: inset(0 0 50% 0);
      z-index: 2;
    }

    .bottom {
      bottom: 0;
      clip-path: inset(50% 0 0 0);
      z-index: 1;
    }

    .flip {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 50%;
      font-size: 3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--card-background-color, #222);
      color: var(--primary-text-color, #fff);
      backface-visibility: hidden;
      transform-origin: bottom;
      z-index: 3;
      transform: rotateX(0deg);
      pointer-events: none;
      display: none;
      clip-path: inset(0 0 50% 0);
    }

    .flip.animate {
      display: flex;
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
    const icons = {
      sunny: html`<svg viewBox="0 0 24 24"><path d="M12,4A1,1 0 0,1 13,5V7A1,1 0 0,1 12,8A1,1 0 0,1 11,7V5A1,1 0 0,1 12,4M4.22,5.64L5.64,4.22L7.05,5.64L5.64,7.05L4.22,5.64M1,11H3A1,1 0 0,1 4,12A1,1 0 0,1 3,13H1A1,1 0 0,1 0,12A1,1 0 0,1 1,11M4.22,18.36L5.64,16.95L7.05,18.36L5.64,19.78L4.22,18.36M11,21H13A1,1 0 0,1 14,22A1,1 0 0,1 13,23H11A1,1 0 0,1 10,22A1,1 0 0,1 11,21M16.95,18.36L18.36,16.95L19.78,18.36L18.36,19.78L16.95,18.36M21,11H23A1,1 0 0,1 24,12A1,1 0 0,1 23,13H21A1,1 0 0,1 20,12A1,1 0 0,1 21,11M16.95,5.64L18.36,4.22L19.78,5.64L18.36,7.05L16.95,5.64Z"/></svg>`,
      cloudy: html`<svg viewBox="0 0 24 24"><path d="M6,19A4,4 0 0,1 2,15A4,4 0 0,1 6,11H7.26A6,6 0 0,1 19,13A4,4 0 0,1 19,21H6Z"/></svg>`,
      rainy: html`<svg viewBox="0 0 24 24"><path d="M6,14A4,4 0 0,1 2,10A4,4 0 0,1 6,6H7.26A6,6 0 0,1 19,8A4,4 0 0,1 19,16H6M7,20A1,1 0 0,1 6,19A1,1 0 0,1 7,18A1,1 0 0,1 8,19A1,1 0 0,1 7,20M12,20A1,1 0 0,1 11,19A1,1 0 0,1 12,18A1,1 0 0,1 13,19A1,1 0 0,1 12,20M17,20A1,1 0 0,1 16,19A1,1 0 0,1 17,18A1,1 0 0,1 18,19A1,1 0 0,1 17,20Z"/></svg>`
    };
    const key = condition.toLowerCase();
    return icons[key] || html`<span>${condition}</span>`;
  }

  updated() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const allDigits = [...hours.split(''), ...minutes.split('')];

  this.shadowRoot.querySelectorAll('.flip-digit').forEach((el, i) => {
    const top = el.querySelector('.top');
    const bottom = el.querySelector('.bottom');
    const flip = el.querySelector('.flip');
    const newVal = allDigits[i];

    const currentVal = top.textContent;

    if (currentVal !== newVal) {
      flip.textContent = currentVal;
      flip.style.display = 'flex';
      flip.classList.remove('animate');
      void flip.offsetWidth;
      flip.classList.add('animate');

      flip.addEventListener('animationend', () => {
        top.textContent = newVal;
        bottom.textContent = newVal;
        flip.classList.remove('animate');
        flip.style.display = 'none';
      }, { once: true });
    }
  });
}

}

customElements.define('flippy-weather-clock', FlippyWeatherClock);

