import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';

export default class ScrollTop extends LitElement {
  @property({ type: Object })
  config?: {
    label?: string;
    threshold?: number;
  };

  @state()
  private visible = false;

  static styles = css`
    :host {
      display: block;
    }

    button {
      position: fixed;
      bottom: 2rem;
      inset-inline-end: 2rem;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: none;
      background: #6200ee;
      color: #fff;
      font-size: 1.4rem;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
      transition: opacity 0.3s, transform 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    button:hover {
      transform: translateY(-3px);
      background: #3700b3;
    }

    button.hidden {
      opacity: 0;
      pointer-events: none;
      transform: translateY(10px);
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('scroll', this._onScroll);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('scroll', this._onScroll);
  }

  private _onScroll = () => {
    const threshold = this.config?.threshold ?? 300;
    this.visible = window.scrollY > threshold;
  };

  private _scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  render() {
    const label = this.config?.label || 'Scroll to top';
    return html`
      <button
        class=${this.visible ? '' : 'hidden'}
        @click=${this._scrollToTop}
        aria-label=${label}
        title=${label}
      >
        ↑
      </button>
    `;
  }
}
