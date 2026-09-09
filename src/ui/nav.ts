import { navIcons, menuIcon, closeIcon } from './components/icons';
import { t } from '../i18n';

export interface Tab {
  id: string;
  /** i18n key resolved to display text at render time (see renderGroups) —
   * not already-translated text, so the sidebar can re-resolve it after a
   * language change without a reload. */
  label: string;
  icon: string;
  /** Sidebar section this tab belongs to. Ungrouped tabs are not rendered in the sidebar. */
  group?: string;
  render: (root: HTMLElement) => void;
}

/** Sidebar group display order — anything not listed falls back to insertion order at the end.
 * These are internal identifiers (also used as each tab's `group` field), not display text —
 * see GROUP_LABEL_KEYS below for the localized label shown in the sidebar. */
const GROUP_ORDER = ['Início', 'Corpo', 'Desenvolvimento', 'Desafios', 'Acompanhamento', 'Sistema'];

/** Maps each internal group identifier to its i18n key for display. */
const GROUP_LABEL_KEYS: Record<string, string> = {
  Início: 'nav.group.inicio',
  Corpo: 'nav.group.corpo',
  Desenvolvimento: 'nav.group.desenvolvimento',
  Desafios: 'nav.group.desafios',
  Acompanhamento: 'nav.group.acompanhamento',
  Sistema: 'nav.group.sistema'
};

let tabs: Tab[] = [];
let activeId = '';
let rootEl: HTMLElement;
let sidebarEl: HTMLElement;
let backdropEl: HTMLElement;
let menuToggleEl: HTMLButtonElement;

export function initNav(container: HTMLElement, allTabs: Tab[], startTab: string): void {
  tabs = allTabs;
  activeId = startTab;

  const shell = document.createElement('div');
  shell.className = 'app-shell';

  menuToggleEl = document.createElement('button');
  menuToggleEl.className = 'menu-toggle';
  menuToggleEl.setAttribute('aria-label', t('nav.openMenu'));
  menuToggleEl.innerHTML = menuIcon();
  menuToggleEl.addEventListener('click', () => setSidebarOpen(true));

  sidebarEl = document.createElement('aside');
  sidebarEl.className = 'sidebar';
  sidebarEl.innerHTML = `
    <div class="sidebar-head">
      <div class="brand-bar">
        <img class="brand-mark" src="${import.meta.env.BASE_URL}icons/icon-192.png?v=2" alt="Kaipora" />
        <div class="brand-name">Kaipora</div>
      </div>
      <button class="sidebar-close" aria-label="${t('nav.closeMenu')}">${closeIcon()}</button>
    </div>
    <nav class="side-nav">${renderGroups(tabs, activeId)}</nav>
  `;

  backdropEl = document.createElement('div');
  backdropEl.className = 'sidebar-backdrop';
  backdropEl.addEventListener('click', () => setSidebarOpen(false));

  sidebarEl.querySelector('.sidebar-close')?.addEventListener('click', () => setSidebarOpen(false));
  wireSideNav();

  rootEl = document.createElement('div');
  rootEl.id = 'tab-root';

  shell.appendChild(menuToggleEl);
  shell.appendChild(sidebarEl);
  shell.appendChild(backdropEl);
  shell.appendChild(rootEl);
  container.appendChild(shell);

  renderActive();
}

function renderGroups(allTabs: Tab[], activeTabId: string): string {
  const grouped = new Map<string, Tab[]>();
  for (const tab of allTabs) {
    if (!tab.group) continue;
    if (!grouped.has(tab.group)) grouped.set(tab.group, []);
    grouped.get(tab.group)!.push(tab);
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
        .map((tab) => {
          const icon = navIcons[tab.id]?.() ?? '';
          return `<button data-tab="${tab.id}" class="nav-link ${tab.id === activeTabId ? 'active' : ''}">
            <span class="nav-ic">${icon}</span>${t(tab.label)}
          </button>`;
        })
        .join('');
      const label = t(GROUP_LABEL_KEYS[group] ?? group);
      return `<div class="nav-group"><div class="nav-group-label">${label}</div>${items}</div>`;
    })
    .join('');
}

/** (Re-)binds click handling on the sidebar's tab buttons. Called after
 * every sidebar HTML rebuild (initial mount and every re-render, so a
 * language change re-resolves the labels without needing a reload). */
function wireSideNav(): void {
  sidebarEl.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab as string);
      setSidebarOpen(false);
    });
  });
}

function setSidebarOpen(open: boolean): void {
  sidebarEl.classList.toggle('open', open);
  backdropEl.classList.toggle('open', open);
}

export function switchTab(id: string): void {
  activeId = id;
  renderActive();
  window.scrollTo({ top: 0, behavior: 'auto' });
}

export function refreshActive(): void {
  renderActive();
}

function renderActive(): void {
  const tab = tabs.find((t) => t.id === activeId);
  if (!tab) return;
  // Rebuilt on every render (not just on mount) so a language change is
  // reflected in the sidebar's group/tab labels immediately, the same way
  // the tab content itself re-renders — see setLocale() in src/i18n.
  sidebarEl.querySelector('.side-nav')!.innerHTML = renderGroups(tabs, activeId);
  wireSideNav();
  sidebarEl.querySelector('.sidebar-close')?.setAttribute('aria-label', t('nav.closeMenu'));
  menuToggleEl.setAttribute('aria-label', t('nav.openMenu'));
  rootEl.innerHTML = '';
  tab.render(rootEl);
}
