export interface ChartPoint {
  date: string;
  value: number;
}

/** Reads the live theme tokens so the chart matches whichever theme (dark/light) is active. */
function themeColor(el: HTMLElement, token: string, fallback: string): string {
  const v = getComputedStyle(el).getPropertyValue(token).trim();
  return v || fallback;
}

export function drawLineChart(canvas: HTMLCanvasElement, points: ChartPoint[], goal?: number): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const gridColor = themeColor(canvas, '--border-strong', 'rgba(168,159,199,.18)');
  const goalColor = themeColor(canvas, '--secondary', '#34d399');
  const primaryColor = themeColor(canvas, '--primary', '#8b5cf6');
  const secondaryColor = themeColor(canvas, '--secondary', '#22d3ee');
  const dotColor = themeColor(canvas, '--primary-glow', '#a78bfa');
  const W = canvas.parentElement?.clientWidth ?? canvas.offsetWidth ?? 300;
  const H = 150;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  const vals = points.map((p) => p.value);
  const mn = Math.min(...vals, goal ?? Infinity) - 1;
  const mx = Math.max(...vals, goal ?? -Infinity) + 1;
  const pad = { t: 10, r: 10, b: 22, l: 38 };
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;

  const xS = (i: number) => pad.l + i * (cw / Math.max(points.length - 1, 1));
  const yS = (v: number) => pad.t + ch - ((v - mn) / (mx - mn || 1)) * ch;

  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i++) {
    const y = pad.t + (ch / 3) * i;
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(pad.l + cw, y);
    ctx.stroke();
  }

  if (goal !== undefined) {
    const gy = yS(goal);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = goalColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad.l, gy);
    ctx.lineTo(pad.l + cw, gy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = goalColor;
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Meta ${goal}`, pad.l + 2, gy - 3);
  }

  const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + ch);
  grad.addColorStop(0, primaryColor);
  grad.addColorStop(1, secondaryColor);

  ctx.strokeStyle = grad;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = xS(i);
    const y = yS(p.value);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  points.forEach((p, i) => {
    ctx.fillStyle = dotColor;
    ctx.beginPath();
    ctx.arc(xS(i), yS(p.value), 3.5, 0, Math.PI * 2);
    ctx.fill();
  });
}
