import type { Tab } from '../nav';
import { getSettings, saveSettings, exportBackup, importBackup } from '../../lib/storage';
import { isCloudConfigured, getSession, signInWithEmail, signOut, fullSync } from '../../lib/sync';
import { requestNotificationPermission } from '../../lib/notifications';
import { applyTheme } from '../../lib/theme';
import type { ThemePreference } from '../../lib/types';
import { refreshActive } from '../nav';
import { showToast } from '../components/toast';

export const settingsTab: Tab = {
  id: 'ajustes',
  label: 'Ajustes',
  icon: '',
  group: 'Sistema',
  render(root: HTMLElement) {
    const settings = getSettings();

    root.innerHTML = `
      <div class="ph">
        <h2>Ajustes</h2>
        <div class="ph-title">Configurações</div>
        <div class="ph-sub">Metas, notificações, conta e backup</div>
      </div>

      <section>
        <div class="sec-title">Aparência</div>
        <div style="padding:12px 16px 4px;font-size:12.5px;color:var(--text-dim)">Dark e Light Mode partilham a mesma identidade — escolhe o que preferires.</div>
        <div class="form-row">
          <button class="btn ${settings.theme === 'system' ? '' : 'ghost'}" data-theme-choice="system">Sistema</button>
          <button class="btn ${settings.theme === 'light' ? '' : 'ghost'}" data-theme-choice="light">Claro</button>
          <button class="btn ${settings.theme === 'dark' ? '' : 'ghost'}" data-theme-choice="dark">Escuro</button>
        </div>
      </section>

      <section>
        <div class="sec-title">Metas</div>
        <div class="meds-grid">
          <div><label>Água diária (ml)</label><input class="finp" id="s-water" type="number" step="50" value="${settings.waterGoalMl}" /></div>
          <div><label>Peso meta (kg)</label><input class="finp" id="s-goalweight" type="number" step="0.5" value="${settings.goalWeightKg}" /></div>
          <div><label>Meta calórica (kcal)</label><input class="finp" id="s-kcal" type="number" step="10" value="${settings.calorieGoal}" /></div>
          <div><label>Meta proteína (g)</label><input class="finp" id="s-protein" type="number" step="5" value="${settings.proteinGoal}" /></div>
          <div><label>Meta carboidratos (g)</label><input class="finp" id="s-carb" type="number" step="5" value="${settings.carbGoal}" /></div>
          <div><label>Meta gordura (g)</label><input class="finp" id="s-fat" type="number" step="5" value="${settings.fatGoal}" /></div>
        </div>
        <div class="form-row" style="padding-top:0">
          <button class="btn block" id="s-save-goals">Guardar metas</button>
        </div>
      </section>

      <section>
        <div class="sec-title">Notificações</div>
        <div class="row" style="cursor:default">
          <div class="rtxt"><strong>Ativar lembretes</strong><small>Água, refeições e treino</small></div>
          <label class="switch"><input type="checkbox" id="s-notif" ${settings.notificationsEnabled ? 'checked' : ''}/><span class="slider"></span></label>
        </div>
        <div class="alert" style="margin:10px 14px">
          <span>No iPhone (Safari/PWA), notificações só funcionam com a app aberta em primeiro plano — o iOS não permite lembretes agendados em segundo plano sem um servidor de push dedicado. No Android/Chrome o comportamento pode ser mais fiável, mas ainda depende da permissão do sistema.</span>
        </div>
      </section>

      <section>
        <div class="sec-title">Conta e sincronização</div>
        <div id="cloud-section"></div>
      </section>

      <section>
        <div class="sec-title">Backup</div>
        <div style="padding:12px 16px 4px;font-size:12.5px;color:var(--text-dim)">Exporta os teus dados regularmente — é a tua rede de segurança, mesmo com sincronização cloud ativa.</div>
        <div class="form-row">
          <button class="btn ghost" id="s-export">Exportar backup (.json)</button>
        </div>
        <div class="form-row" style="padding-top:0">
          <button class="btn ghost" id="s-import-btn">Importar backup</button>
          <input type="file" id="s-import-file" accept="application/json" style="display:none" />
        </div>
      </section>

      <section>
        <div class="sec-title">Recompensas</div>
        <div class="row" style="cursor:default">
          <div class="rtxt"><strong>Ativar sistema de recompensas</strong><small>Define marcos de tempo praticado em Habilidades e resgata-os quando os atingires</small></div>
          <label class="switch"><input type="checkbox" id="s-rewards" ${settings.rewardsEnabled ? 'checked' : ''}/><span class="slider"></span></label>
        </div>
      </section>

      <section>
        <div class="sec-title">Acessibilidade</div>
        <div class="row" style="cursor:default">
          <div class="rtxt"><strong>Reduzir animações</strong><small>Respeita prefers-reduced-motion do sistema por defeito</small></div>
          <label class="switch"><input type="checkbox" id="s-motion" ${settings.reducedMotion ? 'checked' : ''}/><span class="slider"></span></label>
        </div>
      </section>

      <div style="text-align:center;padding:20px;font-size:11px;color:var(--text-faint)">Kaipora · plataforma pessoal de Scarllett</div>
    `;

    renderCloudSection(root);
    wireEvents(root);
  }
};

