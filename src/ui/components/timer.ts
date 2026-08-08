import { openModal } from './modal';

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
    <button class="modal-close" data-close>✕</button>
    <h3>⏱ Temporizador de descanso</h3>
    <div class="timer-display" id="tmr-display">${fmt(remaining)}</div>
    <div class="timer-presets" id="tmr-presets">
      ${PRESETS.map((p) => `<button class="timer-preset${p === total ? ' active' : ''}" data-preset="${p}">${p}s</button>`).join('')}
    </div>
    <div class="timer-btns">
      <button class="btn ghost" id="tmr-reset">Reiniciar</button>
      <button class="btn" id="tmr-toggle">Iniciar</button>
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
        toggleBtn.textContent = 'Pausar';
        interval = setInterval(tick, 1000);
      }
      function stop() {
        running = false;
        toggleBtn.textContent = 'Iniciar';
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

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}
