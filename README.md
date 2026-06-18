# ClickUp Agent

Aplicación web construida con Next.js que monitorea actividades recientes en tareas de ClickUp asignadas a un usuario y muestra notificaciones del navegador en tiempo real.

## Funcionalidades

- **Autenticación simple** con contraseña vía `APP_PASSWORD` (cookie HttpOnly por 7 días).
- **Monitoreo periódico** de tareas asignadas: cada 60 segundos consulta la API de ClickUp.
- **Detección de comentarios nuevos** de otros usuarios en tus tareas.
- **Notificaciones push** en el navegador cuando hay novedades.
- **Listado de novedades** (comentarios recientes de otros usuarios) en la página principal con enlace directo a cada tarea.
- **Listado de tareas recientes** asignadas al usuario, incluyendo tareas cerradas, con indicador de estado.
- **Endpoint de debug** protegido para inspeccionar datos crudos de la API.

## Requisitos

- Node.js 18+
- Una cuenta en ClickUp con un token de API personal

## Variables de entorno

| Variable | Descripción |
|---|---|
| `APP_PASSWORD` | Contraseña para iniciar sesión en la app |
| `CLICKUP_TOKEN` | Token personal de la API de ClickUp |
| `USER_ID` | ID del usuario a monitorear |
| `TEAM_ID` | ID del equipo/espacio de trabajo |
| `HOURS_BACK` | (opcional) Ventana de tiempo en horas hacia atrás para comentarios (default: 2) |
| `DAYS_BACK` | (opcional) Ventana de tiempo en días hacia atrás para tareas recientes (default: 30) |
| `DEBUG_SECRET` | (opcional) Clave secreta para acceder a `/api/check-debug` |

## Cómo obtener los IDs

1. **Token**: Ve a *Configuración > ClickUp API > Generar token*.
2. **Team ID**: El ID del equipo aparece en la URL al estar en tu espacio de trabajo.
3. **User ID**: Usa `GET /api/v2/team/{team_id}/user` con tu token.

## Instalación y uso

```bash
# Instalar dependencias
npm install

# Iniciar en desarrollo
npm run dev

# Construir para producción
npm run build
npm start
```

La app corre en `http://localhost:3000`. Al abrirla te pedirá la contraseña configurada en `APP_PASSWORD`.

## Estructura del proyecto

```
clickup-agent/
├── lib/
│   └── clickup.js          # Lógica de negocio: llama a la API de ClickUp y parsea fechas
├── pages/
│   ├── index.js            # Página principal: muestra novedades y notifica
│   ├── login.js            # Página de inicio de sesión
│   └── api/
│       ├── login.js        # Endpoint POST que valida credenciales y setea cookie
│       ├── check.js        # Endpoint GET que devuelve comentarios recientes
│       ├── tasks.js        # Endpoint GET que devuelve tareas recientes (abiertas y cerradas)
│       └── check-debug.js  # Endpoint GET que devuelve datos crudos (protegido por DEBUG_SECRET)
├── middleware.js            # Middleware de Next.js: protege rutas redirigiendo a /login
├── next.config.js
├── vercel.json
└── package.json
```

## Cómo funciona

1. El middleware de Next.js verifica la cookie `auth` en cada ruta (excepto `/login` y `/api/login`).
2. La página principal (`/`) consulta dos endpoints al cargar:
   - **`/api/check`** cada 60s para novedades (comentarios recientes).
   - **`/api/tasks`** una vez al cargar para el listado de tareas recientes.
3. `/api/check` usa `lib/clickup.js:getRecentUpdates()`:
   - Obtiene **todas** las tareas abiertas asignadas al usuario (sin filtro de fecha).
   - Por cada tarea, obtiene sus comentarios y filtra solo aquellos de otros usuarios y creados en las últimas `HOURS_BACK` horas.
   - Devuelve la lista ordenada por fecha descendente.
4. `/api/tasks` usa `lib/clickup.js:getRecentTasks()`:
   - Obtiene tareas asignadas al usuario (abiertas **y cerradas**) creadas en los últimos `DAYS_BACK` días.
   - Devuelve nombre, estado, fechas y si está cerrada.
5. El frontend muestra ambas secciones y dispara notificaciones del navegador para novedades nuevas.

## Despliegue

La app está lista para desplegarse en Vercel. Configura las variables de entorno en el panel de Vercel.

```bash
# Deploy con Vercel CLI
vercel --prod
```
