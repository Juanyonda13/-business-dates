# Business Dates API (Colombia)

API REST en TypeScript para calcular fechas hábiles en Colombia, considerando días festivos, jornada laboral (8:00-12:00 y 13:00-17:00) y zona horaria America/Bogota. La respuesta siempre es en UTC.

## Requisitos
- Node.js 18+

## Instalación
```bash
npm install
```

## Desarrollo
```bash
npm run dev
```

## Build y ejecución
```bash
npm run build
npm start
```

## Endpoint
- Método: GET
- Ruta: `/`
- Query params:
  - `days`: entero positivo opcional
  - `hours`: entero positivo opcional
  - `date`: ISO8601 UTC con sufijo `Z` opcional

Orden de suma: primero `days`, luego `hours`. Si no se envía ninguno, responde 400.

### Respuestas
Éxito:
```json
{"date":"2025-08-01T14:00:00.000Z"}
```

Error:
```json
{"error":"InvalidParameters","message":"Detalle"}
```


