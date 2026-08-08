export interface Tab {
  id: string;
  label: string;
  icon: string;
  render: (root: HTMLElement) => void;
}

let tabs: Tab[] = [];
let activeId = '';
let rootEl: HTMLElement;
let navEl: HTMLElement;

export function initNav(container: HTMLElement, allTabs: Tab[], startTab: string): void {
  tabs = allTabs;
  activeId = startTab;

  const brand = document.createElement('div');
  brand.className = 'brand-bar';
  brand.innerHTML = `<div class="brand-mark">V</div><div class="brand-name">Pro<b>ject</b></div>`;
  container.appendChild(brand);

  rootEl = document.createElement('div');
  rootEl.id = 'tab-root';
  container.appendChild(rootEl);

  navEl = document.createElement('nav');
  navEl.innerHTML = tabs
    .map((t) => `<button data-tab="${t.id}" class="${t.id === activeId ? 'active' : ''}"><span class="ic">${t.icon}</span>${t.label}</button>`)
    .join('');
  container.appendChild(navEl);

  navEl.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-tab]');
    if (!btn?.dataset.tab) return;
    switchTab(btn.dataset.tab);
  });

  renderActive();
}

export function switchTab(id: string): void {
  activeId = id;
  navEl.querySelectorAll('button[data-tab]').forEach((b) => {
    b.classList.toggle('active', (b as HTMLElement).dataset.tab === id);
  });
  renderActive();
  window.scrollTo({ top: 0, behavior: 'auto' });
}

export function refreshActive(): void {
  renderActive();
}

function renderActive(): void {
  const tab = tabs.find((t) => t.id === activeId);
  if (!tab) return;
  rootEl.innerHTML = '';
  tab.render(rootEl);
}
