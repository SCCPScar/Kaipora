import type { Tab } from '../nav';
import { getJournalEntries, addJournalEntry, deleteJournalEntry } from '../../lib/storage';
import { todayISO } from '../../lib/dates';
import { refreshActive } from '../nav';
import { showToast } from '../components/toast';

export const diarioTab: Tab = {
  id: 'diario',
  label: 'Diário',
  icon: '',
  group: 'Desenvolvimento',
  render(root: HTMLElement) {
    root.innerHTML = `
      <div class="ph">
        <h2>Diário</h2>
        <div class="ph-title">Um espaço livre</div>
        <div class="ph-sub">Escreve sobre o teu dia, sem formulário rígido, sem categorias</div>
      </div>

      <section>
        <div class="form-row">
          <textarea class="finp" id="journal-text" rows="4" placeholder="Hoje..." style="flex:1;resize:vertical;font-family:inherit"></textarea>
        </div>
        <div class="form-row" style="padding-top:0">
          <button class="btn block" id="journal-save">Guardar entrada</button>
        </div>
      </section>

      <section>
        <div class="sec-title">Entradas anteriores</div>
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
        <div class="log-txt"><div class="log-date">${entry.date}</div><strong style="font-weight:400;white-space:pre-wrap">${entry.text}</strong></div>
        <button class="log-del" data-del-journal="${i}">✕</button>
      </div>`
        )
        .join('')
    : '<div class="empty">Ainda sem entradas</div>';
}

function wireEvents(root: HTMLElement) {
  root.querySelector('#journal-save')?.addEventListener('click', () => {
    const textarea = root.querySelector('#journal-text') as HTMLTextAreaElement;
    const text = textarea.value.trim();
    if (!text) {
      showToast('Escreve algo antes de guardar');
      return;
    }
    addJournalEntry(text, todayISO());
    showToast('Entrada guardada');
    refreshActive();
  });

  root.querySelector('#journal-list')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-del-journal]');
    if (!btn) return;
    if (!confirm('Remover esta entrada?')) return;
    deleteJournalEntry(Number(btn.dataset.delJournal));
    refreshActive();
  });
}
