# Backend — FamiliaSegura

## Stack
- **Runtime:** Node.js 20 + Express
- **ORM:** Drizzle ORM + PostgreSQL (Supabase)
- **Auth:** Supabase Auth (JWT)
- **Payments:** Stripe (test mode → production keys at deploy)
- **Email:** Resend
- **Jobs:** node-cron + BullMQ (Redis)

## Ruta de archivos
```
backend/
├── src/
│   ├── routes/          # API routes
│   │   ├── auth.ts
│   │   ├── circles.ts
│   │   ├── members.ts
│   │   ├── locations.ts
│   │   ├── drives.ts
│   │   ├── sos.ts
│   │   ├── places.ts
│   │   ├── notifications.ts
│   │   └── memberships.ts
│   ├── middleware/
│   │   ├── auth.ts      # Verify Supabase JWT
│   │   ├── rate-limit.ts
│   │   └── validate.ts  # Zod validation
│   ├── services/
│   │   ├── stripe.ts
│   │   ├── email.ts
│   │   ├── push.ts      # Expo Push / FCM
│   │   └── geo.ts       # Geofence calculations
│   ├── jobs/
│   │   ├── drive-summary.ts
│   │   └── cleanup.ts
│   ├── webhooks/
│   │   └── stripe.ts
│   ├── lib/
│   │   ├── db.ts        # Drizzle client
│   │   └── supabase.ts
│   └── index.ts         # Entry point
├── migrations/
│   ├── 001_core.sql
│   └── 002_rls_policies.sql
├── seeds/
│   └── demo-data.ts
├── .env.example
└── package.json
```

---

## Variables de entorno

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_SILVER=price_xxx
STRIPE_PRICE_GOLD=price_xxx
STRIPE_PRICE_PLATINUM=price_xxx

# Resend
RESEND_API_KEY=re_...

# App
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
PORT=3001

# Expo Push (para notificaciones)
EXPO_PUSH_TOKEN=exponent_push_token
```

---

## API Endpoints

### Auth
```
POST   /api/auth/signup              # Create user + verify email
POST   /api/auth/login               # Email/password
POST   /api/auth/google              # OAuth Google
POST   /api/auth/apple               # OAuth Apple
POST   /api/auth/refresh             # Refresh token
POST   /api/auth/forgot-password     # Send reset email
POST   /api/auth/reset-password      # Reset password
POST   /api/auth/logout              # Invalidate session
GET    /api/auth/me                  # Current user profile
PATCH  /api/auth/me                  # Update profile
DELETE /api/auth/account             # Delete account (Apple requirement)
```

### Circles
```
GET    /api/circles                  # List user's circles
POST   /api/circles                  # Create circle
GET    /api/circles/:id              # Circle detail
PATCH  /api/circles/:id              # Update circle (name)
DELETE /api/circles/:id              # Delete circle (admin only)
POST   /api/circles/:id/generate-code # Generate join code (6-digit)
```

### Members
```
GET    /api/circles/:id/members          # List members with locations
POST   /api/circles/:id/members/invite   # Invite by email
POST   /api/members/join                 # Join via code
DELETE /api/circles/:id/members/:userId  # Remove member (admin)
PATCH  /api/circles/:id/members/:userId/role # Change role (admin)
POST   /api/circles/:id/members/me/leave # Leave circle
```

### Locations
```
POST   /api/locations/update       # Update current position (called by app)
GET    /api/circles/:id/locations  # All live locations for circle
```

### Drives
```
POST   /api/drives/start           # Start drive recording
POST   /api/drives/end             # End drive + calculate score
GET    /api/circles/:id/drives     # List drives (summary only)
GET    /api/drives/:id             # Drive detail + events
GET    /api/drives/:id/events      # Drive events list
```

### SOS
```
POST   /api/sos/trigger            # Trigger SOS alert
POST   /api/sos/:id/acknowledge    # Acknowledge SOS
POST   /api/sos/:id/resolve        # Resolve SOS
GET    /api/circles/:id/sos        # SOS history
```

### Notifications
```
GET    /api/notifications              # User notifications
PATCH  /api/notifications/:id/read     # Mark as read
PATCH  /api/notifications/read-all     # Mark all read
DELETE /api/notifications/:id          # Delete notification
GET    /api/notifications/unread-count # Badge count
```

### Memberships
```
GET    /api/memberships/circle/:circleId       # Current membership
POST   /api/memberships/checkout               # Create Stripe checkout
POST   /api/memberships/cancel                 # Cancel subscription
GET    /api/memberships/manage                 # Stripe portal URL
POST   /api/webhooks/stripe                    # Stripe webhook handler
POST   /api/memberships/apply-promo            # Apply promo code
```

---

## Stripe Integration

### Pricing (test mode)
```typescript
// prices en Stripe Dashboard:
// Silver:   $9.99/mes  → price_silver_monthly
// Gold:     $16.99/mes → price_gold_monthly
// Platinum: $24.99/mes → price_platinum_monthly
```

### Webhook handlers (idempotentes)
| Evento Stripe | Acción |
|---------------|--------|
| `checkout.session.completed` | Crear membership, enviar email de bienvenida |
| `customer.subscription.updated` | Actualizar tier en BD |
| `customer.subscription.deleted` | Cambiar a free, notificar |
| `invoice.payment_failed` | Notificar usuario, grace period 7 días |

### Feature gates por tier
| Feature | Free | Silver | Gold | Platinum |
|---------|------|--------|------|----------|
| Lugares | 2 | 5 | ∞ | ∞ |
| Historial ubicación | 1 día | 7 días | 30 días | ∞ |
| Reportes manejo | Básico | Básico | Detallado | Detallado + export |
| Alertas SOS | ✅ | ✅ | ✅ | ✅ |
| Historial SOS | 7 días | 30 días | ∞ | ∞ |

---

## Email Templates (Resend)

| Template | Trigger | Variables |
|----------|---------|-----------|
| `welcome` | Signup | `name`, `circleName` |
| `invite_accepted` | New member joins | `inviterName`, `circleName` |
| `sos_alert` | SOS triggered | `memberName`, `location`, `circleName` |
| `drive_summary` | Weekly digest | `name`, `score`, `drives_count` |
| `membership_upgrade` | Payment success | `tier`, `amount`, `nextBilling` |
| `membership_cancel` | Subscription cancelled | `tier`, `endDate` |
| `payment_failed` | Card declined | `tier`, `daysLeft` |

---

## Jobs

| Job | Schedule | Descripción |
|-----|----------|-------------|
| `driveSummary` | Daily 8:00 UTC | Generar resumen de manejo semanal |
| `locationCleanup` | Every 6h | Eliminar ubicaciones offline > 24h |
| `membershipCheck` | Daily 00:00 UTC | Revisar suscripciones por vencer |
| `notificationsCleanup` | Weekly | Archivar notificaciones > 90 días |

---

## Checklist de seguridad

- [x] Secrets en variables de entorno, `.env*` en `.gitignore`
- [x] Input validado con Zod en cada ruta
- [x] Autorización verificada en cada query (RLS + middleware)
- [x] Rate limiting en auth (5 req/min), signup (3/hora), SMS (1/día)
- [x] Webhooks verifican signature de Stripe
- [x] Uploads: max 5MB, solo JPEG/PNG/WEBP
- [x] No hay datos de usuario en URLs o logs
- [x] `npm audit` limpio
- [ ] Privacy policy lista (ver `/replica-brand`)