function renderCloudSection(root: HTMLElement) {
  const el = root.querySelector('#cloud-section') as HTMLElement;
  if (!isCloudConfigured) {
    el.innerHTML = `
      <div style="padding:12px 16px;font-size:12.5px;color:var(--text-dim);line-height:1.6">
        Sincronização cloud ainda não está configurada neste deployment. A app funciona 100% offline com
        localStorage. Para sincronizar entre o iPhone e o PC, define <code>VITE_SUPABASE_URL</code> e
        <code>VITE_SUPABASE_ANON_KEY</code> — instruções completas no README.
      </div>`;
    return;
  }

  getSession().then((session) => {
    if (session) {
      el.innerHTML = `
        <div style="padding:12px 16px;font-size:13px">Sessão iniciada como <strong>${session.user.email}</strong></div>
        <div class="form-row">
          <button class="btn" id="s-sync-now">Sincronizar agora</button>
        </div>
        <div class="form-row" style="padding-top:0">
          <button class="btn ghost" id="s-signout">Terminar sessão</button>
        </div>
        <div id="sync-status" style="padding:0 16px 12px;font-size:12px;color:var(--text-faint)"></div>
      `;
      el.querySelector('#s-sync-now')?.addEventListener('click', async () => {
        const status = el.querySelector('#sync-status') as HTMLElement;
        status.textContent = 'A sincronizar…';
        const result = await fullSync();
        status.textContent = result.ok
          ? `Sincronizado — ${result.pushed} enviado(s), ${result.pulled} recebido(s).`
          : `Falhou: ${result.reason}`;
      });
      el.querySelector('#s-signout')?.addEventListener('click', async () => {
        // main.ts's onAuthChange listener owns the "sessão terminada" toast
        // and the global refresh; this local refresh just avoids a beat of
        // lag on the tab that's already open.
        await signOut();
        refreshActive();
      });
    } else {
      el.innerHTML = `
        <div style="padding:12px 16px;font-size:12.5px;color:var(--text-dim)">
          Sem palavra-passe: recebes um link de acesso por email.
        </div>
        <div class="form-row">
          <input class="finp" id="s-email" type="email" placeholder="teu@email.com" />
          <button class="fsave" id="s-signin">Enviar link</button>
        </div>
        <div id="signin-status" style="padding:0 16px 12px;font-size:12px;color:var(--text-faint)"></div>
      `;
      el.querySelector('#s-signin')?.addEventListener('click', async () => {
        const input = el.querySelector('#s-email') as HTMLInputElement;
        const status = el.querySelector('#signin-status') as HTMLElement;
        if (!input.value) return;
        status.textContent = 'A enviar…';
        const result = await signInWithEmail(input.value);
        status.textContent = result.ok ? 'Link enviado — verifica o teu email.' : `Erro: ${result.error}`;
      });
    }
  });
}

function wireEvents(root: HTMLElement) {
  root.querySelectorAll<HTMLButtonElement>('[data-theme-choice]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.themeChoice as ThemePreference;
      saveSettings({ theme });
      applyTheme(theme);
      refreshActive();
    });
  });

  root.querySelector('#s-save-goals')?.addEventListener('click', () => {
    saveSettings({
      waterGoalMl: Number((root.querySelector('#s-water') as HTMLInputElement).value) || 2000,
      goalWeightKg: Number((root.querySelector('#s-goalweight') as HTMLInputElement).value) || 65,
      calorieGoal: Number((root.querySelector('#s-kcal') as HTMLInputElement).value) || 1615,
      proteinGoal: Number((root.querySelector('#s-protein') as HTMLInputElement).value) || 135,
      carbGoal: Number((root.querySelector('#s-carb') as HTMLInputElement).value) || 140,
      fatGoal: Number((root.querySelector('#s-fat') as HTMLInputElement).value) || 55
    });
    showToast('Metas guardadas');
  });

  root.querySelector('#s-notif')?.addEventListener('change', async (e) => {
    const checked = (e.target as HTMLInputElement).checked;
    if (checked) await requestNotificationPermission();
    saveSettings({ notificationsEnabled: checked });
  });

  root.querySelector('#s-motion')?.addEventListener('change', (e) => {
    saveSettings({ reducedMotion: (e.target as HTMLInputElement).checked });
  });

  root.querySelector('#s-rewards')?.addEventListener('change', (e) => {
    saveSettings({ rewardsEnabled: (e.target as HTMLInputElement).checked });
  });

  root.querySelector('#s-export')?.addEventListener('click', () => {
    const backup = exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kaipora-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup exportado');
  });

  root.querySelector('#s-import-btn')?.addEventListener('click', () => {
    (root.querySelector('#s-import-file') as HTMLInputElement).click();
  });

  root.querySelector('#s-import-file')?.addEventListener('change', async (e) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!confirm('Importar este backup vai substituir os dados existentes com o mesmo tipo (peso, medidas, treinos, etc). Continuar?')) {
      input.value = '';
      return;
    }
    try {
      const text = await file.text();
      importBackup(JSON.parse(text));
      showToast('Backup importado');
      refreshActive();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível importar este ficheiro.');
    }
    input.value = '';
  });
}
