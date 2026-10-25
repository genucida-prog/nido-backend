# Nido — App de seguridad familiar 100% gratis

## 🚀 Lanzamiento

### Estado actual
- **Backend**: Express + TypeScript, corriendo en `http://localhost:3001`
- **Frontend**: Expo (React Native), listo para `npx expo start --android`
- **Base de datos**: Supabase (PostgreSQL + Auth + Realtime)
- **Pruebas**: 78/78 pasando ✅

### Estructura del proyecto
```
replica/
├── backend/
│   ├── src/
│   │   ├── routes/          ← APIs: auth, circles, members, locations, places, drives, sos, notifications, memberships
│   │   ├── middleware/      ← auth, rate-limit
│   │   ├── services/        ← geo, push, email
│   │   └── lib/             ← db, config
│   ├── .env.local           ← Supabase URL + keys
│   └── package.json
├── app/
│   ├── _layout.tsx          ← Root layout + rutas
│   ├── login.tsx            ← Login con backend API
│   ├── signup.tsx           ← Registro con backend API
│   ├── onboarding.tsx       ← Intro
│   ├── create-circle.tsx    ← Crear círculo vía API
│   ├── join-circle.tsx      ← Unirse con código 6 dígitos
│   ├── sos-confirm.tsx      ← SOS con ubicación real
│   ├── notifications.tsx    ← Centro de notificaciones
│   ├── settings.tsx         ← Configuración
│   ├── help.tsx             ← Centro de ayuda
│   ├── profile-edit.tsx     ← Editar perfil
│   ├── place-edit.tsx       ← Crear/editar lugar
│   ├── member-detail.tsx    ← Detalle de miembro
│   ├── drive-detail.tsx     ← Detalle de manejo
│   └── (tabs)/
│       ├── _layout.tsx      ← Bottom nav (4 tabs)
│       ├── index.tsx        ← Mapa con ubicación en tiempo real
│       ├── drives.tsx       ← Reportes de manejo
│       ├── places.tsx       ← Lugares con alertas
│       └── membership.tsx   ← Info de membresía (todo gratis)
├── src/
│   ├── lib/supabase.ts      ← Cliente Supabase
│   └── store/app.ts         ← Zustand store global
├── supabase/migrations/
│   ├── 001_core.sql
│   ├── 002_rls_policies.sql
│   ├── 003_join_code.sql
│   ├── 004_member_location_unique.sql
│   └── 005_places_unique.sql
├── package.json
└── README.md
```

## Cómo ejecutar

### 1. Backend (local)
```bash
cd replica/backend
npm install
npm run dev
```
El servidor corre en `http://localhost:3001`

### 2. Frontend (Expo)
```bash
cd replica
npm install
npx expo start --android
```

### Variables de entorno

**Backend** (`backend/.env.local`):
```
SUPABASE_URL=https://jmzzbuojfumhoynkwysa.supabase.co
SUPABASE_ANON_KEY=<tu-clave-anon>
SUPABASE_SERVICE_ROLE_KEY=<tu-clave-service-role>
PORT=3001
CORS_ORIGIN=http://localhost:3001
```

**Frontend** (ya configurado en `.env`):
```
EXPO_PUBLIC_SUPABASE_URL=https://jmzzbuojfumhoynkwysa.supabase.co
```

## APIs del backend

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/auth/signup` | POST | Crear cuenta |
| `/api/auth/login` | POST | Iniciar sesión |
| `/api/user/me` | GET/PATCH | Perfil del usuario |
| `/api/circles` | GET/POST | Listar/ crear círculos |
| `/api/members/join` | POST | Unirse con código de 6 dígitos |
| `/api/members/:id/generate-code` | POST | Generar código (solo admin) |
| `/api/locations/update` | POST | Actualizar ubicación |
| `/api/locations/:circleId` | GET | Ubicaciones del círculo |
| `/api/places/circle/:circleId` | GET/POST | Listar/ crear lugar |
| `/api/places/:id` | GET/PATCH/DELETE | Detalle/actualizar/borrar lugar |
| `/api/places/:id/alerts` | POST | Configurar alertas |
| `/api/drives/start` | POST | Iniciar registro de manejo |
| `/api/drives/end` | POST | Terminar manejo + calcular score |
| `/api/drives/circle/:circleId` | GET | Lista de manejos |
| `/api/drives/:driveId/events` | GET/POST | Eventos del manejo |
| `/api/sos/trigger` | POST | Disparar alerta SOS |
| `/api/sos/:id/acknowledge` | POST | Reconocer SOS |
| `/api/sos/:id/resolve` | POST | Resolver SOS |
| `/api/sos/circle/:circleId` | GET | Historial de SOS |
| `/api/notifications` | GET | Mis notificaciones |
| `/api/notifications/unread-count` | GET | Conteo no leídas |
| `/api/notifications/:id/read` | PATCH | Marcar como leída |
| `/api/notifications/read-all` | PATCH | Marcar todas leídas |
| `/api/memberships` | GET | Mis membresías |
| `/api/memberships/:circleId` | GET | Membresía de un círculo |

## Pruebas pasadas

| API | Tests | Estado |
|-----|-------|--------|
| Auth | 4/4 | ✅ |
| Circles | 6/6 | ✅ |
| Members | 10/10 | ✅ |
| Locations | 11/11 | ✅ |
| Places | 15/15 | ✅ |
| SOS | 7/7 | ✅ |
| Drives | 12/12 | ✅ |
| Notifications | 7/7 | ✅ |
| Memberships | 6/6 | ✅ |

**Total: 78/78 pruebas pasando** ✅

## Migraciones aplicadas

- [x] `001_core.sql` — 11 tablas principales
- [x] `002_rls_policies.sql` — Políticas RLS
- [x] `003_join_code.sql` — Código de unión en círculos
- [x] `004_member_location_unique.sql` — Índice único en ubicaciones
- [x] `005_places_unique.sql` — Constraint única (circle_id, name)

## Diseño

Colores (WCAG AA compliant):
- **Accent:** #0F766E (teal)
- **Text:** #0f1420
- **Surface:** #f4f6f9
- **SOS:** #b91c1c (rojo)
- **Success:** #16a34a (verde)

## Limitaciones conocidas

1. El backend corre en `localhost:3001` — para producción usar Railway/Fly.io
2. Las notificaciones push necesitan configurar Expo account
3. Los emails necesitan configurar Resend API key
4. El mapa usa `react-native-maps` — requiere configuración adicional para iOS/Android