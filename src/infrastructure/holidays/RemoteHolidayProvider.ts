import { fetch } from 'undici';
import type { HolidayProvider } from '../../domain/contracts.js';
import { FALLBACK_HOLIDAYS_CO } from './fallbackData.js';

const HOLIDAYS_URL: string = 'https://content.capta.co/Recruitment/WorkingDays.json';

export const RemoteHolidayProvider: HolidayProvider = {
  async loadHolidaySet(): Promise<Set<string>> {
    const res = await fetch(HOLIDAYS_URL, { method: 'GET' });
    if (!res.ok) {
      // fallback si no disponible
      return new Set<string>(Array.from(FALLBACK_HOLIDAYS_CO));
    }
    const data = (await res.json()) as unknown;
    const set = new Set<string>();
    if (data && typeof data === 'object' && 'Colombia' in (data as Record<string, unknown>) && typeof (data as Record<string, unknown>)['Colombia'] === 'object') {
      const byCountry = (data as Record<string, unknown>)['Colombia'] as Record<string, unknown>;
      for (const [ymd, val] of Object.entries(byCountry)) {
        if (typeof val === 'boolean') { if (!val) set.add(ymd); }
        else if (typeof val === 'string') { const v = val.toLowerCase(); if (v.includes('holiday') || v.includes('non') || v.includes('no-labor')) set.add(ymd); }
      }
      return set;
    }
    if (data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>)['Colombia'])) {
      const list = (data as Record<string, unknown>)['Colombia'] as unknown[];
      for (const item of list) if (typeof item === 'string') set.add(item);
      return set;
    }
    // fallback a lista embebida si formato inesperado
    return new Set<string>(Array.from(FALLBACK_HOLIDAYS_CO));
  },
};


