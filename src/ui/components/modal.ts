export function openModal(innerHTML: string, onMount?: (modal: HTMLElement) => void): () => void {
  const previouslyFocused = document.activeElement as HTMLElement | null;

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `<div class="modal" role="dialog" aria-modal="true" tabindex="-1">${innerHTML}</div>`;

  const close = () => {
    backdrop.remove();
    document.removeEventListener('keydown', onKeydown);
    previouslyFocused?.focus?.();
  };

  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
  };

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });
  document.addEventListener('keydown', onKeydown);

  document.body.appendChild(backdrop);
  const modal = backdrop.querySelector('.modal') as HTMLElement;
  modal.focus();
  onMount?.(modal);
  return close;
}
