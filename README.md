# Business Dates API - Colombia

API REST profesional desarrollada en TypeScript para el cálculo preciso de fechas hábiles en Colombia, considerando días festivos nacionales, horarios laborales y zona horaria local. Implementa arquitectura limpia siguiendo principios SOLID para máxima mantenibilidad y escalabilidad.

## 🚀 Características

- **Cálculo preciso** de días y horas hábiles en Colombia
- **Integración con API oficial** de días festivos colombianos
- **Manejo robusto de zonas horarias** (America/Bogota → UTC)
- **Arquitectura limpia** con separación de capas (Domain, Application, Infrastructure)
- **Tipado explícito** en TypeScript para máxima seguridad
- **Validación de esquemas** con Zod
- **Fallback automático** para días festivos en caso de indisponibilidad de API externa

## 📋 Requisitos del Sistema

- **Node.js:** 20.x o superior
- **npm:** 8.x o superior
- **TypeScript:** 5.x

## 🛠️ Instalación y Configuración

### 1. Clonar el Repositorio
```bash
git clone https://github.com/Juanyonda13/business-dates.git
cd business-dates
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:
```env
PORT=3000
NODE_ENV=production
```

### 4. Compilar el Proyecto
```bash
npm run build
```

### 5. Ejecutar en Producción
```bash
npm start
```

### 6. Desarrollo Local
```bash
npm run dev
```

## 📚 Librerías y Tecnologías

### Dependencias de Producción
- **fastify** (^5.6.1): Framework web rápido y eficiente para Node.js
- **zod** (^4.1.12): Validación de esquemas TypeScript-first
- **undici** (^7.16.0): Cliente HTTP moderno para Node.js
- **@types/node** (^24.7.0): Definiciones de tipos para Node.js

### Dependencias de Desarrollo
- **typescript** (^5.9.3): Compilador TypeScript
- **tsx** (^4.20.6): Ejecutor TypeScript para desarrollo
- **eslint** (^9.37.0): Linter para mantener calidad de código
- **@typescript-eslint/***: Reglas ESLint específicas para TypeScript

## 🏗️ Arquitectura del Proyecto

```
src/
├── domain/                    # Lógica de negocio pura
│   ├── contracts.ts          # Interfaces y contratos del dominio
│   └── businessCalendar.ts   # Servicio de calendario empresarial
├── application/              # Casos de uso y lógica de aplicación
│   └── ComputeBusinessDate.ts # Caso de uso principal
├── infrastructure/           # Adaptadores y detalles de implementación
│   ├── http/                # Adaptador HTTP (Fastify)
│   │   └── server.ts
│   └── holidays/            # Proveedor de días festivos
│       ├── RemoteHolidayProvider.ts
│       └── fallbackData.ts
├── shared/                   # Tipos y utilidades compartidas
│   └── types.ts
└── index.ts                  # Punto de entrada de la aplicación
```

### Principios SOLID Aplicados

- **Single Responsibility**: Cada clase tiene una única responsabilidad
- **Open/Closed**: Extensible sin modificar código existente
- **Liskov Substitution**: Implementaciones intercambiables de contratos
- **Interface Segregation**: Interfaces específicas y cohesivas
- **Dependency Inversion**: Dependencias hacia abstracciones, no implementaciones

## 🌐 API Endpoints

### GET `/`

Calcula fechas hábiles sumando días y/o horas a partir de una fecha base.

#### Parámetros de Query

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `days` | integer | No | Número de días hábiles a sumar (entero positivo) |
| `hours` | integer | No | Número de horas hábiles a sumar (entero positivo) |
| `date` | string | No | Fecha/hora inicial en formato ISO 8601 UTC con sufijo Z |

#### Reglas de Negocio

- **Días hábiles**: Lunes a viernes (excluye fines de semana y días festivos)
- **Horario laboral**: 8:00 AM - 12:00 PM y 1:00 PM - 5:00 PM (hora Colombia)
- **Zona horaria**: Todos los cálculos en America/Bogota, respuesta en UTC
- **Aproximación**: Si la fecha cae fuera del horario laboral, se aproxima hacia atrás al horario más cercano
- **Orden de suma**: Primero días, luego horas

#### Ejemplos de Uso

```bash
# Sumar 1 día hábil desde fecha específica
GET /?days=1&date=2025-05-06T13:00:00.000Z

# Sumar 8 horas hábiles desde fecha específica
GET /?hours=8&date=2025-05-05T13:00:00.000Z

# Combinación de días y horas
GET /?days=5&hours=4&date=2025-04-10T15:00:00.000Z
```

#### Respuestas

**Éxito (200 OK):**
```json
{
  "date": "2025-05-07T13:00:00.000Z"
}
```

**Error de Parámetros (400 Bad Request):**
```json
{
  "error": "InvalidParameters",
  "message": "Debe enviar days y/o hours"
}
```

**Error de Servicio (503 Service Unavailable):**
```json
{
  "error": "UpstreamUnavailable", 
  "message": "No se pudo cargar el calendario de feriados"
}
```

## 🚀 Despliegue

### Render.com

1. **Configuración del Servicio:**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Node Version: 20.x o 22.x
   - Root Directory: (vacío)

2. **Variables de Entorno:**
   ```
   NODE_ENV=production
   PORT=3000
   ```

### Otras Plataformas

El proyecto es compatible con:
- **Vercel** (con adaptaciones menores)
- **Railway**
- **Heroku**
- **AWS Lambda** (con AWS CDK como bonus)

## 🧪 Casos de Prueba Validados

| Escenario | Input | Output Esperado |
|-----------|-------|-----------------|
| Viernes 5PM + 1 hora | `hours=1` desde viernes 17:00 COL | Lunes 9:00 AM COL |
| Sábado + 1 hora | `hours=1` desde sábado 14:00 COL | Lunes 9:00 AM COL |
| Martes 3PM + 1 día + 4 horas | `days=1&hours=4` desde martes 15:00 COL | Jueves 10:00 AM COL |
| Domingo + 1 día | `days=1` desde domingo 18:00 COL | Lunes 17:00 COL |
| Con festivos (17-18 abril) | `days=5&hours=4` desde 10 abril | 21 abril 15:00 COL |

## 🔧 Scripts Disponibles

```bash
npm run build    # Compilar TypeScript a JavaScript
npm run dev      # Ejecutar en modo desarrollo con hot reload
npm start        # Ejecutar versión compilada en producción
npm run lint     # Ejecutar linter ESLint
```

## 📄 Licencia

Este proyecto es parte de una prueba técnica y está desarrollado siguiendo las mejores prácticas de la industria para aplicaciones empresariales.

---

**Desarrollado con ❤️ en TypeScript siguiendo principios SOLID y arquitectura limpia.**


