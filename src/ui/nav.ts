import { navIcons, menuIcon, closeIcon } from './components/icons';

export interface Tab {
  id: string;
  label: string;
  icon: string;
  /** Sidebar section this tab belongs to. Ungrouped tabs are not rendered in the sidebar. */
  group?: string;
  render: (root: HTMLElement) => void;
}

/** Sidebar group display order — anything not listed falls back to insertion order at the end. */
const GROUP_ORDER = ['Início', 'Corpo', 'Desenvolvimento', 'Desafios', 'Acompanhamento', 'Sistema'];

let tabs: Tab[] = [];
let activeId = '';
let rootEl: HTMLElement;
let sidebarEl: HTMLElement;
let backdropEl: HTMLElement;

export function initNav(container: HTMLElement, allTabs: Tab[], startTab: string): void {
  tabs = allTabs;
  activeId = startTab;

  const shell = document.createElement('div');
  shell.className = 'app-shell';

  const menuToggle = document.createElement('button');
  menuToggle.className = 'menu-toggle';
  menuToggle.setAttribute('aria-label', 'Abrir menu');
  menuToggle.innerHTML = menuIcon();
  menuToggle.addEventListener('click', () => setSidebarOpen(true));

  sidebarEl = document.createElement('aside');
  sidebarEl.className = 'sidebar';
  sidebarEl.innerHTML = `
    <div class="sidebar-head">
      <div class="brand-bar">
        <div class="brand-mark">K</div>
        <div class="brand-name">Kaipora</div>
      </div>
      <button class="sidebar-close" aria-label="Fechar menu">${closeIcon()}</button>
    </div>
    <nav class="side-nav">${renderGroups(tabs, activeId)}</nav>
  `;

  backdropEl = document.createElement('div');
  backdropEl.className = 'sidebar-backdrop';
  backdropEl.addEventListener('click', () => setSidebarOpen(false));

  sidebarEl.querySelector('.sidebar-close')?.addEventListener('click', () => setSidebarOpen(false));
  sidebarEl.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab as string);
      setSidebarOpen(false);
    });
  });

  rootEl = document.createElement('div');
  rootEl.id = 'tab-root';

  shell.appendChild(menuToggle);
  shell.appendChild(sidebarEl);
  shell.appendChild(backdropEl);
  shell.appendChild(rootEl);
  container.appendChild(shell);

  renderActive();
}

function renderGroups(allTabs: Tab[], activeTabId: string): string {
  const grouped = new Map<string, Tab[]>();
  for (const t of allTabs) {
    if (!t.group) continue;
    if (!grouped.has(t.group)) grouped.set(t.group, []);
    grouped.get(t.group)!.push(t);
  }
  const groupNames = [...grouped.keys()].sort((a, b) => {
    const ai = GROUP_ORDER.indexOf(a);
    const bi = GROUP_ORDER.indexOf(b);
    return (ai === -1 ? GROUP_ORDER.length : ai) - (bi === -1 ? GROUP_ORDER.length : bi);
  });

  return groupNames
    .map((group) => {
      const items = grouped
        .get(group)!
        .map((t) => {
          const icon = navIcons[t.id]?.() ?? '';
          return `<button data-tab="${t.id}" class="nav-link ${t.id === activeTabId ? 'active' : ''}">
            <span class="nav-ic">${icon}</span>${t.label}
          </button>`;
        })
        .join('');
      return `<div class="nav-group"><div class="nav-group-label">${group}</div>${items}</div>`;
    })
    .join('');
}

function setSidebarOpen(open: boolean): void {
  sidebarEl.classList.toggle('open', open);
  backdropEl.classList.toggle('open', open);
}

export function switchTab(id: string): void {
  activeId = id;
  sidebarEl.querySelectorAll('button[data-tab]').forEach((b) => {
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
