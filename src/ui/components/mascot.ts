import { MASCOT_IMAGE } from '../../data/mascot';

/** Renders one mascot moment (reminder, celebration, regresso após falha).
 * `text` is always app-authored copy (see data/mascot.ts), never user
 * input, so it does not need escaping here. Pass `dismissible: true` for a
 * same-day nudge the user can silence ("não me lembres hoje") — wire the
 * click on `[data-mascot-dismiss]` in the caller. */
export function mascotCardHTML(text: string, opts?: { dismissible?: boolean }): string {
  const src = `${import.meta.env.BASE_URL}${MASCOT_IMAGE}`;
  return `
    <div class="mascot-card">
      <img src="${src}" alt="Kaipora" width="46" height="46" />
      <div>
        <span>${text}</span>
        ${opts?.dismissible ? '<button class="mascot-dismiss" type="button" data-mascot-dismiss>Não me lembres hoje</button>' : ''}
      </div>
    </div>`;
}
