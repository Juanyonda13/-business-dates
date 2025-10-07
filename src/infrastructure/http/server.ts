import Fastify from 'fastify';
import { z } from 'zod';
import type { ApiErrorResponse } from '../../shared/types.js';
import { DEFAULT_RULES } from '../../domain/businessCalendar.js';
import type { BusinessCalendarDeps } from '../../domain/contracts.js';
import { ComputeBusinessDateUseCase, QuerySchema } from '../../application/ComputeBusinessDate.js';
import type { ComputeBusinessDateInput } from '../../application/ComputeBusinessDate.js';
import { RemoteHolidayProvider } from '../holidays/RemoteHolidayProvider.js';

export async function buildServer() {
  const app = Fastify({ logger: false });

  let holidaySet: Set<string> | null = null;
  try {
    holidaySet = await RemoteHolidayProvider.loadHolidaySet();
  } catch {
    holidaySet = null;
  }

  app.get('/', async (req, reply) => {
    let q: z.infer<typeof QuerySchema>;
    try {
      q = QuerySchema.parse(req.query);
    } catch {
      const res: ApiErrorResponse = { error: 'InvalidParameters', message: 'Parámetros inválidos' };
      return reply.code(400).type('application/json').send(res);
    }

    if ((q.days ?? 0) <= 0 && (q.hours ?? 0) <= 0) {
      const res: ApiErrorResponse = { error: 'InvalidParameters', message: 'Debe enviar days y/o hours' };
      return reply.code(400).type('application/json').send(res);
    }

    if (!holidaySet) {
      const res: ApiErrorResponse = { error: 'UpstreamUnavailable', message: 'No se pudo cargar el calendario de feriados' };
      return reply.code(503).type('application/json').send(res);
    }

    const deps: BusinessCalendarDeps = { rules: DEFAULT_RULES, holidaySet };
    const clock = { nowUtcIso: () => new Date().toISOString() };
    const useCase = new ComputeBusinessDateUseCase(deps, clock);

    try {
      const input: ComputeBusinessDateInput = {
        ...(q.days !== undefined ? { days: q.days } : {}),
        ...(q.hours !== undefined ? { hours: q.hours } : {}),
        ...(q.date !== undefined ? { date: q.date } : {}),
      };
      const payload = useCase.execute(input);
      return reply.code(200).type('application/json').send(payload);
    } catch {
      const res: ApiErrorResponse = { error: 'InternalError', message: 'Error interno' };
      return reply.code(500).type('application/json').send(res);
    }
  });

  return app;
}


