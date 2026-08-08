export interface ChartPoint {
  date: string;
  value: number;
}

export function drawLineChart(canvas: HTMLCanvasElement, points: ChartPoint[], goal?: number): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
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

  ctx.strokeStyle = 'rgba(168,159,199,.18)';
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
    ctx.strokeStyle = 'rgba(52,211,153,.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad.l, gy);
    ctx.lineTo(pad.l + cw, gy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(52,211,153,.9)';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Meta ${goal}`, pad.l + 2, gy - 3);
  }

  const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + ch);
  grad.addColorStop(0, 'rgba(139,92,246,.85)');
  grad.addColorStop(1, 'rgba(34,211,238,.85)');

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
    ctx.fillStyle = '#a78bfa';
    ctx.beginPath();
    ctx.arc(xS(i), yS(p.value), 3.5, 0, Math.PI * 2);
    ctx.fill();
  });
}
