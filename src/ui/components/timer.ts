import { openModal } from './modal';
import { MASCOT_IMAGES } from '../../data/mascot';
import { t } from '../../i18n';

const PRESETS = [30, 45, 60, 90, 120];

type AudioContextCtor = typeof AudioContext;

/**
 * iOS Safari only allows an AudioContext to start producing sound if it was
 * created (or resumed) directly inside a user-gesture call stack (a tap
 * handler) — one created later inside a setInterval callback, when the timer
 * expires, is silently ignored there. So this is created once, right when
 * the user taps "Iniciar" (a real gesture), and reused/resumed for the beep
 * at expiry instead of being created fresh at that point.
 */
function unlockAudioContext(): AudioContext | undefined {
  try {
    const Ctx = (window.AudioContext ||
      (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext) as AudioContextCtor | undefined;
    if (!Ctx) return undefined;
    const ctx = new Ctx();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return undefined;
  }
}

function beep(ctx: AudioContext | undefined): void {
  try {
    if (ctx) {
      if (ctx.state === 'suspended') void ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    }
  } catch {
    /* audio unavailable — vibration below still fires where supported */
  }
  // navigator.vibrate is not implemented by iOS Safari at all (any iOS
  // version, standalone or not) — this is a no-op there, Android-only in
  // practice, which is why the Web Audio beep above is the primary signal.
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
}

export function openTimerModal(initialSeconds = 60): void {
  let total = initialSeconds;
  let remaining = total;
  let interval: ReturnType<typeof setInterval> | undefined;
  let running = false;
  let audioCtx: AudioContext | undefined;

  const close = openModal(
    `
    <button class="modal-close" data-close aria-label="${t('common.close')}"></button>
    <h3>${t('timer.restTitle')}</h3>
    <div class="timer-display" id="tmr-display">${fmt(remaining)}</div>
    <div class="timer-presets" id="tmr-presets">
      ${PRESETS.map((p) => `<button class="timer-preset${p === total ? ' active' : ''}" data-preset="${p}">${p}s</button>`).join('')}
    </div>
    <div class="timer-btns">
      <button class="btn ghost" id="tmr-reset">${t('timer.reset')}</button>
      <button class="btn" id="tmr-toggle">${t('timer.start')}</button>
    </div>
  `,
    (modal) => {
      const display = modal.querySelector('#tmr-display') as HTMLElement;
      const toggleBtn = modal.querySelector('#tmr-toggle') as HTMLButtonElement;
      const resetBtn = modal.querySelector('#tmr-reset') as HTMLButtonElement;
      const presetsEl = modal.querySelector('#tmr-presets') as HTMLElement;

      function tick() {
        remaining--;
        display.textContent = fmt(remaining);
        if (remaining <= 0) {
          stop();
          beep(audioCtx);
          display.textContent = fmt(0);
        }
      }
      function start() {
        if (!audioCtx) audioCtx = unlockAudioContext(); // must happen inside this click handler, not later
        running = true;
        toggleBtn.textContent = t('timer.pause');
        interval = setInterval(tick, 1000);
      }
      function stop() {
        running = false;
        toggleBtn.textContent = t('timer.start');
        if (interval) clearInterval(interval);
      }

      toggleBtn.addEventListener('click', () => (running ? stop() : start()));
      resetBtn.addEventListener('click', () => {
        stop();
        remaining = total;
        display.textContent = fmt(remaining);
      });
      presetsEl.addEventListener('click', (e) => {
        const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-preset]');
        if (!btn) return;
        stop();
        total = Number(btn.dataset.preset);
        remaining = total;
        display.textContent = fmt(remaining);
        presetsEl.querySelectorAll('.timer-preset').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
      modal.querySelector('[data-close]')?.addEventListener('click', () => {
        stop();
        void audioCtx?.close();
        close();
      });
    }
  );
}

/** labelKey resolved at render/tick time (not baked in), so a language
 * change mid-exercise still shows the right phase name — see src/i18n. */
const BREATH_PHASES = [
  { labelKey: 'timer.breathe.inhale', seconds: 4 },
  { labelKey: 'timer.breathe.hold', seconds: 4 },
  { labelKey: 'timer.breathe.exhale', seconds: 4 }
];

/**
 * A 4-4-4 breathing exercise, for a hard moment rather than a rest between
 * sets — reuses openTimerModal's own building blocks (modal, audio unlock
 * inside the tap gesture, beep/vibrate on transition) instead of a second
 * timer implementation, cycling through phases indefinitely until closed.
 */
export function openBreathingModal(): void {
  let phaseIndex = 0;
  let remaining = BREATH_PHASES[0].seconds;
  let interval: ReturnType<typeof setInterval> | undefined;
  let running = false;
  let audioCtx: AudioContext | undefined;

  const mascotSrc = `${import.meta.env.BASE_URL}${MASCOT_IMAGES.breathe}`;
  const close = openModal(
    `
    <button class="modal-close" data-close aria-label="${t('common.close')}"></button>
    <h3>${t('timer.breatheTitle')}</h3>
    <img src="${mascotSrc}" alt="${t('mascot.name')}" width="152" style="display:block;height:auto;margin:0 auto 14px;filter:drop-shadow(0 4px 8px rgba(0,0,0,.25))" />
    <div class="timer-display" id="breath-phase" style="font-size:20px">${t(BREATH_PHASES[0].labelKey)}</div>
    <div class="timer-display" id="breath-display">${fmt(remaining)}</div>
    <div class="timer-btns">
      <button class="btn" id="breath-toggle">${t('timer.start')}</button>
    </div>
    <p style="text-align:center;color:var(--text-dim);font-size:12.5px;margin-top:10px">${t('timer.breatheInstructions')}</p>
  `,
    (modal) => {
      const phaseEl = modal.querySelector('#breath-phase') as HTMLElement;
      const display = modal.querySelector('#breath-display') as HTMLElement;
      const toggleBtn = modal.querySelector('#breath-toggle') as HTMLButtonElement;

      function tick() {
        remaining--;
        if (remaining <= 0) {
          phaseIndex = (phaseIndex + 1) % BREATH_PHASES.length;
          remaining = BREATH_PHASES[phaseIndex].seconds;
          phaseEl.textContent = t(BREATH_PHASES[phaseIndex].labelKey);
          beep(audioCtx);
        }
        display.textContent = fmt(remaining);
      }
      function start() {
        if (!audioCtx) audioCtx = unlockAudioContext(); // must happen inside this click handler, not later
        running = true;
        toggleBtn.textContent = t('timer.pause');
        interval = setInterval(tick, 1000);
      }
      function stop() {
        running = false;
        toggleBtn.textContent = t('timer.start');
        if (interval) clearInterval(interval);
      }

      toggleBtn.addEventListener('click', () => (running ? stop() : start()));
      modal.querySelector('[data-close]')?.addEventListener('click', () => {
        stop();
        void audioCtx?.close();
        close();
      });
    }
  );
}

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}
