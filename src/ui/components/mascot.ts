/** Renders one mascot moment (reminder, celebration, regresso após falha).
 * `text` is always app-authored copy (see data/mascot.ts), never user
 * input, so it does not need escaping here. `image` picks the pose for
 * this moment (see MASCOT_IMAGES). Pass `dismissible: true` for a
 * same-day nudge the user can silence ("não me lembres hoje") — wire the
 * click on `[data-mascot-dismiss]` in the caller. */
export function mascotCardHTML(text: string, image: string, opts?: { dismissible?: boolean }): string {
  const src = `${import.meta.env.BASE_URL}${image}`;
  return `
    <div class="mascot-card">
      <img src="${src}" alt="Kaipora" />
      <div>
        <span class="mascot-name">Kaipora</span>
        <span>${text}</span>
        ${opts?.dismissible ? '<button class="mascot-dismiss" type="button" data-mascot-dismiss>Não me lembre hoje</button>' : ''}
      </div>
    </div>`;
}
