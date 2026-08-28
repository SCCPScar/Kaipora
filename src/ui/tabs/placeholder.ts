import type { Tab } from '../nav';

/**
 * Real, navigable tabs for sections whose content ships in a later phase
 * (see the Kaipora roadmap) — shown honestly as "em breve" rather than
 * pretending the feature exists or hiding the nav entry entirely.
 */
export function placeholderTab(id: string, label: string, group: string, blurb: string): Tab {
  return {
    id,
    label,
    icon: '',
    group,
    render(root: HTMLElement) {
      root.innerHTML = `
        <div class="ph">
          <h2>${group}</h2>
          <div class="ph-title">${label}</div>
        </div>
        <div class="empty" style="padding:40px 24px">${blurb}<br/><br/>Em breve.</div>
      `;
    }
  };
}
