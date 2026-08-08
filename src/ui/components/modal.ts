export function openModal(innerHTML: string, onMount?: (modal: HTMLElement) => void): () => void {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `<div class="modal">${innerHTML}</div>`;

  const close = () => backdrop.remove();
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  document.body.appendChild(backdrop);
  const modal = backdrop.querySelector('.modal') as HTMLElement;
  onMount?.(modal);
  return close;
}
