import type { IsoUtcString } from '../shared/types.js';

export interface HolidayProvider {
  loadHolidaySet: () => Promise<Set<string>>; // YYYY-MM-DD
}

export interface BusinessClock {
  nowUtcIso: () => IsoUtcString;
}

export interface ColombiaBusinessRulesConfig {
  timezone: string; // 'America/Bogota'
  workdayStartHour: number; // 8
  lunchStartHour: number; // 12
  lunchEndHour: number; // 13
  workdayEndHour: number; // 17
}

export interface BusinessCalendarDeps {
  rules: ColombiaBusinessRulesConfig;
  holidaySet: Set<string>;
}


