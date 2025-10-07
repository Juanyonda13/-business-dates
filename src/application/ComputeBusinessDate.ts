import { z } from 'zod';
import type { ApiSuccessResponse, IsoUtcString } from '../shared/types.js';
import type { BusinessCalendarDeps, BusinessClock } from '../domain/contracts.js';
import { addBusinessDays, addBusinessHours } from '../domain/businessCalendar.js';

export const QuerySchema = z.object({
  days: z.string().regex(/^\d+$/).transform(Number).optional(),
  hours: z.string().regex(/^\d+$/).transform(Number).optional(),
  date: z.string().datetime({ offset: true }).optional(),
});

export interface ComputeBusinessDateInput {
  days?: number;
  hours?: number;
  date?: IsoUtcString;
}

export class ComputeBusinessDateUseCase {
  constructor(private readonly deps: BusinessCalendarDeps, private readonly clock: BusinessClock) {}

  parseInputUtcToDate(inputUtcIso: IsoUtcString | undefined): Date {
    if (inputUtcIso && typeof inputUtcIso === 'string') {
      const d = new Date(inputUtcIso);
      if (isNaN(d.getTime()) || !/Z$/.test(inputUtcIso)) {
        throw new Error('Invalid date format: must be ISO 8601 UTC with Z');
      }
      return d;
    }
    return new Date(this.clock.nowUtcIso());
  }

  execute(input: ComputeBusinessDateInput): ApiSuccessResponse {
    let result = this.parseInputUtcToDate(input.date);
    if (input.days && input.days > 0) {
      result = addBusinessDays(result, input.days, this.deps);
    }
    if (input.hours && input.hours > 0) {
      result = addBusinessHours(result, input.hours, this.deps);
    }
    return { date: result.toISOString() };
  }
}


