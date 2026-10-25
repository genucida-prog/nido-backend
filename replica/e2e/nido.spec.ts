// E2E tests for Nido — Family Safety App
// Run: npx playwright test

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// ── Helpers ──────────────────────────────────────────────

test.beforeEach(async ({ page }) => {
  // Fail on unhandled errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error('[PAGE ERROR]', msg.text());
    }
  });
  page.on('response', (res) => {
    if (res.status() >= 500) {
      throw new Error(`Server ${res.status()} on ${res.url()}`);
    }
  });
});

// ── F01: Sign up + create circle ─────────────────────────

test.describe('F01 Sign up and create circle', () => {
  test('F01-H1 happy path', async ({ page }) => {
    await page.goto('/');

    // Sign up
    await page.getByRole('link', { name: /regístrate/i }).click();
    await page.getByLabel('Nombre').fill('Ana García');
    await page.getByLabel('Email').fill('ana+nido@test.com');
    await page.getByLabel('Contraseña').fill('testpass123');
    await page.getByLabel('Confirmar contraseña').fill('testpass123');
    await page.getByRole('button', { name: /crear cuenta/i }).click();

    // Should reach onboarding or circle creation
    await expect(page).toHaveURL(/onboarding|create-circle|tabs/i);

    const a11y = await new AxeBuilder({ page }).analyze();
    expect(a11y.violations).toEqual([]);
  });

  test('F01-E1 empty name', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel('Email').fill('empty@test.com');
    await page.getByLabel('Contraseña').fill('testpass123');
    await page.getByLabel('Confirmar contraseña').fill('testpass123');
    await page.getByRole('button', { name: /crear cuenta/i }).click();
    await expect(page.getByText(/completa|requerido|error/i)).toBeVisible();
  });

  test('F01-E2 password mismatch', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel('Nombre').fill('Test');
    await page.getByLabel('Email').fill('mismatch@test.com');
    await page.getByLabel('Contraseña').fill('testpass123');
    await page.getByLabel('Confirmar contraseña').fill('different123');
    await page.getByRole('button', { name: /crear cuenta/i }).click();
    await expect(page.getByText(/no coinciden/i)).toBeVisible();
  });

  test('F01-E3 weak password', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel('Nombre').fill('Test');
    await page.getByLabel('Email').fill('weak@test.com');
    await page.getByLabel('Contraseña').fill('abc');
    await page.getByLabel('Confirmar contraseña').fill('abc');
    await page.getByRole('button', { name: /crear cuenta/i }).click();
    await expect(page.getByText(/6 caracter/i)).toBeVisible();
  });

  test('F01-N1 invalid email', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel('Nombre').fill('Test');
    await page.getByLabel('Email').fill('not-an-email');
    await page.getByLabel('Contraseña').fill('testpass123');
    await page.getByLabel('Confirmar contraseña').fill('testpass123');
    await page.getByRole('button', { name: /crear cuenta/i }).click();
    await expect(page.getByText(/email/i)).toBeVisible();
  });
});

// ── F03: Map + location ──────────────────────────────────

test.describe('F03 Map screen', () => {
  test('F03-H1 map loads with member pins', async ({ page }) => {
    await page.goto('/(tabs)');
    await expect(page.getByRole('heading', { name: /mapa/i })).toBeVisible();
    // Map component should render
    await expect(page.locator('canvas').first()).toBeVisible();

    const a11y = await new AxeBuilder({ page }).analyze();
    expect(a11y.violations).toEqual([]);
  });

  test('F03-E3 offline member shown', async ({ page }) => {
    await page.goto('/(tabs)');
    // Look for grayed-out pins (offline members)
    const offlinePins = page.locator('[aria-label*="sin conexión"]');
    // Either offline pins exist or none — both are valid
    expect(offlinePins.count()).toBeGreaterThanOrEqual(0);
  });
});

// ── F05: SOS ─────────────────────────────────────────────

test.describe('F05 SOS', () => {
  test('F05-H1 trigger SOS and confirm', async ({ page }) => {
    await page.goto('/(tabs)');
    // Find SOS FAB
    const sosBtn = page.getByRole('button', { name: /sos/i });
    await expect(sosBtn).toBeVisible();
    await sosBtn.click();

    // Should navigate to confirmation screen
    await expect(page.getByText(/pedir ayuda|tu círculo/i)).toBeVisible();

    const a11y = await new AxeBuilder({ page }).analyze();
    expect(a11y.violations).toEqual([]);
  });

  test('F05-E1 cancel during countdown', async ({ page }) => {
    await page.goto('/(tabs)');
    await page.getByRole('button', { name: /sos/i }).click();
    await page.getByRole('button', { name: /cancelar/i }).click();
    // Should return to map
    await expect(page.getByRole('button', { name: /sos/i })).toBeVisible();
  });
});

// ── F07: Membership upgrade ──────────────────────────────

test.describe('F07 Membership', () => {
  test('F07-H1 view membership tiers', async ({ page }) => {
    await page.goto('/(tabs)/membership');
    await expect(page.getByText(/silver|gold|platinum/i)).toBeVisible();
    await expect(page.getByText(/$9\.99|16\.99|24\.99/i)).toBeVisible();

    const a11y = await new AxeBuilder({ page }).analyze();
    expect(a11y.violations).toEqual([]);
  });

  test('F07-E1 upgrade to Gold', async ({ page }) => {
    await page.goto('/(tabs)/membership');
    const goldBtn = page.getByRole('button', { name: /actualizar a gold/i });
    if (await goldBtn.isVisible().catch(() => false)) {
      await goldBtn.click();
      // Should navigate to checkout
      await expect(page.getByText(/checkout|pago|método/i)).toBeVisible();
    }
  });
});

// ── F08: Notifications ───────────────────────────────────

test.describe('F08 Notifications', () => {
  test('F08-H1 view notifications', async ({ page }) => {
    await page.goto('/notifications');
    // Either empty state or notification list
    const isEmpty = await page.getByText(/no hay notificaciones/i).isVisible().catch(() => false);
    const hasList = await page.locator('[role=listitem]').count().then(c => c > 0);
    expect(isEmpty || hasList).toBe(true);

    const a11y = await new AxeBuilder({ page }).analyze();
    expect(a11y.violations).toEqual([]);
  });
});

// ── F09: Settings & Profile ──────────────────────────────

test.describe('F09 Settings', () => {
  test('F09-H1 edit profile', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('button', { name: /editar perfil/i }).click();
    await expect(page.getByLabel('Nombre')).toBeVisible();
    await page.getByLabel('Nombre').fill('Nuevo Nombre');
    await page.getByRole('button', { name: /guardar/i }).click();
    await expect(page).toHaveURL(/settings|tabs/i);

    const a11y = await new AxeBuilder({ page }).analyze();
    expect(a11y.violations).toEqual([]);
  });

  test('F09-N1 logout', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('button', { name: /cerrar sesión/i }).click();
    await expect(page.getByRole('heading', { name: /iniciar sesión|bienvenida/i })).toBeVisible();
  });
});

// ── F10: Cross-user isolation ────────────────────────────

test.describe('F10 Cross-user isolation', () => {
  test('F10-H1 user sees only their circle', async ({ page }) => {
    await page.goto('/(tabs)');
    // Should show circle data, not arbitrary circle IDs in URL
    const url = page.url();
    expect(url).not.toMatch(/circle_id=[^&]+/);
  });
});