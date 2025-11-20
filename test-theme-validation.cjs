/**
 * Simple Theme System Validation Script
 * Tests TweakCN theme system without external dependencies
 */

const fs = require('fs');
const path = require('path');

function validateThemeSystem() {
  console.log('🔍 Starting Theme System Validation...\n');

  const results = {
    themeProvider: false,
    cssVariables: false,
    sidebarComponent: false,
    cardVariants: false,
    glassmorphism: false,
    themeToggle: false,
    financialColors: false,
    issues: []
  };

  try {
    // Test 1: Theme Provider Implementation
    console.log('📋 Test 1: Theme Provider Implementation');

    const themeProviderPath = path.join(__dirname, 'src/components/providers/ThemeProvider.tsx');
    if (fs.existsSync(themeProviderPath)) {
      const themeProviderContent = fs.readFileSync(themeProviderPath, 'utf8');

      const hasThemeTypes = themeProviderContent.includes('type Theme =');
      const hasThemeContext = themeProviderContent.includes('ThemeProviderContext');
      const hasUseTheme = themeProviderContent.includes('useTheme');
      const supportsTweakcn = themeProviderContent.includes("'tweakcn'");

      console.log(`   ✅ Theme types: ${hasThemeTypes}`);
      console.log(`   ✅ Theme context: ${hasThemeContext}`);
      console.log(`   ✅ useTheme hook: ${hasUseTheme}`);
      console.log(`   ✅ TweakCN support: ${supportsTweakcn}`);

      results.themeProvider = hasThemeTypes && hasThemeContext && hasUseTheme && supportsTweakcn;
    } else {
      console.log('   ❌ ThemeProvider.tsx not found');
      results.issues.push('ThemeProvider.tsx missing');
    }

    // Test 2: CSS Variables and Financial Colors
    console.log('\n🎨 Test 2: CSS Variables and Financial Colors');

    const indexCssPath = path.join(__dirname, 'src/index.css');
    if (fs.existsSync(indexCssPath)) {
      const cssContent = fs.readFileSync(indexCssPath, 'utf8');

      const requiredVariables = [
        '--background',
        '--foreground',
        '--primary',
        '--secondary',
        '--financial-positive',
        '--financial-negative',
        '--financial-neutral',
        '--sidebar-background',
        '--sidebar-primary',
        '--sidebar-accent'
      ];

      const foundVariables = requiredVariables.filter(variable =>
        cssContent.includes(variable)
      );

      console.log(`   Found ${foundVariables.length}/${requiredVariables.length} required CSS variables:`);
      foundVariables.forEach(variable => {
        console.log(`   ✅ ${variable}`);
      });

      const missingVariables = requiredVariables.filter(variable =>
        !cssContent.includes(variable)
      );

      missingVariables.forEach(variable => {
        console.log(`   ❌ ${variable} - MISSING`);
        results.issues.push(`Missing CSS variable: ${variable}`);
      });

      results.cssVariables = missingVariables.length === 0;
      results.financialColors = cssContent.includes('--financial-positive') &&
                             cssContent.includes('--financial-negative') &&
                             cssContent.includes('--financial-neutral');

      // Check for glass-card class
      const hasGlassCard = cssContent.includes('.glass-card');
      console.log(`   ✅ Glass card CSS: ${hasGlassCard}`);
      results.glassmorphism = hasGlassCard;

    } else {
      console.log('   ❌ index.css not found');
      results.issues.push('index.css missing');
    }

    // Test 3: Sidebar Component
    console.log('\n📱 Test 3: Sidebar Component');

    const sidebarPath = path.join(__dirname, 'src/components/ui/sidebar.tsx');
    if (fs.existsSync(sidebarPath)) {
      const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');

      const hasSidebarProvider = sidebarContent.includes('SidebarProvider');
      const hasSidebarBody = sidebarContent.includes('SidebarBody');
      const hasAnimations = sidebarContent.includes('motion.div') || sidebarContent.includes('AnimatePresence');
      const hasHoverEffects = sidebarContent.includes('onMouseEnter') || sidebarContent.includes('onMouseLeave');
      const hasGlassDark = sidebarContent.includes('glass-dark');

      console.log(`   ✅ SidebarProvider: ${hasSidebarProvider}`);
      console.log(`   ✅ SidebarBody: ${hasSidebarBody}`);
      console.log(`   ✅ Animations: ${hasAnimations}`);
      console.log(`   ✅ Hover effects: ${hasHoverEffects}`);
      console.log(`   ✅ Glass dark styling: ${hasGlassDark}`);

      results.sidebarComponent = hasSidebarProvider && hasSidebarBody && hasAnimations && hasHoverEffects;
    } else {
      console.log('   ❌ sidebar.tsx not found');
      results.issues.push('sidebar.tsx missing');
    }

    // Test 4: Card Component Variants
    console.log('\n🃏 Test 4: Card Component Variants');

    const cardPath = path.join(__dirname, 'src/components/ui/card.tsx');
    if (fs.existsSync(cardPath)) {
      const cardContent = fs.readFileSync(cardPath, 'utf8');

      const hasCardVariants = cardContent.includes('cardVariants');
      const hasGlassVariant = cardContent.includes("'glass'");
      const hasHoverVariant = cardContent.includes("'hover'");
      const hasGlassHoverVariant = cardContent.includes("'glass-hover'");
      const hasCVA = cardContent.includes('class-variance-authority');

      console.log(`   ✅ Card variants: ${hasCardVariants}`);
      console.log(`   ✅ Glass variant: ${hasGlassVariant}`);
      console.log(`   ✅ Hover variant: ${hasHoverVariant}`);
      console.log(`   ✅ Glass-hover variant: ${hasGlassHoverVariant}`);
      console.log(`   ✅ Class Variance Authority: ${hasCVA}`);

      results.cardVariants = hasCardVariants && hasGlassVariant && hasHoverVariant && hasGlassHoverVariant;
    } else {
      console.log('   ❌ card.tsx not found');
      results.issues.push('card.tsx missing');
    }

    // Test 5: Theme Toggle Component
    console.log('\n🔄 Test 5: Theme Toggle Component');

    const themeTogglePath = path.join(__dirname, 'src/components/ui/animated-theme-toggler.tsx');
    if (fs.existsSync(themeTogglePath)) {
      const themeToggleContent = fs.readFileSync(themeTogglePath, 'utf8');

      const hasUseTheme = themeToggleContent.includes('useTheme');
      const hasViewTransition = themeToggleContent.includes('startViewTransition');
      const hasAnimationLogic = themeToggleContent.includes('duration') &&
                             themeToggleContent.includes('animate');
      const hasAriaLabel = themeToggleContent.includes('aria-label');

      console.log(`   ✅ useTheme hook: ${hasUseTheme}`);
      console.log(`   ✅ View Transition API: ${hasViewTransition}`);
      console.log(`   ✅ Animation logic: ${hasAnimationLogic}`);
      console.log(`   ✅ ARIA label: ${hasAriaLabel}`);

      results.themeToggle = hasUseTheme && hasViewTransition && hasAnimationLogic && hasAriaLabel;
    } else {
      console.log('   ❌ animated-theme-toggler.tsx not found');
      results.issues.push('animated-theme-toggler.tsx missing');
    }

    // Test 6: Magic Card Component
    console.log('\n✨ Test 6: Magic Card Component');

    const magicCardPath = path.join(__dirname, 'src/components/ui/magic-card.tsx');
    if (fs.existsSync(magicCardPath)) {
      const magicCardContent = fs.readFileSync(magicCardPath, 'utf8');

      const hasMouseTracking = magicCardContent.includes('handleMouseMove');
      const hasGradientEffect = magicCardContent.includes('gradientFrom') &&
                            magicCardContent.includes('gradientTo');
      const hasAegisColors = magicCardContent.includes('#AC9469') &&
                           magicCardContent.includes('#112031');
      const hasHoverStates = magicCardContent.includes('isHovering');

      console.log(`   ✅ Mouse tracking: ${hasMouseTracking}`);
      console.log(`   ✅ Gradient effects: ${hasGradientEffect}`);
      console.log(`   ✅ AegisWallet colors: ${hasAegisColors}`);
      console.log(`   ✅ Hover states: ${hasHoverStates}`);

      // Magic card enhances glassmorphism
      if (hasGradientEffect && hasMouseTracking) {
        results.glassmorphism = true;
      }
    } else {
      console.log('   ❌ magic-card.tsx not found');
      results.issues.push('magic-card.tsx missing');
    }

    // Test 7: Hover Border Gradient Component
    console.log('\n🌈 Test 7: Hover Border Gradient Component');

    const hoverBorderPath = path.join(__dirname, 'src/components/ui/hover-border-gradient.tsx');
    if (fs.existsSync(hoverBorderPath)) {
      const hoverBorderContent = fs.readFileSync(hoverBorderPath, 'utf8');

      const hasRotatingVariant = hoverBorderContent.includes("'rotating'");
      const hasMouseFollowVariant = hoverBorderContent.includes("'mouse-follow'");
      const hasAceternityStyle = hoverBorderContent.includes('Aceternity');
      const hasAegisColors = hoverBorderContent.includes('#AC9469');

      console.log(`   ✅ Rotating variant: ${hasRotatingVariant}`);
      console.log(`   ✅ Mouse-follow variant: ${hasMouseFollowVariant}`);
      console.log(`   ✅ Aceternity UI style: ${hasAceternityStyle}`);
      console.log(`   ✅ AegisWallet colors: ${hasAegisColors}`);

    } else {
      console.log('   ❌ hover-border-gradient.tsx not found');
      results.issues.push('hover-border-gradient.tsx missing');
    }

    // Test 8: App Layout Integration
    console.log('\n🏗️ Test 8: App Layout Integration');

    const appLayoutPath = path.join(__dirname, 'src/components/layout/AppLayout.tsx');
    if (fs.existsSync(appLayoutPath)) {
      const appLayoutContent = fs.readFileSync(appLayoutPath, 'utf8');

      const hasThemeToggle = appLayoutContent.includes('AnimatedThemeToggler');
      const hasSidebar = appLayoutContent.includes('Sidebar');
      const hasAccessibility = appLayoutContent.includes('AccessibilityProvider');
      const hasResponsiveDesign = appLayoutContent.includes('md:flex') ||
                              appLayoutContent.includes('hidden.md:flex');

      console.log(`   ✅ Theme toggle integration: ${hasThemeToggle}`);
      console.log(`   ✅ Sidebar integration: ${hasSidebar}`);
      console.log(`   ✅ Accessibility integration: ${hasAccessibility}`);
      console.log(`   ✅ Responsive design: ${hasResponsiveDesign}`);

    } else {
      console.log('   ❌ AppLayout.tsx not found');
      results.issues.push('AppLayout.tsx missing');
    }

    console.log('\n📊 Validation Results Summary:');
    console.log('================================');

    const passedTests = Object.keys(results).filter(key =>
      key !== 'issues' && results[key]
    ).length;

    const totalTests = Object.keys(results).filter(key => key !== 'issues').length;

    console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);

    if (results.issues.length > 0) {
      console.log('\n❌ Issues found:');
      results.issues.forEach(issue => console.log(`   - ${issue}`));
    }

    if (passedTests === totalTests && results.issues.length === 0) {
      console.log('\n🎉 Theme system is PRODUCTION READY!');
      return { success: true, productionReady: true, results };
    } else {
      console.log('\n⚠️ Some tests failed - review needed');
      return { success: true, productionReady: false, results };
    }

  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the validation
if (require.main === module) {
  const result = validateThemeSystem();

  if (result.success) {
    process.exit(result.productionReady ? 0 : 1);
  } else {
    console.error('💥 Critical error during validation');
    process.exit(2);
  }
}

module.exports = { validateThemeSystem };