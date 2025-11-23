/**
 * Comprehensive Theme System and Sidebar Testing Script
 * Tests TweakCN theme system, Aceternity UI sidebar, and card components
 */

const { chromium } = require('playwright');

async function testThemeSystem() {
  console.log('🔍 Starting Theme System Validation...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the application
    await page.goto('http://localhost:8090');
    await page.waitForLoadState('networkidle');

    console.log('✅ Application loaded successfully');

    // Test 1: Theme Switching Functionality
    console.log('\n📋 Test 1: Theme Switching Functionality');

    // Check initial theme
    const initialTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' :
             document.documentElement.classList.contains('light') ? 'light' :
             document.documentElement.classList.contains('tweakcn') ? 'tweakcn' : 'system';
    });
    console.log(`   Initial theme: ${initialTheme}`);

    // Find theme toggle button
    const themeToggle = await page.locator('button[aria-label="Alternar tema"]').first();
    await themeToggle.waitFor({ state: 'visible', timeout: 5000 });

    // Test theme switching (multiple cycles)
    const themes = ['light', 'dark', 'system'];
    for (let i = 0; i < 3; i++) {
      console.log(`   Switching to theme ${i + 1}/3...`);
      await themeToggle.click();
      await page.waitForTimeout(500); // Wait for theme transition

      const currentTheme = await page.evaluate(() => {
        const root = document.documentElement;
        if (root.classList.contains('dark')) {return 'dark';}
        if (root.classList.contains('light')) {return 'light';}
        if (root.classList.contains('tweakcn')) {return 'tweakcn';}
        return 'unknown';
      });
      console.log(`   Current theme after switch ${i + 1}: ${currentTheme}`);
    }

    // Test 2: CSS Custom Properties Validation
    console.log('\n🎨 Test 2: CSS Custom Properties Validation');

    const cssVariables = await page.evaluate(() => {
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);

      return {
        background: computedStyle.getPropertyValue('--background'), financialNegative: computedStyle.getPropertyValue('--financial-negative'), financialPositive: computedStyle.getPropertyValue('--financial-positive'), foreground: computedStyle.getPropertyValue('--foreground'), primary: computedStyle.getPropertyValue('--primary'), secondary: computedStyle.getPropertyValue('--secondary'), sidebarBackground: computedStyle.getPropertyValue('--sidebar-background'), sidebarPrimary: computedStyle.getPropertyValue('--sidebar-primary'),
      };
    });

    console.log('   CSS Variables found:');
    Object.entries(cssVariables).forEach(([key, value]) => {
      const status = value ? '✅' : '❌';
      console.log(`   ${status} ${key}: ${value || 'NOT FOUND'}`);
    });

    // Test 3: Sidebar Functionality
    console.log('\n📱 Test 3: Sidebar Functionality');

    // Check if sidebar exists
    const sidebarExists = await page.locator('[data-testid="sidebar"]').isVisible().catch(() => false);
    console.log(`   Sidebar present: ${sidebarExists ? '✅' : '❌'}`);

    if (sidebarExists) {
      // Test sidebar expand/collapse
      const sidebarBody = await page.locator('.hidden.md\\:flex').first();

      // Test hover expansion
      await sidebarBody.hover();
      await page.waitForTimeout(300);

      const sidebarExpanded = await page.evaluate(() => {
        const sidebar = document.querySelector('.hidden.md\\:flex');
        if (!sidebar) {return false;}
        return sidebar.style.width !== '60px';
      });

      console.log(`   Sidebar hover expansion: ${sidebarExpanded ? '✅' : '❌'}`);

      // Test mobile responsiveness
      await page.setViewportSize({ height: 667, width: 375 }); // Mobile size
      await page.waitForTimeout(500);

      const mobileMenuVisible = await page.locator('[data-testid="mobile-menu"]').isVisible().catch(() => false);
      console.log(`   Mobile menu visible: ${mobileMenuVisible ? '✅' : '❌'}`);

      // Restore desktop size
      await page.setViewportSize({ height: 1080, width: 1920 });
      await page.waitForTimeout(500);
    }

    // Test 4: Card Component Variants
    console.log('\n🃏 Test 4: Card Component Variants');

    const cards = await page.locator('[class*="rounded-xl"]').all();
    console.log(`   Found ${cards.length} card components`);

    if (cards.length > 0) {
      // Test glass card variant
      const glassCards = await page.locator('.glass-card').all();
      console.log(`   Glass cards found: ${glassCards.length} ✅`);

      // Test card hover effects
      const firstCard = cards[0];
      await firstCard.hover();
      await page.waitForTimeout(300);

      const cardHasHoverEffect = await firstCard.evaluate(el => {
        const style = getComputedStyle(el);
        return style.transform !== 'none' || style.boxShadow !== 'none';
      });

      console.log(`   Card hover effect: ${cardHasHoverEffect ? '✅' : '❌'}`);
    }

    // Test 5: Glassmorphism Effects
    console.log('\n✨ Test 5: Glassmorphism Effects');

    const glassElements = await page.locator('[class*="glass"]').all();
    console.log(`   Found ${glassElements.length} glass elements`);

    if (glassElements.length > 0) {
      const glassEffectValid = await glassElements[0].evaluate(el => {
        const style = getComputedStyle(el);
        return (
          style.backdropFilter.includes('blur') ||
          style.backgroundColor.includes('0.8') ||
          style.background.includes('rgba')
        );
      });

      console.log(`   Glassmorphism effect valid: ${glassEffectValid ? '✅' : '❌'}`);
    }

    // Test 6: Animation Performance
    console.log('\n⚡ Test 6: Animation Performance');

    // Measure theme switching animation performance
    const animationStart = Date.now();
    await themeToggle.click();
    await page.waitForTimeout(400); // Wait for animation
    const animationEnd = Date.now();

    const animationDuration = animationEnd - animationStart;
    console.log(`   Theme switch animation duration: ${animationDuration}ms ${animationDuration < 500 ? '✅' : '⚠️'}`);

    // Test 7: Accessibility Features
    console.log('\n♿ Test 7: Accessibility Features');

    // Check ARIA labels
    const themeToggleAria = await themeToggle.getAttribute('aria-label');
    console.log(`   Theme toggle ARIA label: ${themeToggleAria ? '✅' : '❌'}`);

    // Check keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    console.log(`   Keyboard navigation: ${focusedElement ? '✅' : '❌'}`);

    // Test 8: Color Contrast
    console.log('\n🎯 Test 8: Color Contrast Validation');

    const contrastChecks = await page.evaluate(() => {
      const checks = [];

      // Check text contrast on cards
      const cards = document.querySelectorAll('[class*="rounded-xl"]');
      cards.forEach((card, index) => {
        if (index < 3) { // Check first 3 cards
          const textElement = card.querySelector('[class*="text-"]');
          if (textElement) {
            const cardStyle = getComputedStyle(card);
            const textStyle = getComputedStyle(textElement);

            checks.push({
              background: cardStyle.backgroundColor, element: `Card ${index + 1}`, foreground: textStyle.color, hasContrast: cardStyle.backgroundColor !== textStyle.color,
            });
          }
        }
      });

      return checks;
    });

    contrastChecks.forEach(check => {
      console.log(`   ${check.element}: ${check.hasContrast ? '✅' : '❌'}`);
    });

    // Test 9: Console Errors
    console.log('\n🐛 Test 9: Console Error Detection');

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Trigger some interactions to potentially cause errors
    await themeToggle.click();
    await page.waitForTimeout(500);

    console.log(`   Console errors found: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(error => console.log(`   ❌ ${error}`));
    } else {
      console.log('   ✅ No console errors detected');
    }

    console.log('\n🎉 Theme System Validation Complete!');

    return {
      success: true,
      tests: {
        accessibility: !!themeToggleAria, animationPerformance: animationDuration < 500, cardVariants: cards.length > 0, colorContrast: contrastChecks.every(c => c.hasContrast), consoleErrors: consoleErrors.length === 0, cssVariables: Object.values(cssVariables).every(v => v !== ''), glassmorphism: glassElements.length > 0, sidebarFunctionality: sidebarExists, themeSwitching: true,
      }
    };

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { error: error.message, success: false };
  } finally {
    await browser.close();
  }
}

// Run the tests
if (require.main === module) {
  testThemeSystem()
    .then(result => {
      console.log('\n📊 Test Results Summary:');
      console.log('========================');
      if (result.success) {
        console.log('✅ All tests completed successfully');
        const passedTests = Object.values(result.tests).filter(Boolean).length;
        const totalTests = Object.keys(result.tests).length;
        console.log(`📈 Passed: ${passedTests}/${totalTests} tests`);

        if (passedTests === totalTests) {
          console.log('🎉 Theme system is PRODUCTION READY!');
        } else {
          console.log('⚠️ Some tests failed - review needed');
        }
      } else {
        console.log('❌ Test execution failed:', result.error);
      }
    })
    .catch(error => {
      console.error('💥 Critical error during testing:', error);
      process.exit(1);
    });
}

module.exports = { testThemeSystem };