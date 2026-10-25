# Pricing — Nido

## Reference pricing (as of 2026-10)

| App | Free tier | Silver/Gold equivalent | Platinum equivalent | URL |
|-----|-----------|----------------------|---------------------|-----|
| Life360 | 2 lugares, 1 día historia | $9.99/mo (Silver) | $16.99/mo (Gold) | life360.com/plans-pricing |
| FamilyID | 1 lugar | $4.99/mo | $9.99/mo | familyid.com/pricing |
| Gabb Watch | No free | $30/mo (device + service) | — | gabbwireless.com |

## What reviewers complain about (from recon)
- "Demasiado caro por lo que ofrece" — múltiples reviews en App Store
- "El trial se renueva solo y es difícil cancelar" — Hubitat community, Reddit
- "Cobra por cada lugar adicional" — Facebook groups
- "Anuncios constantes en la versión gratis" — Play Store reviews

## Our model
- **Free:** 2 lugares, 1 día historia, SOS, detección de choques. Sin tarjeta.
- **Plus ($4.99/mo):** 5 lugares, 7 días historia, reportes detallados. Cancelación 1-click.
- **Familiar ($9.99/mo):** Ilimitado, 30 días, export CSV, asistencia en carretera.

## Billing improvements over original
- [x] Cancelación desde la app, sin llamar
- [x] Email de recordatorio 3 días antes de renovar
- [x] Sin cargos ocultos por lugar adicional (plan plano)
- [x] Trail de 14 días gratis en Plus/Familiar

## Stripe products to create (test mode first)
```
nido_plus_monthly    $4.99    subscription
nido_familiar_monthly $9.99   subscription
```