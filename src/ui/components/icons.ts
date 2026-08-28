/**
 * Minimal inline SVG icon set — thin single-weight stroke, no emoji, no
 * external dependencies. Used wherever the UI previously relied on an emoji
 * as an icon (info/timer/edit buttons, nav icons, etc).
 */
function svg(paths: string, viewBox = '0 0 24 24'): string {
  return `<svg viewBox="${viewBox}" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

export const infoIcon = (): string => svg('<circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16.5"/><circle cx="12" cy="7.5" r="0.9" fill="currentColor" stroke="none"/>');

export const timerIcon = (): string => svg('<circle cx="12" cy="13" r="8"/><line x1="12" y1="13" x2="12" y2="8.5"/><line x1="9" y1="2.5" x2="15" y2="2.5"/><line x1="12" y1="2.5" x2="12" y2="5.5"/>');

export const editIcon = (): string => svg('<path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/><line x1="13.5" y1="6.5" x2="17.5" y2="10.5"/>');

/** Navigation icon set — abstract, geometric, one stroke weight. Placeholders until a definitive mark exists. */
export const navIcons: Record<string, () => string> = {
  hoje: () => svg('<circle cx="12" cy="12" r="4.2"/><line x1="12" y1="2.5" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="21.5"/><line x1="2.5" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="21.5" y2="12"/><line x1="5" y1="5" x2="6.6" y2="6.6"/><line x1="17.4" y1="17.4" x2="19" y2="19"/><line x1="19" y1="5" x2="17.4" y2="6.6"/><line x1="6.6" y1="17.4" x2="5" y2="19"/>'),
  rotina: () => svg('<rect x="3.5" y="4" width="17" height="16.5" rx="2.5"/><line x1="3.5" y1="9" x2="20.5" y2="9"/><line x1="7.5" y1="13" x2="12.5" y2="13"/><line x1="7.5" y1="16.5" x2="15.5" y2="16.5"/>'),
  treino: () => svg('<line x1="2.5" y1="12" x2="21.5" y2="12"/><rect x="2" y="9" width="3.2" height="6" rx="1"/><rect x="18.8" y="9" width="3.2" height="6" rx="1"/><rect x="6.5" y="7.5" width="2.4" height="9" rx="1"/><rect x="15.1" y="7.5" width="2.4" height="9" rx="1"/>'),
  dieta: () => svg('<path d="M4 11.5a8 8 0 0 0 16 0Z"/><path d="M4 11.5h16"/><path d="M6.5 15.5c0 2.8 2.5 5 5.5 5s5.5-2.2 5.5-5"/><line x1="12" y1="3" x2="12" y2="7"/>'),
  progresso: () => svg('<line x1="3" y1="21" x2="21" y2="21"/><rect x="5.5" y="13" width="3" height="8"/><rect x="10.5" y="8" width="3" height="13"/><rect x="15.5" y="4" width="3" height="17"/>'),
  habilidades: () => svg('<path d="M4 5.5c2.4-1.4 5.2-1.4 8 0v13c-2.8-1.4-5.6-1.4-8 0Z"/><path d="M20 5.5c-2.4-1.4-5.2-1.4-8 0v13c2.8-1.4 5.6-1.4 8 0Z"/>'),
  diario: () => svg('<path d="M4 19.5V17l11-11 2.5 2.5-11 11Z"/><line x1="13.2" y1="7.8" x2="16.2" y2="10.8"/><line x1="4" y1="19.5" x2="19.5" y2="19.5"/>'),
  desafios: () => svg('<line x1="6" y1="3" x2="6" y2="21"/><path d="M6 4.5 L18 8 L6 11.5 Z"/>'),
  calendario: () => svg('<rect x="3.5" y="5" width="17" height="15.5" rx="2.2"/><line x1="3.5" y1="9.5" x2="20.5" y2="9.5"/><line x1="8" y1="3" x2="8" y2="6.5"/><line x1="16" y1="3" x2="16" y2="6.5"/><circle cx="8" cy="13.5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="13.5" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="13.5" r="1" fill="currentColor" stroke="none"/>'),
  conquistas: () => svg('<path d="M12 3.5l2.2 4.6 5 .7-3.6 3.6.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.6 5-.7Z"/>'),
  ajustes: () => svg('<line x1="3.5" y1="6" x2="20.5" y2="6"/><circle cx="9" cy="6" r="2.1" fill="var(--bg-elevated)"/><line x1="3.5" y1="12" x2="20.5" y2="12"/><circle cx="15" cy="12" r="2.1" fill="var(--bg-elevated)"/><line x1="3.5" y1="18" x2="20.5" y2="18"/><circle cx="11" cy="18" r="2.1" fill="var(--bg-elevated)"/>')
};

export const menuIcon = (): string => svg('<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>');
export const closeIcon = (): string => svg('<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>');
