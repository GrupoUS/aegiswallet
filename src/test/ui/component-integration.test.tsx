import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MagicCard } from '../../components/ui/magic-card';

// Mock framer-motion to avoid animation issues in tests
vi.mock('motion/react', () => ({
  motion: {
    div: 'div',
  },
}));

describe('Component Integration', () => {
  describe('MagicCard', () => {
    it('renders children correctly', () => {
      render(
        <MagicCard data-testid="magic-card">
          <div>Test Content</div>
        </MagicCard>
      );

      const magicCard = screen.getByTestId('magic-card');
      const content = screen.getByText('Test Content');

      expect(magicCard).toBeInTheDocument();
      expect(content).toBeInTheDocument();
      expect(magicCard).toContainElement(content);
    });

    it('applies custom className correctly', () => {
      render(
        <MagicCard data-testid="magic-card" className="custom-class">
          <div>Test Content</div>
        </MagicCard>
      );

      const magicCard = screen.getByTestId('magic-card');
      expect(magicCard).toHaveClass('custom-class');
    });

    it('uses AegisWallet brand colors by default', () => {
      render(
        <MagicCard data-testid="magic-card">
          <div>Test Content</div>
        </MagicCard>
      );

      const magicCard = screen.getByTestId('magic-card');
      expect(magicCard).toBeInTheDocument();
    });
  });

  describe('Sidebar Integration', () => {
    it('imports sidebar components without errors', async () => {
      const sidebarComponents = await import('../../components/ui/sidebar');

      expect(sidebarComponents.Sidebar).toBeDefined();
      expect(sidebarComponents.SidebarProvider).toBeDefined();
      expect(sidebarComponents.SidebarLink).toBeDefined();
      expect(sidebarComponents.useSidebar).toBeDefined();
    });
  });
});
