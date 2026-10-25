# Bugs — Nido Family Safety

Bug tracker for the Nido clone. Format per bug-report.md template.

---

### BUG-001: Login button stays loading after failed request
- **Severity:** S2
- **Flow / case:** F01-H1
- **Screen:** login.tsx
- **Build:** scaffold-v1
- **Browser / device:** Chrome 140, 1440px

**Steps**
1. Go to /login
2. Enter wrong email/password
3. Tap "Iniciar sesión"

**Expected:** Button text returns to "Iniciar sesión", error alert shown
**Actual:** Button stays showing "Iniciando sesión..." indefinitely
**Evidence:** Console: no error, button disabled state persists
**Suspected cause:** setLoading(false) not called in catch block
**Status:** open

---

### BUG-002: SOS FAB not accessible via keyboard
- **Severity:** S3
- **Flow / case:** F05-H1
- **Screen:** sos-confirm.tsx
- **Build:** scaffold-v1
- **Browser / device:** Chrome 140, keyboard only

**Steps**
1. Navigate to map with Tab key
2. Tab through to SOS button
3. Press Enter

**Expected:** SOS confirmation screen opens
**Actual:** Nothing happens (no focus ring visible, Enter not triggered)
**Evidence:** Axe violation: button has no accessible name
**Suspected cause:** TouchableOpacity missing accessibilityLabel prop or focus handling
**Status:** open

---

### BUG-003: Membership prices not matching backend config
- **Severity:** S3
- **Flow / case:** F07-H1
- **Screen:** membership.tsx
- **Build:** scaffold-v1
- **Browser / device:** Chrome 140

**Steps**
1. Go to Membership screen
2. Check displayed prices
3. Compare with backend STRIPE_PRICE_* env vars

**Expected:** Prices match configured Stripe prices
**Actual:** Hardcoded prices ($9.99/$16.99/$24.99) may drift from actual Stripe prices
**Evidence:** Hardcoded in membership.tsx line ~15
**Suspected cause:** Prices should be fetched from backend, not hardcoded
**Status:** open

---

### BUG-004: Place form slider not interactive
- **Severity:** S2
- **Flow / case:** F04-H1
- **Screen:** place-edit.tsx
- **Build:** scaffold-v1
- **Browser / device:** Touch device / Chrome DevTools mobile

**Steps**
1. Go to Places → Add place
2. Try to drag the radius slider
3. Observe behavior

**Expected:** Slider updates radius value
**Actual:** Slider is non-functional (custom component not wired to onPress)
**Evidence:** InputRange component has no touch handler
**Suspected cause:** Custom slider implementation incomplete
**Status:** open

---

### BUG-005: Drive score always shows 85 regardless of events
- **Severity:** S3
- **Flow / case:** F06-H1
- **Screen:** drive-detail.tsx
- **Build:** scaffold-v1
- **Browser / device:** Chrome 140

**Steps**
1. View a drive with hard brake events
2. Check the score display
3. View a drive with no events

**Expected:** Score varies based on events (lower = more events)
**Actual:** Always shows 85 (hardcoded fallback in calculateDrivingScore)
**Evidence:** drives.ts backend calculateDrivingScore returns constant 85
**Suspected cause:** Mock implementation, needs real sensor data integration
**Status:** open

---

### BUG-006: Back button on settings doesn't work
- **Severity:** S3
- **Flow / case:** F09-H1
- **Screen:** settings.tsx
- **Build:** scaffold-v1
- **Browser / device:** Chrome 140

**Steps**
1. Navigate to Settings from bottom nav
2. Tap back arrow in header

**Expected:** Returns to previous screen (map/tabs)
**Actual:** Nothing happens (no router.back() call wired)
**Evidence:** Header exists but onPress not bound
**Suspected cause:** Missing navigation handler
**Status:** open

---

### To check (unverified)
- [ ] F02: Join circle with 6-digit code — code format validation
- [ ] F04: Delete place with active alerts — confirmation dialog
- [ ] F08: Notification badge updates in real-time
- [ ] F10: Second user cannot see first user's circle data via direct URL
- [ ] Push notifications received when SOS triggered
- [ ] Offline mode: last known location persists
- [ ] Time zone handling: all timestamps display in user's local zone