import type { Tab } from '../nav';
import { getJournalEntries, addJournalEntry, deleteJournalEntry } from '../../lib/storage';
import { todayISO } from '../../lib/dates';
import { refreshActive } from '../nav';
import { showToast } from '../components/toast';
import { escapeHtml } from '../../lib/sanitize';
import { t } from '../../i18n';

export const diarioTab: Tab = {
  id: 'diario',
  label: 'nav.tab.diario',
  icon: '',
  group: 'Desenvolvimento',
  render(root: HTMLElement) {
    root.innerHTML = `
      <div class="ph">
        <h2>${t('diario.title')}</h2>
        <div class="ph-title">${t('diario.subtitle')}</div>
        <div class="ph-sub">${t('diario.description')}</div>
      </div>

      <section>
        <div class="form-row">
          <textarea class="finp" id="journal-text" rows="4" placeholder="${t('diario.placeholder')}" style="flex:1;resize:vertical;font-family:inherit"></textarea>
        </div>
        <div class="form-row" style="padding-top:0">
          <button class="btn block" id="journal-save">${t('diario.save')}</button>
        </div>
      </section>

      <section>
        <div class="sec-title">${t('diario.previousEntries')}</div>
        <div id="journal-list"></div>
      </section>
    `;

    renderJournal(root);
    wireEvents(root);
  }
};

function renderJournal(root: HTMLElement) {
  const el = root.querySelector('#journal-list') as HTMLElement;
  const entries = getJournalEntries();
  el.innerHTML = entries.length
    ? entries
        .map(
          (entry, i) => `
      <div class="log-item" style="align-items:flex-start">
        <div class="log-txt"><div class="log-date">${entry.date}</div><strong style="font-weight:400;white-space:pre-wrap">${escapeHtml(entry.text)}</strong></div>
        <button class="log-del" data-del-journal="${i}" aria-label="${t('common.remove')}">✕</button>
      </div>`
        )
        .join('')
    : `<div class="empty">${t('diario.empty')}</div>`;
}

function wireEvents(root: HTMLElement) {
  root.querySelector('#journal-save')?.addEventListener('click', () => {
    const textarea = root.querySelector('#journal-text') as HTMLTextAreaElement;
    const text = textarea.value.trim();
    if (!text) {
      showToast(t('diario.toastEmpty'));
      return;
    }
    addJournalEntry(text, todayISO());
    showToast(t('diario.toastSaved'));
    refreshActive();
  });

  root.querySelector('#journal-list')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-del-journal]');
    if (!btn) return;
    if (!confirm(t('diario.confirmRemove'))) return;
    deleteJournalEntry(Number(btn.dataset.delJournal));
    refreshActive();
  });
}
