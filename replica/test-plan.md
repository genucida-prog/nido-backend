# Test plan: Nido (Family Safety)

Build: scaffold-v1  Date: 2026-10-24  Env: local, seed data
Backend: backend/src/index.ts (Express + Supabase)
Frontend: replica/app/ (Expo/React Native — manual click-through)

---

## F01 New user signs up and joins a circle
| case | type | steps | expected | auto |
|------|------|-------|----------|------|
| F01-H1 | happy | Open app → signup with email/pass → verify → create circle "Mi Familia" → continue to map | Map screen shown, circle visible in nav | e2e |
| F01-E1 | edge | Signup with empty name | Error shown, button disabled | e2e |
| F01-E2 | edge | Signup with email already registered | Error: "Email already in use" | e2e |
| F01-E3 | edge | Signup with weak password (5 chars) | Error: min 6 characters | e2e |
| F01-E4 | edge | Double-tap signup button | Only one request sent, no duplicate user | e2e |
| F01-N1 | negative | Signup with invalid email format | Validation error shown | e2e |
| F01-N2 | negative | Signup with network error | Retry button shown | manual |

---

## F02 Join an existing circle
| case | type | steps | expected | auto |
|------|------|-------|----------|------|
| F02-H1 | happy | Enter valid 6-digit code → join → see map with members | Members list populated | e2e |
| F02-E1 | edge | Enter wrong/inactive code | Error: code not found | e2e |
| F02-E2 | edge | Enter code with < 4 chars | Validation error | e2e |
| F02-N1 | negative | Already a member of that circle | Message: "Ya eres miembro" | manual |

---

## F03 Share location on map
| case | type | steps | expected | auto |
|------|------|-------|----------|------|
| F03-H1 | happy | Grant location permission → see own pin on map → see other members' pins | Pins visible, names shown | e2e |
| F03-E1 | edge | Deny location permission | Prompt explains why location is needed | manual |
| F03-E2 | edge | No GPS signal (indoor) | "Ubicación limitada" warning | manual |
| F03-E3 | edge | Member goes offline | Pin grays out, shows "última vez" | e2e |
| F03-N1 | negative | Tap member with no location data | Shows "Ubicación no disponible" | manual |

---

## F04 Create and manage a Place
| case | type | steps | expected | auto |
|------|------|-------|----------|------|
| F04-H1 | happy | Places → Add → name "Casa" → set pin on map → radius 100m → save → enable arrival+departure alerts | Place appears in list with green alert badges | e2e |
| F04-E1 | edge | Create place with duplicate name in same circle | Error: "Ya existe un lugar con ese nombre" | e2e |
| F04-E2 | edge | Save place without name | Error: name required | e2e |
| F04-E3 | edge | Set radius to 500m max | Slider clamps at 500 | e2e |
| F04-N1 | negative | Delete place with active alerts | Confirmation dialog, alerts deleted too | manual |

---

## F05 SOS emergency
| case | type | steps | expected | auto |
|------|------|-------|----------|------|
| F05-H1 | happy | Tap SOS FAB → confirm within 5s countdown → alert sent to circle | Notification toast: "Alerta enviada" | e2e |
| F05-E1 | edge | Cancel during countdown (before 0) | Returns to map, no alert sent | e2e |
| F05-E2 | edge | Countdown reaches 0 → sends alert automatically | All members notified | e2e |
| F05-N1 | negative | No internet when tapping SOS | Error: "Sin conexión, intenta de nuevo" | manual |

---

## F06 Drive report
| case | type | steps | expected | auto |
|------|------|-------|----------|------|
| F06-H1 | happy | Drives tab → see list of drives with scores | Scores displayed, clickable | e2e |
| F06-E1 | edge | Tap drive with no events | "Excelente manejo" empty state | e2e |
| F06-E2 | edge | Tap drive with hard brake event | Event detail shown with severity | e2e |
| F06-N1 | negative | Filter by date range with no results | "No hay manejos en este período" | manual |

---

## F07 Upgrade membership (Stripe test mode)
| case | type | steps | expected | auto |
|------|------|-------|----------|------|
| F07-H1 | happy | Membership → select Gold → checkout → use Stripe test card 4242... → success | Membership upgraded, badge changes to Gold | e2e |
| F07-E1 | edge | Checkout with expired test card 4000000000000002 | Error: card declined | e2e |
| F07-E2 | edge | Cancel during checkout redirect | Returns to membership screen | manual |
| F07-N1 | negative | Already subscribed → try to upgrade again | Message: "Ya tienes Gold" | manual |

---

## F08 Notifications
| case | type | steps | expected | auto |
|------|------|-------|----------|------|
| F08-H1 | happy | Badge shows unread count → tap → see list → mark one as read → badge updates | Count decreases | e2e |
| F08-E1 | edge | Mark all as read | Badge disappears | e2e |
| F08-E2 | edge | No notifications yet | Empty state shown | e2e |

---

## F09 Profile & settings
| case | type | steps | expected | auto |
|------|------|-------|----------|------|
| F09-H1 | happy | Settings → Edit profile → change name → save → back to settings → name updated | Name reflected everywhere | e2e |
| F09-E1 | edge | Upload invalid image (too large > 5MB) | Error: file too large | manual |
| F09-N1 | negative | Logout → reopen app → must log in again | Redirected to login | manual |

---

## F10 Cross-user isolation
| case | type | steps | expected | auto |
|------|------|-------|----------|------|
| F10-H1 | happy | User A creates circle, User B joins → User B sees only their circle's data | No cross-circle data leakage | e2e |
| F10-E1 | edge | User B tries to access User A's circle via direct URL | 403 Forbidden | e2e |
| F10-N1 | negative | User B leaves circle → cannot see circle data anymore | All data hidden | manual |

---

## Summary

| Metric | Count |
|--------|-------|
| Total test cases | 38 |
| Automated (e2e) | 28 |
| Manual click-through | 10 |
| Happy paths | 10 |
| Edge cases | 18 |
| Negative cases | 10 |

Next: run `npx playwright test` and fill in results.