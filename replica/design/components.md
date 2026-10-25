# Component Specs

## Button
- **variants**: primary, secondary, ghost, danger, sos
- **sizes**: sm 36px, md 44px, lg 52px
- **states**: default, hover, active, focus-visible (2px ring, accent), disabled, loading
- **tokens**: primary → bg accent, text on-accent; secondary → bg surface-elevated, border border, text text; ghost → transparent, text accent; danger → bg danger, text on-accent; sos → bg sos, text on-accent
- **a11y**: real `<button>`, visible focus ring, loading state keeps label for screen readers
- **used on**: S02, S04, S05, S09, S12, S14

## Icon Button
- **variants**: default, floating (FAB)
- **sizes**: sm 32px, md 40px, lg 48px, fab 56px
- **states**: default, hover, pressed, disabled
- **tokens**: bg surface-elevated, shadow card for FAB
- **used on**: S06 (location button), S07 (call/message)

## Bottom Navigation
- **items**: Map, Drives, Places, Membership (4 tabs)
- **height**: 72px
- **states**: active (accent color + top indicator), inactive (text-muted)
- **tokens**: bg surface-elevated, shadow-sm, active icon accent, inactive icon text-muted
- **used on**: All main screens

## Member Pin
- **variants**: default, online, offline, high-battery, low-battery, charging, driving
- **sizes**: default 32px, expanded 48px
- **states**: idle, tap, selected, loading
- **tokens**: bg accent for online, gray-400 for offline, green-500 for driving, red-500 for low battery
- **sub-labels**: name (text, sm/600), ETA (text-muted, xs)
- **used on**: S06 map

## Place Card
- **variants**: default, alert-enabled, alert-disabled, editing
- **sizes**: full-width card
- **states**: default, hover, pressed, empty-state
- **tokens**: bg surface-elevated, border border, radius md, shadow card
- **icon**: location pin (accent color), alert bell (warning when enabled)
- **used on**: S08 places list

## Drive Card
- **variants**: default, scored-high, scored-low
- **sizes**: full-width card
- **states**: default, pressed, loading
- **tokens**: bg surface-elevated, score badge uses success (high) or danger (low)
- **metrics**: avg speed, max speed, events count
- **used on**: S10 drives list

## SOS Button
- **variants**: normal, pressed, confirmed, sending
- **sizes**: 72px circle
- **states**: ready (shake animation), pressed (expand), confirmed (checkmark), sending (spinner)
- **tokens**: bg sos, text on-accent, shadow pop
- **a11y**: voiceover reads "Emergency SOS button, press to alert circle members"
- **used on**: S06 (floating), S12 (confirmation screen)

## Membership Card
- **variants**: free, silver, gold, platinum
- **sizes**: full-width tier display
- **states**: current (badge), upgrade CTA, expired
- **tokens**: tier colors as left border accent (silver=gray, gold=amber, platinum=violet)
- **used on**: S14 membership screen

## Alert Badge
- **variants**: unread, read, critical (SOS), informational
- **sizes**: dot 8px, badge count pill
- **states**: default, unread pulse animation
- **tokens**: bg danger for critical, bg accent for info
- **used on**: S19 notifications, bottom nav icon

## Input Field
- **variants**: text, email, phone, password, search
- **sizes**: md 44px height
- **states**: default, focused (border accent, 2px), error (border danger, helper text), disabled
- **tokens**: border border-input, focus ring 2px accent, error border danger
- **used on**: S02, S04, S05, S09, S17

## Modal / Bottom Sheet
- **variants**: alert, confirm, input, full-screen
- **sizes**: auto height, max 80vh
- **states**: opening (animate up), dismissible (backdrop tap), loading
- **tokens**: backdrop overlay, bg surface-elevated, shadow-lg
- **used on**: S09 (place edit), S12 (SOS confirm), S15 (checkout)

## Empty State
- **variants**: no-members, no-places, no-drives, no-history, no-internet
- **sizes**: full screen centered
- **tokens**: illustration (lucide icon, 64px, text-subtle), title (text, lg/600), body (text-muted, sm), CTA button (primary)
- **used on**: S06, S08, S10, S18

## Error State
- **variants**: network-error, permission-denied, generic, server-error
- **sizes**: centered card
- **tokens**: icon (danger, 32px), title (text, md/600), body (text-muted, sm), retry button (secondary)
- **used on**: All screens on failure

## Screen Transition
- **types**: push (slide right), modal (slide up), bottom-sheet
- **duration**: motion-base
- **easing**: motion-ease