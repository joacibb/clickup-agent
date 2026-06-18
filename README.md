# ClickUp Agent

Aplicación web construida con Next.js que monitorea actividades recientes en tareas de ClickUp asignadas a un usuario y muestra notificaciones del navegador en tiempo real.

## Funcionalidades

- **Autenticación simple** con contraseña vía `APP_PASSWORD` (cookie HttpOnly por 7 días).
- **Monitoreo periódico** de tareas asignadas: cada 60 segundos consulta la API de ClickUp.
- **Detección de comentarios nuevos** de otros usuarios en tus tareas.
- **Notificaciones push** en el navegador cuando hay novedades.
- **Listado de novedades** en la página principal con enlace directo a cada tarea.
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
| `HOURS_BACK` | (opcional) Ventana de tiempo en horas hacia atrás (default: 2) |
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
│       ├── check.js        # Endpoint GET que devuelve las novedades recientes
│       └── check-debug.js  # Endpoint GET que devuelve datos crudos (protegido por DEBUG_SECRET)
├── middleware.js            # Middleware de Next.js: protege rutas redirigiendo a /login
├── next.config.js
├── vercel.json
└── package.json
```

## Cómo funciona

1. El middleware de Next.js verifica la cookie `auth` en cada ruta (excepto `/login` y `/api/login`).
2. La página principal (`/`) se conecta cada 60s al endpoint `/api/check`.
3. `/api/check` usa `lib/clickup.js` para:
   - Consultar tareas asignadas al usuario actualizadas en las últimas `HOURS_BACK` horas.
   - Por cada tarea, obtiene sus comentarios y filtra solo aquellos de otros usuarios y posteriores a la ventana de tiempo.
   - Devuelve la lista ordenada por fecha descendente.
4. El frontend muestra la lista y dispara notificaciones del navegador para ítems nuevos.

## Despliegue

La app está lista para desplegarse en Vercel. Configura las variables de entorno en el panel de Vercel.

```bash
# Deploy con Vercel CLI
vercel --prod
```
