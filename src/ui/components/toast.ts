let hideTimer: ReturnType<typeof setTimeout> | undefined;

export function showToast(message: string): void {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.style.display = 'block';
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    if (el) el.style.display = 'none';
  }, 2200);
}
