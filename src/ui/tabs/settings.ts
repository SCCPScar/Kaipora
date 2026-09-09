import type { Tab } from '../nav';
import { getSettings, saveSettings, exportBackup, importBackup, getLastBackupAt, recordBackupExported } from '../../lib/storage';
import { isCloudConfigured, getSession, signInWithEmail, signOut, fullSync } from '../../lib/sync';
import { requestNotificationPermission } from '../../lib/notifications';
import { applyTheme } from '../../lib/theme';
import type { ThemePreference, Locale } from '../../lib/types';
import { refreshActive } from '../nav';
import { showToast } from '../components/toast';
import { escapeHtml } from '../../lib/sanitize';
import { t, getLocale, setLocale, SUPPORTED_LOCALES } from '../../i18n';

const BACKUP_REMINDER_DAYS = 30;

function backupReminderHTML(): string {
  const lastBackupAt = getLastBackupAt();
  const daysSince = lastBackupAt ? Math.floor((Date.now() - new Date(lastBackupAt).getTime()) / 86_400_000) : null;
  if (daysSince !== null && daysSince < BACKUP_REMINDER_DAYS) return '';
  const message = lastBackupAt
    ? t('settings.backup.reminderWithDate', { days: daysSince as number })
    : t('settings.backup.reminderNever');
  return `<div class="alert" style="margin:10px 14px 0">
    <span>${message}</span>
  </div>`;
}

