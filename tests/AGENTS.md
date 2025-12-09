# Testing Guide

## Package Identity

**Purpose**: E2E (Playwright) and unit (Vitest) tests for AegisWallet
**E2E Framework**: Playwright (browser automation)
**Unit Framework**: Vitest (3-5x faster than Jest)

## Setup & Run

> See root `AGENTS.md` for global commands (`bun install`, `bun test`, `bun test:e2e`)

```bash
# Test-specific commands
bun playwright:install         # Install Playwright browsers
bun test:watch                 # Watch mode
bun test:coverage              # With coverage report
bun test:e2e:ui                # Playwright UI mode
bun test:e2e:headed            # With browser visible

# Specific E2E test suites
bun test:e2e:smoke             # Critical path tests
bun test:e2e:lgpd              # LGPD compliance tests
bun test:e2e:a11y              # Accessibility tests
bun test:e2e:flows             # User journey tests
```

## Patterns & Conventions

### File Organization

```
tests/
├── e2e/
│   ├── accessibility/         # WCAG 2.1 AA+ tests
│   │   └── a11y-audit.spec.ts
│   ├── lgpd/                  # Brazilian compliance tests
│   │   ├── compliance-full.spec.ts
│   │   ├── consent-banner.spec.ts
│   │   └── data-rights.spec.ts
│   ├── security/              # Security validation tests
│   │   └── data-isolation.spec.ts
│   ├── smoke/                 # Critical path tests
│   │   ├── app-health.spec.ts
│   │   └── auth-flow.spec.ts
│   ├── flows/                 # User journey tests
│   │   └── import.e2e.ts
│   ├── pages/                 # Page Object Model
│   │   ├── LoginPage.ts
│   │   ├── DashboardPage.ts
│   │   └── index.ts
│   └── fixtures/              # Test fixtures
│       └── test-fixtures.ts
└── unit/
    └── ai/
        └── security.test.ts
```

### Naming Conventions

- **E2E Tests**: `*.spec.ts` (e.g., `auth-flow.spec.ts`)
- **Unit Tests**: `*.test.ts` (e.g., `security.test.ts`)
- **Page Objects**: PascalCase with `Page` suffix (e.g., `LoginPage.ts`)
- **Fixtures**: kebab-case (e.g., `test-fixtures.ts`)

### E2E Test Pattern (Playwright)

**Copy pattern from**: `tests/e2e/smoke/auth-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Authentication Flow', () => {
  test('should login successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.login('user@example.com', 'password');

    await expect(dashboardPage.welcomeMessage).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // ... test implementation
  });
});
```

### Page Object Model Pattern

**Copy pattern from**: `tests/e2e/pages/LoginPage.ts`

```typescript
import { type Page, type Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Senha');
    this.submitButton = page.getByRole('button', { name: 'Entrar' });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

### Unit Test Pattern (Vitest)

**Copy pattern from**: `tests/unit/ai/security.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { validateInput } from '@/lib/security';

describe('Security Validation', () => {
  beforeEach(() => {
    // Setup
  });

  it('should reject malicious input', () => {
    const maliciousInput = '<script>alert("xss")</script>';
    expect(() => validateInput(maliciousInput)).toThrow();
  });

  it('should accept valid input', () => {
    const validInput = 'Valid transaction description';
    expect(validateInput(validInput)).toBe(validInput);
  });
});
```

### Accessibility Test Pattern

**Copy pattern from**: `tests/e2e/accessibility/a11y-audit.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Audit', () => {
  test('should pass WCAG 2.1 AA standards', async ({ page }) => {
    await page.goto('/dashboard');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

### LGPD Compliance Test Pattern

**Copy pattern from**: `tests/e2e/lgpd/compliance-full.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('LGPD Compliance', () => {
  test('should display consent banner on first visit', async ({ page }) => {
    await page.goto('/');

    const consentBanner = page.getByRole('dialog', { name: /consentimento/i });
    await expect(consentBanner).toBeVisible();
  });

  test('should allow data export', async ({ page }) => {
    // Login and navigate to settings
    await page.goto('/settings/privacy');

    const exportButton = page.getByRole('button', { name: /exportar dados/i });
    await exportButton.click();

    // Verify download initiated
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('dados-pessoais');
  });
});
```

### Fixtures Pattern

**Copy pattern from**: `tests/e2e/fixtures/test-fixtures.ts`

```typescript
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

type Fixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  authenticatedPage: Page;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  authenticatedPage: async ({ page }, use) => {
    // Auto-login before each test
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Senha').fill('password');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.waitForURL('/dashboard');
    await use(page);
  },
});

export { expect } from '@playwright/test';
```

## Touch Points / Key Files

**E2E Tests**:
- `tests/e2e/smoke/auth-flow.spec.ts` - Authentication flow
- `tests/e2e/smoke/app-health.spec.ts` - App health checks
- `tests/e2e/lgpd/compliance-full.spec.ts` - LGPD compliance
- `tests/e2e/accessibility/a11y-audit.spec.ts` - Accessibility audit
- `tests/e2e/security/data-isolation.spec.ts` - Security validation
- `tests/e2e/flows/import.e2e.ts` - Import flow

**Page Objects**:
- `tests/e2e/pages/LoginPage.ts` - Login page abstraction
- `tests/e2e/pages/DashboardPage.ts` - Dashboard page abstraction
- `tests/e2e/pages/index.ts` - Page object exports

**Fixtures**:
- `tests/e2e/fixtures/test-fixtures.ts` - Reusable test fixtures

**Unit Tests**:
- `tests/unit/ai/security.test.ts` - AI security validation

**Configuration**:
- `playwright.config.ts` - Playwright configuration
- `vitest.config.ts` - Vitest configuration

## JIT Index Hints

```bash
# Find E2E tests
find tests/e2e -name "*.spec.ts"

# Find unit tests
find tests/unit -name "*.test.ts"

# Find page objects
find tests/e2e/pages -name "*.ts"

# Find accessibility tests
rg -n "AxeBuilder" tests/e2e/

# Find LGPD tests
rg -n "LGPD|consentimento" tests/e2e/

# Find test fixtures
find tests/e2e/fixtures -name "*.ts"
```

## Common Gotchas

- **Playwright Browsers**: Run `bun playwright:install` after dependencies
- **Selectors**: Prefer `getByRole`, `getByLabel` (accessibility-first)
- **Portuguese**: Test with PT-BR text (e.g., `{ name: 'Entrar' }`)

## Pre-PR Checks

```bash
bun test:coverage && bun test:e2e:smoke && bun test:e2e:a11y
```
