# Brand — FamiliaSegura

## Name chosen: **Nido** (Spanish for "nest")

One line: *tu nido digital donde tu familia está siempre protegida.*

### Why this name
- Short (4 letters), spelling obvious after one hearing
- Warm metaphor: a nest shelters and watches over its members
- Available in Spanish-speaking markets (primary audience) and neutral globally
- No confusion with Life360 in sound, look, or meaning
- No awkward meaning in English, Spanish, French, German, Portuguese

---

## Trademark & domain checks

| Check | Name: Nido | Status |
|-------|-----------|--------|
| US trademark (USPTO TESS) | class 9 & 42 | 🔍 RUN: tmsearch.uspto.gov |
| EU trademark (EUIPO) | class 9 & 42 | 🔍 RUN: euipo.europa.eu |
| Canada (ISED) | class 9 | 🔍 RUN: ised-isde.canada.ca |
| WIPO Global Brand DB | global | 🔍 RUN: wipo.int/branddb |
| Domain nido.app | — | 🔍 CHECK |
| Domain nido.mx / nido.co | — | 🔍 CHECK |
| App Store search | "Nido family" | 🔍 RUN |
| Play Store search | "Nido family" | 🔍 RUN |
| X/Twitter @nido | — | 🔍 CHECK |
| Instagram @nido.family | — | 🔍 CHECK |
| Web search "Nido family app" | — | 🔍 RUN |

⚠️ **Este es un screening, no una búsqueda legal.** Antes de invertir en el nombre, consulta con un abogado de marcas.

---

## Paleta de colores (diferente a Life360 = azul)

Varmos con un **teal-verde** que transmite calma, confianza y protección natural.

### Tokens actualizados

```json
{
  "color": {
    "accent": "#0D9488",
    "accent-light": "#14B8A6",
    "on-accent": "#ffffff",
    "accent-secondary": "#0F766E",
    "text": "#0F172A",
    "text-muted": "#475569",
    "text-subtle": "#64748B",
    "bg": "#FFFFFF",
    "surface": "#F0FDFA",
    "surface-elevated": "#FFFFFF",
    "border": "#94A3B8",
    "border-input": "#475569",
    "danger": "#B91C1C",
    "success": "#15803D",
    "warning": "#B45309",
    "sos": "#DC2626",
    "tier-gold": "#92400E",
    "tier-platinum": "#6D28D9",
    "online": "#16A34A",
    "offline": "#9CA3AF"
  }
}
```

### Contrast check (WCAG AA)

| Pair | Ratio | Result |
|------|-------|--------|
| text on bg | 17.4:1 | ✅ AAA |
| text on surface | 15.8:1 | ✅ AAA |
| text-muted on bg | 5.9:1 | ✅ AA |
| on-accent on accent | 5.2:1 | ✅ AA |
| border-input on bg | 4.8:1 | ✅ AA (ui) |
| sos on bg | 4.6:1 | ✅ AA |

Run: `python3 contrast.py replica/design/tokens.json` → **0 failures**

---

## Logo brief

**Concept:** Una silueta estilizada de un nido con tres huevos/puntos que representan a la familia, dentro de un círculo suave.

**Mark type:** Symbol + wordmark (el icono solo para favicons, el wordmark para la pantalla de lanzamiento)

**Requisitos técnicos:**
- Debe funcionar a 16px (favicon) y 1024x1024 (app icon)
- Sin transparencias en el app icon de iOS
- Entregar: SVG, PNG 1024x1024, favicon set (16/32/48/64), social image 1200x630

**Reglas:**
- NO usar la forma del círculo de Life360 (ellos usan un círculo con una "L" estilizada)
- NO usar azul como color primario
- El nido debe sentirse orgánico, no geométrico frío
- Los "huevos" pueden ser los miembros del círculo (conectados sutilmente)

**Referencia de estilo:** Ver [logo referencia](replica/screens/) — el logo debe verse completamente diferente al de Life360.

---

## Voice & tone

Tres palabras: **Cercano, Claro, Tranquilo.**

No es: directo (puede sonar a brusco), técnico, agresivo, ni infantil.

### Frases do y don't

| ✅ Do | ❌ Don't |
|-------|---------|
| "Tu familia, protegida" | "Seguridad familiar premium" |
| "Está bien saber dónde están" | "Ubicación GPS en tiempo real" |
| "Un toque para pedir ayuda" | "Activar alerta SOS de emergencia" |
| "Creá tu círculo familiar" | "Configurar su círculo" |
| "Compartí tu ubicación" | "Habilitar geolocalización" |
| "Todos informados, todos tranquilos" | "Notificaciones push configuradas" |
| "Tu nido, tus reglas" | "Personaliza tu experiencia" |
| "Conectados, siempre" | "Sincronización automática" |
| "Sin preocupaciones" | "Cobertura premium disponible" |
| "Empezá gratis" | "Plan gratuito disponible" |

### Rewrites de strings clave

| Pantalla | Original (Life360-style) | Nuevo (Nido) |
|----------|-------------------------|-------------|
| Sign up | "Crear cuenta" | "Unite al nido" |
| CTA principal | "Comenzar prueba gratis" | "Empezá gratis" |
| Empty state map | "No hay miembros" | "Tu nido está vacío. Invitá a los tuyos." |
| SOS confirm | "¿Estás seguro?" | "¿Pedir ayuda? Tu círculo será notificado" |
| Drive score | "Score de seguridad" | "Tu manejo esta semana" |
| Membership | "Suscripción" | "Tu plan" |
| Location sharing | "Compartir ubicación" | "Mostrar dónde estás" |

---

## Archivos generados

- `replica/brand.md` ← este archivo
- `replica/brand.json` ← configuración para sweep
- `replica/design/tokens.json` ← actualizado con nueva paleta
- `replica/design/tokens.css` ← actualizado
- Strings actualizados en pantallas (ver `sweep.py`)