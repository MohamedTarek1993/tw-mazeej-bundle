import { css, html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

interface Slide {
  image?: string;
  sub_title?: string;
  title?: string;
  text?: string;
  show_btn?: boolean;
  name_btn?: string;
  link_btn?: string;
}

interface SliderConfig {
  slides?: Slide[];
  // Layout
  height?: string;
  content_position?: string;
  // Auto-slide
  auto_slide?: boolean;
  slide_duration?: number;
  // Navigation
  show_arrows?: boolean;
  show_dots?: boolean;
  show_progress?: boolean;
  // Overlay
  overlay_color?: string;
  overlay_opacity?: number;
  // Sub-title typography
  subtitle_color?: string;
  subtitle_size?: number;
  // Title typography
  title_color?: string;
  title_size?: number;
  title_size_mobile?: number;
  // Description typography
  desc_color?: string;
  desc_size?: number;
  // Button styling
  btn_bg_color?: string;
  btn_text_color?: string;
  btn_border_radius?: number;
  btn_border_color?: string;
  // Navigation colors
  arrows_color?: string;
  arrows_bg?: string;
  dots_color?: string;
  dots_active_color?: string;
  progress_color?: string;
}

export default class SliderBannersInteractive extends LitElement {
  @property({ type: Object })
  config?: SliderConfig;

  @state() private current = 0;
  @state() private progressWidth = 0;

  private _slideTimer?: ReturnType<typeof setInterval>;
  private _progressTimer?: ReturnType<typeof setInterval>;
  private _touchStartX = 0;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      font-family: inherit;
    }

    .slider {
      position: relative;
      width: 100%;
      overflow: hidden;
      background: #000;
    }

    /* ── Slides ── */
    .slides-track {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .slide {
      position: absolute;
      inset: 0;
      opacity: 0;
      transform: scale(1.06);
      transition: opacity 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                  transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      pointer-events: none;
    }

    .slide.active {
      opacity: 1;
      transform: scale(1);
      pointer-events: auto;
      position: relative;
    }

    .slide.prev {
      transform: translateX(-100%) scale(0.9);
    }

    .slide.next {
      transform: translateX(100%) scale(0.9);
    }

    /* ── Background image ── */
    .slide-bg {
      position: absolute;
      inset: 0;
      overflow: hidden;
    }

    .slide-bg img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      animation: kenBurns 10s ease-in-out infinite;
    }

    @keyframes kenBurns {
      0%   { transform: scale(1); }
      50%  { transform: scale(1.07); }
      100% { transform: scale(1); }
    }

    .overlay {
      position: absolute;
      inset: 0;
    }

    /* ── Content ── */
    .slide-content {
      position: absolute;
      top: 55%;
      transform: translateY(-55%);
      max-width: 600px;
      z-index: 10;
      padding: 0 1.5rem;
    }

    .content-end   { inset-inline-end: 8%; }
    .content-start { inset-inline-start: 8%; }
    .content-center {
      left: 50%;
      right: auto;
      transform: translate(-50%, -55%);
      text-align: center;
    }

    .slide-subtitle {
      font-size: var(--subtitle-size, 1.1rem);
      color: var(--subtitle-color, #c8a96e);
      font-weight: 600;
      margin-bottom: 12px;
      letter-spacing: 2px;
      text-transform: uppercase;
      opacity: 0;
      transform: translateY(40px);
      transition: opacity 1s ease 0.1s, transform 1s ease 0.1s;
    }

    .slide-title {
      font-size: var(--title-size, 3.5rem);
      font-weight: 800;
      color: var(--title-color, #ffffff);
      line-height: 1.25;
      margin-bottom: 18px;
      opacity: 0;
      transform: translateY(40px);
      transition: opacity 1s ease 0.25s, transform 1s ease 0.25s;
      text-shadow: 0 4px 18px rgba(0,0,0,0.45);
    }

    .slide-description {
      font-size: var(--desc-size, 1.1rem);
      color: var(--desc-color, rgba(255,255,255,0.85));
      line-height: 1.8;
      margin-bottom: 28px;
      opacity: 0;
      transform: translateY(40px);
      transition: opacity 1s ease 0.4s, transform 1s ease 0.4s;
    }

    .slide-btn {
      display: inline-block;
      padding: 14px 36px;
      background: var(--btn-bg, #c8a96e);
      color: var(--btn-color, #ffffff);
      border: 2px solid var(--btn-border, transparent);
      border-radius: var(--btn-radius, 4px);
      font-size: 1rem;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: opacity 0.3s, transform 0.3s, box-shadow 0.3s;
      opacity: 0;
      transform: translateY(40px);
      transition: opacity 1s ease 0.55s, transform 1s ease 0.55s,
                  background 0.3s, box-shadow 0.3s;
    }

    .slide-btn:hover {
      opacity: 0.88;
      box-shadow: 0 8px 24px rgba(0,0,0,0.35);
      transform: translateY(-2px);
    }

    /* animate-in when slide is active */
    .slide.active .slide-subtitle,
    .slide.active .slide-title,
    .slide.active .slide-description,
    .slide.active .slide-btn {
      opacity: 1;
      transform: translateY(0);
    }

    /* ── Arrows ── */
    .arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 52px;
      height: 52px;
      border-radius: 50%;
      border: 2px solid var(--arrows-border, rgba(255,255,255,0.35));
      background: var(--arrows-bg, rgba(255,255,255,0.1));
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 30;
      transition: background 0.3s, border-color 0.3s, transform 0.3s;
    }

    .arrow:hover {
      background: var(--arrows-bg-hover, rgba(255,255,255,0.22));
      border-color: var(--arrows-color, #c8a96e);
      transform: translateY(-50%) scale(1.1);
    }

    .arrow-prev { inset-inline-start: 28px; }
    .arrow-next { inset-inline-end:  28px; }

    .arrow svg {
      width: 22px;
      height: 22px;
      fill: var(--arrows-color, #ffffff);
      transition: fill 0.3s;
    }

    /* ── Dots ── */
    .dots {
      position: absolute;
      bottom: 28px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 12px;
      z-index: 20;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--dots-color, rgba(255,255,255,0.4));
      cursor: pointer;
      transition: all 0.35s ease;
      border: 2px solid transparent;
    }

    .dot.active {
      background: var(--dots-active, #c8a96e);
      transform: scale(1.5);
      border-color: var(--dots-active, #c8a96e);
    }

    /* ── Progress bar ── */
    .progress {
      position: absolute;
      bottom: 0;
      inset-inline-start: 0;
      height: 3px;
      background: var(--progress-color, #c8a96e);
      transition: width 0.1s linear;
      z-index: 25;
    }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      .slide-content {
        inset-inline-start: 5% !important;
        inset-inline-end: 5% !important;
        max-width: 90% !important;
      }
      .content-center {
        left: 5% !important;
        transform: translateY(-55%) !important;
        text-align: start !important;
      }
      .slide-title {
        font-size: var(--title-size-mobile, 2rem) !important;
      }
      .slide-description { font-size: 0.95rem; }
      .arrow { width: 40px; height: 40px; }
      .arrow-prev { inset-inline-start: 10px; }
      .arrow-next { inset-inline-end:  10px; }
    }

    @media (max-width: 480px) {
      .slide-title { font-size: var(--title-size-mobile, 1.5rem) !important; }
      .slide-description { font-size: 0.8rem; }
    }
  `;

  // ── Lifecycle ──────────────────────────────────────────────────────────
  connectedCallback() {
    super.connectedCallback();
    this._startAuto();
    this._startProgress();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._clearTimers();
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('config')) {
      this.current = 0;
      this._resetAuto();
    }
  }

  // ── Timer helpers ──────────────────────────────────────────────────────
  private get _duration() {
    return (this.config?.slide_duration ?? 6) * 1000;
  }

  private get _slides(): Slide[] {
    return this.config?.slides ?? [];
  }

  private _startAuto() {
    if (this.config?.auto_slide === false) return;
    this._slideTimer = setInterval(() => this._go(1), this._duration);
  }

  private _startProgress() {
    if (this.config?.auto_slide === false) return;
    this.progressWidth = 0;
    const step = 100 / (this._duration / 100);
    this._progressTimer = setInterval(() => {
      this.progressWidth = Math.min(this.progressWidth + step, 100);
    }, 100);
  }

  private _clearTimers() {
    clearInterval(this._slideTimer);
    clearInterval(this._progressTimer);
  }

  private _resetAuto() {
    this._clearTimers();
    this.progressWidth = 0;
    this._startAuto();
    this._startProgress();
  }

  // ── Navigation ─────────────────────────────────────────────────────────
  private _go(dir: number) {
    const total = this._slides.length;
    if (total < 2) return;
    this.current = (this.current + dir + total) % total;
    this._resetAuto();
  }

  private _goTo(idx: number) {
    this.current = idx;
    this._resetAuto();
  }

  // ── Touch ──────────────────────────────────────────────────────────────
  private _onTouchStart(e: TouchEvent) {
    this._touchStartX = e.changedTouches[0].screenX;
  }

  private _onTouchEnd(e: TouchEvent) {
    const diff = this._touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) this._go(diff > 0 ? 1 : -1);
  }

  // ── Render helpers ─────────────────────────────────────────────────────
  private _cssVars() {
    const c = this.config ?? {};
    return {
      '--subtitle-color':   c.subtitle_color    ?? '#c8a96e',
      '--subtitle-size':    c.subtitle_size      ? `${c.subtitle_size}px`   : '1.1rem',
      '--title-color':      c.title_color        ?? '#ffffff',
      '--title-size':       c.title_size         ? `${c.title_size}px`      : '3.5rem',
      '--title-size-mobile':c.title_size_mobile  ? `${c.title_size_mobile}px` : '2rem',
      '--desc-color':       c.desc_color         ?? 'rgba(255,255,255,0.85)',
      '--desc-size':        c.desc_size          ? `${c.desc_size}px`       : '1.1rem',
      '--btn-bg':           c.btn_bg_color       ?? '#c8a96e',
      '--btn-color':        c.btn_text_color     ?? '#ffffff',
      '--btn-border':       c.btn_border_color   ?? 'transparent',
      '--btn-radius':       c.btn_border_radius  !== undefined ? `${c.btn_border_radius}px` : '4px',
      '--arrows-color':     c.arrows_color       ?? '#ffffff',
      '--arrows-bg':        c.arrows_bg          ?? 'rgba(255,255,255,0.1)',
      '--dots-color':       c.dots_color         ?? 'rgba(255,255,255,0.4)',
      '--dots-active':      c.dots_active_color  ?? '#c8a96e',
      '--progress-color':   c.progress_color     ?? '#c8a96e',
    };
  }

  private _overlayStyle() {
    const opacity = (this.config?.overlay_opacity ?? 55) / 100;
    const color   = this.config?.overlay_color ?? '#0b192c';
    return `background: linear-gradient(to top, ${color}dd 0%, ${color}66 50%, ${color}1a 100%); opacity: ${opacity};`;
  }

  private _contentClass() {
    const pos = this.config?.content_position ?? 'end';
    return `slide-content content-${pos}`;
  }

  private _slideClass(idx: number) {
    const total = this._slides.length;
    if (idx === this.current) return 'slide active';
    const prev = (this.current - 1 + total) % total;
    const next = (this.current + 1) % total;
    if (idx === prev) return 'slide prev';
    if (idx === next) return 'slide next';
    return 'slide';
  }

  // ── Main render ────────────────────────────────────────────────────────
  render() {
    const c      = this.config ?? {};
    const slides = this._slides;
    const height = c.height ?? '100vh';

    const showArrows   = c.show_arrows   !== false;
    const showDots     = c.show_dots     !== false;
    const showProgress = c.show_progress !== false;

    if (!slides.length) {
      return html`
        <div style="display:flex;align-items:center;justify-content:center;height:300px;background:#1a2535;color:#fff;font-size:1.1rem;border-radius:8px;">
          لا توجد شرائح — أضف شرائح من الإعدادات
        </div>`;
    }

    return html`
      <div
        class="slider"
        style=${styleMap({ ...this._cssVars(), height })}
        @touchstart=${this._onTouchStart}
        @touchend=${this._onTouchEnd}
        @mouseenter=${() => this._clearTimers()}
        @mouseleave=${() => this._resetAuto()}
      >
        <div class="slides-track" style="height:100%">
          ${slides.map((slide, i) => html`
            <div class=${this._slideClass(i)}>
              <!-- Background -->
              <div class="slide-bg">
                ${slide.image
                  ? html`<img src=${slide.image} alt=${slide.title ?? ''} loading="lazy">`
                  : html`<div style="width:100%;height:100%;background:linear-gradient(135deg,#1a2535,#2d4a6e)"></div>`}
                <div class="overlay" style=${this._overlayStyle()}></div>
              </div>

              <!-- Content -->
              <div class=${this._contentClass()}>
                ${slide.sub_title
                  ? html`<div class="slide-subtitle">${slide.sub_title}</div>`
                  : nothing}

                ${slide.title
                  ? html`<h2 class="slide-title">${slide.title}</h2>`
                  : nothing}

                ${slide.text
                  ? html`<p class="slide-description">${slide.text}</p>`
                  : nothing}

                ${slide.show_btn && slide.name_btn && slide.link_btn
                  ? html`<a href=${slide.link_btn} class="slide-btn">${slide.name_btn}</a>`
                  : nothing}
              </div>
            </div>
          `)}
        </div>

        <!-- Arrows -->
        ${showArrows && slides.length > 1 ? html`
          <div class="arrow arrow-prev" @click=${() => this._go(-1)} role="button" aria-label="Previous">
            <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
          </div>
          <div class="arrow arrow-next" @click=${() => this._go(1)} role="button" aria-label="Next">
            <svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
          </div>
        ` : nothing}

        <!-- Dots -->
        ${showDots && slides.length > 1 ? html`
          <div class="dots">
            ${slides.map((_, i) => html`
              <div
                class="dot ${i === this.current ? 'active' : ''}"
                @click=${() => this._goTo(i)}
                role="button"
                aria-label="Slide ${i + 1}"
              ></div>
            `)}
          </div>
        ` : nothing}

        <!-- Progress bar -->
        ${showProgress ? html`
          <div class="progress" style="width:${this.progressWidth}%"></div>
        ` : nothing}
      </div>
    `;
  }
}
