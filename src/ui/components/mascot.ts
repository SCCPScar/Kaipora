import { MASCOT_IMAGE } from '../../data/mascot';

/** Renders one mascot moment (reminder, celebration, regresso após falha).
 * `text` is always app-authored copy (see data/mascot.ts), never user
 * input, so it does not need escaping here. */
export function mascotCardHTML(text: string): string {
  const src = `${import.meta.env.BASE_URL}${MASCOT_IMAGE}`;
  return `
    <div class="mascot-card">
      <img src="${src}" alt="Kaipora" width="46" height="46" />
      <span>${text}</span>
    </div>`;
}