export const settingsTab: Tab = {
  id: 'ajustes',
  label: 'nav.tab.ajustes',
  icon: '',
  group: 'Sistema',
  render(root: HTMLElement) {
    const settings = getSettings();
    const currentLocale = getLocale();

    root.innerHTML = `
      <div class="ph">
        <h2>${t('nav.tab.ajustes')}</h2>
        <div class="ph-title">${t('settings.headerTitle')}</div>
        <div class="ph-sub">${t('settings.headerSub')}</div>
      </div>

      <section>
        <div class="sec-title">${t('settings.language.title')}</div>
        <div class="form-row" style="flex-wrap:wrap">
          ${SUPPORTED_LOCALES.map(
            (l) => `<button class="btn ${l.code === currentLocale ? '' : 'ghost'}" data-locale-choice="${l.code}">${escapeHtml(l.label)}</button>`
          ).join('')}
        </div>
      </section>

      <section>
        <div class="sec-title">${t('settings.profile.title')}</div>
        <div class="form-row">
          <input class="finp" id="s-name" type="text" placeholder="${t('settings.profile.namePlaceholder')}" value="${escapeHtml(settings.userName)}" style="flex:1" />
        </div>
        <div class="form-row" style="padding-top:0">
          <button class="btn block" id="s-save-name">${t('settings.profile.saveName')}</button>
        </div>
      </section>

      <section>
        <div class="sec-title">${t('settings.appearance.title')}</div>
        <div style="padding:12px 16px 4px;font-size:12.5px;color:var(--text-dim)">${t('settings.appearance.desc')}</div>
        <div class="form-row">
          <button class="btn ${settings.theme === 'system' ? '' : 'ghost'}" data-theme-choice="system">${t('settings.appearance.system')}</button>
          <button class="btn ${settings.theme === 'light' ? '' : 'ghost'}" data-theme-choice="light">${t('settings.appearance.light')}</button>
          <button class="btn ${settings.theme === 'dark' ? '' : 'ghost'}" data-theme-choice="dark">${t('settings.appearance.dark')}</button>
        </div>
      </section>

      <section>
        <div class="sec-title">${t('settings.goals.title')}</div>
        <div class="meds-grid">
          <div><label>${t('settings.goals.water')}</label><input class="finp" id="s-water" type="number" step="50" value="${settings.waterGoalMl}" /></div>
          <div><label>${t('settings.goals.goalWeight')}</label><input class="finp" id="s-goalweight" type="number" step="0.5" value="${settings.goalWeightKg}" /></div>
          <div><label>${t('settings.goals.calorie')}</label><input class="finp" id="s-kcal" type="number" step="10" value="${settings.calorieGoal}" /></div>
          <div><label>${t('settings.goals.protein')}</label><input class="finp" id="s-protein" type="number" step="5" value="${settings.proteinGoal}" /></div>
          <div><label>${t('settings.goals.carb')}</label><input class="finp" id="s-carb" type="number" step="5" value="${settings.carbGoal}" /></div>
          <div><label>${t('settings.goals.fat')}</label><input class="finp" id="s-fat" type="number" step="5" value="${settings.fatGoal}" /></div>
        </div>
        <div class="form-row" style="padding-top:0">
          <button class="btn block" id="s-save-goals">${t('settings.goals.save')}</button>
        </div>
      </section>

      <section>
        <div class="sec-title">${t('settings.notifications.title')}</div>
        <div class="row" style="cursor:default">
          <div class="rtxt"><strong>${t('settings.notifications.enable')}</strong><small>${t('settings.notifications.enableDesc')}</small></div>
          <label class="switch"><input type="checkbox" id="s-notif" ${settings.notificationsEnabled ? 'checked' : ''}/><span class="slider"></span></label>
        </div>
        <div class="alert" style="margin:10px 14px">
          <span>${t('settings.notifications.iosAlert')}</span>
        </div>
      </section>

      <section>
        <div class="sec-title">${t('settings.account.title')}</div>
        <div id="cloud-section"></div>
      </section>

      <section>
        <div class="sec-title">${t('settings.backup.title')}</div>
        <div style="padding:12px 16px 4px;font-size:12.5px;color:var(--text-dim)">${t('settings.backup.desc')}</div>
        ${backupReminderHTML()}
        <div class="form-row">
          <button class="btn ghost" id="s-export">${t('settings.backup.export')}</button>
        </div>
        <div class="form-row" style="padding-top:0">
          <button class="btn ghost" id="s-import-btn">${t('settings.backup.import')}</button>
          <input type="file" id="s-import-file" accept="application/json" style="display:none" />
        </div>
      </section>

      <section>
        <div class="sec-title">${t('settings.rewards.title')}</div>
        <div class="row" style="cursor:default">
          <div class="rtxt"><strong>${t('settings.rewards.enable')}</strong><small>${t('settings.rewards.enableDesc')}</small></div>
          <label class="switch"><input type="checkbox" id="s-rewards" ${settings.rewardsEnabled ? 'checked' : ''}/><span class="slider"></span></label>
        </div>
      </section>

      <section>
        <div class="sec-title">${t('settings.defaultPlan.title')}</div>
        <div class="row" style="cursor:default">
          <div class="rtxt"><strong>${t('settings.defaultPlan.enable')}</strong><small>${t('settings.defaultPlan.enableDesc')}</small></div>
          <label class="switch"><input type="checkbox" id="s-default-plan" ${settings.useDefaultPlan ? 'checked' : ''}/><span class="slider"></span></label>
        </div>
      </section>

      <section>
        <div class="sec-title">${t('settings.accessibility.title')}</div>
        <div class="row" style="cursor:default">
          <div class="rtxt"><strong>${t('settings.accessibility.reduceMotion')}</strong><small>${t('settings.accessibility.reduceMotionDesc')}</small></div>
          <label class="switch"><input type="checkbox" id="s-motion" ${settings.reducedMotion ? 'checked' : ''}/><span class="slider"></span></label>
        </div>
      </section>

      <div style="text-align:center;padding:20px;font-size:11px;color:var(--text-faint)">
        ${t('settings.footer.tagline')}<br />
        <a href="privacidade.html" style="color:var(--text-faint);text-decoration:underline">${t('settings.footer.privacy')}</a>
        &nbsp;·&nbsp;
        <a href="termos.html" style="color:var(--text-faint);text-decoration:underline">${t('settings.footer.terms')}</a>
      </div>
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
        ${t('settings.account.notConfigured')}
      </div>`;
    return;
  }

  getSession().then((session) => {
    if (session) {
      el.innerHTML = `
        <div style="padding:12px 16px;font-size:13px">${t('settings.account.signedInAs', { email: `<strong>${escapeHtml(session.user.email ?? '')}</strong>` })}</div>
        <div class="form-row">
          <button class="btn" id="s-sync-now">${t('settings.account.syncNow')}</button>
        </div>
        <div class="form-row" style="padding-top:0">
          <button class="btn ghost" id="s-signout">${t('settings.account.signOut')}</button>
        </div>
        <div id="sync-status" style="padding:0 16px 12px;font-size:12px;color:var(--text-faint)"></div>
      `;
      el.querySelector('#s-sync-now')?.addEventListener('click', async () => {
        const status = el.querySelector('#sync-status') as HTMLElement;
        status.textContent = t('settings.account.syncing');
        const result = await fullSync();
        status.textContent = result.ok
          ? t('settings.account.syncResult', { pushed: result.pushed, pulled: result.pulled })
          : t('settings.account.syncFailed', { reason: result.reason });
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
          ${t('settings.account.noPassword')}
        </div>
        <div class="form-row">
          <input class="finp" id="s-email" type="email" placeholder="${t('settings.account.emailPlaceholder')}" />
          <button class="fsave" id="s-signin">${t('settings.account.sendLink')}</button>
        </div>
        <div id="signin-status" style="padding:0 16px 12px;font-size:12px;color:var(--text-faint)"></div>
      `;
      el.querySelector('#s-signin')?.addEventListener('click', async () => {
        const input = el.querySelector('#s-email') as HTMLInputElement;
        const status = el.querySelector('#signin-status') as HTMLElement;
        if (!input.value) return;
        status.textContent = t('settings.account.sending');
        const result = await signInWithEmail(input.value);
        status.textContent = result.ok ? t('settings.account.linkSent') : t('settings.account.error', { error: result.error ?? '' });
      });
    }
  });
}

function wireEvents(root: HTMLElement) {
  root.querySelectorAll<HTMLButtonElement>('[data-locale-choice]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setLocale(btn.dataset.localeChoice as Locale);
      refreshActive();
    });
  });

  root.querySelectorAll<HTMLButtonElement>('[data-theme-choice]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.themeChoice as ThemePreference;
      saveSettings({ theme });
      applyTheme(theme);
      refreshActive();
    });
  });

  root.querySelector('#s-save-name')?.addEventListener('click', () => {
    saveSettings({ userName: (root.querySelector('#s-name') as HTMLInputElement).value.trim() });
    showToast(t('settings.profile.toastSaved'));
    refreshActive();
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
    showToast(t('settings.goals.toastSaved'));
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

  root.querySelector('#s-default-plan')?.addEventListener('change', (e) => {
    saveSettings({ useDefaultPlan: (e.target as HTMLInputElement).checked });
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
    recordBackupExported();
    showToast(t('settings.backup.toastExported'));
    refreshActive();
  });

  root.querySelector('#s-import-btn')?.addEventListener('click', () => {
    (root.querySelector('#s-import-file') as HTMLInputElement).click();
  });

  root.querySelector('#s-import-file')?.addEventListener('change', async (e) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!confirm(t('settings.backup.confirmImport'))) {
      input.value = '';
      return;
    }
    try {
      const text = await file.text();
      importBackup(JSON.parse(text));
      showToast(t('settings.backup.toastImported'));
      refreshActive();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('settings.backup.importError'));
    }
    input.value = '';
  });
}
