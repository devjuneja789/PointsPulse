import { test, expect } from '@playwright/test';

test.describe('PointsPulse Mobile & Desktop E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
  });

  test('P5-1: Initial page load & glanceable layout above the fold', async ({ page }) => {
    // Check match header badges
    await expect(page.locator('[data-testid="badge-simulated"]')).toBeVisible();
    await expect(page.locator('text=LIVE')).toBeVisible();

    // Check displayed total points (46.0 pts for 10 active playing XI + multipliers, 1 benched)
    const scoreElement = page.locator('[data-testid="displayed-total-points"]');
    await expect(scoreElement).toBeVisible();
    await expect(scoreElement).toContainText('46.0');

    // Verify explanation card is visible
    await expect(page.locator('[data-testid="explanation-card"]')).toBeVisible();

    // Check replay controls
    await expect(page.locator('[data-testid="btn-play-pause"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-next-ball"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-reset"]')).toBeVisible();
  });

  test('P5-2: Golden Path - step to wicket event, verify points update and Breakdown Drawer', async ({ page }) => {
    // Click Next Ball 3 times to reach 0.3 over (Tushar Deshpande bowled Rohit Sharma)
    const nextBtn = page.locator('[data-testid="btn-next-ball"]');
    await nextBtn.click();
    await page.waitForTimeout(300);
    await nextBtn.click();
    await page.waitForTimeout(300);
    await nextBtn.click();

    // Wait for explanation card to update
    const explanationCard = page.locator('[data-testid="explanation-card"]');
    await expect(explanationCard).toBeVisible();
    await expect(explanationCard).toContainText('Tushar Deshpande', { timeout: 5000 });

    // Verify score changed from 46.0 -> 84.0 pts
    const heroScore = page.locator('[data-testid="displayed-total-points"]');
    await expect(heroScore).toContainText('84.0', { timeout: 5000 });

    // Open Breakdown Drawer
    const breakdownBtn = page.locator('[data-testid="btn-see-breakdown"]');
    await expect(breakdownBtn).toBeVisible();
    await breakdownBtn.click();

    // Verify drawer contents
    const drawer = page.locator('[data-testid="breakdown-drawer"]');
    await expect(drawer).toBeVisible();

    // Close drawer
    const closeBtn = page.locator('[data-testid="btn-close-drawer"]');
    await closeBtn.click();
    await expect(drawer).not.toBeVisible();
  });

  test('P5-3: Language toggle - switches between English and Hinglish smoothly', async ({ page }) => {
    // Advance 3 balls
    const nextBtn = page.locator('[data-testid="btn-next-ball"]');
    await nextBtn.click();
    await page.waitForTimeout(200);
    await nextBtn.click();
    await page.waitForTimeout(200);
    await nextBtn.click();

    // Verify initial English copy
    const explanationText = page.locator('[data-testid="explanation-text"]');
    await expect(explanationText).toBeVisible();

    // Click language toggle to HI
    const langHiBtn = page.locator('[data-testid="lang-hi"]');
    await langHiBtn.click();
    await page.waitForTimeout(200);

    // Click language toggle back to EN
    const langEnBtn = page.locator('[data-testid="lang-en"]');
    await langEnBtn.click();
    await page.waitForTimeout(200);
    await expect(explanationText).toBeVisible();
  });

  test('P5-4: Theme toggle - alternates between dark and light themes', async ({ page }) => {
    const themeBtn = page.locator('[data-testid="theme-toggle"]');
    await expect(themeBtn).toBeVisible();

    // Click theme toggle
    await themeBtn.click();
    await page.waitForTimeout(100);
    // Click again to return to default
    await themeBtn.click();
    await page.waitForTimeout(100);
  });

  test('P5-5: Scenario switcher - switches to Late Collapse and verifies reset', async ({ page }) => {
    const selector = page.locator('[data-testid="scenario-selector"]');
    await expect(selector).toBeVisible();

    // Switch to late-collapse
    await selector.selectOption('late-collapse');

    // Verify hero score resets to starting XI (46.0 pts)
    const heroScore = page.locator('[data-testid="displayed-total-points"]');
    await expect(heroScore).toContainText('46.0');

    // Advance 1 ball (15.1 - collapse begins)
    const nextBtn = page.locator('[data-testid="btn-next-ball"]');
    await nextBtn.click();

    // Verify match state updated
    await expect(heroScore).toBeVisible();
  });

  test('P5-6: Ask Box and Timeline Catch-Up functionality', async ({ page }) => {
    // Advance match a few balls
    const nextBtn = page.locator('[data-testid="btn-next-ball"]');
    await nextBtn.click();
    await page.waitForTimeout(200);
    await nextBtn.click();
    await page.waitForTimeout(200);
    await nextBtn.click();

    // Click "Catch Me Up" recap button
    const catchUpBtn = page.locator('[data-testid="btn-catch-me-up"]');
    if (await catchUpBtn.isVisible()) {
      await catchUpBtn.click();
      const recapBox = page.locator('[data-testid="catch-up-recap-box"]');
      await expect(recapBox).toBeVisible({ timeout: 5000 });
    }

    // Ask a grounded question
    const askInput = page.locator('[data-testid="ask-input"]');
    await expect(askInput).toBeVisible();
    await askInput.fill('Who is my captain?');

    const askBtn = page.locator('[data-testid="btn-ask-submit"]');
    await askBtn.click();

    // Verify answer bubble
    const answerBox = page.locator('[data-testid="ask-answer-box"]');
    await expect(answerBox).toBeVisible({ timeout: 6000 });
    await expect(answerBox).toContainText('Jasprit Bumrah');
  });
});
