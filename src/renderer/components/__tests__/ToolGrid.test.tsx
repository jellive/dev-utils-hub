import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToolGrid } from '../ToolGrid';
import type { DevUtilPlugin } from '../../../lib/plugins/plugin-types';
import React from 'react';

// Mock pluginRegistry with a controlled set of 3 plugins.
// Using a minimal but realistic fixture so assertions don't depend on live registry state.
const MOCK_PLUGINS: DevUtilPlugin[] = [
  {
    id: 'json',
    name: 'JSON Formatter',
    description: 'Format and validate JSON data',
    version: '1.0.0',
    author: 'test',
    icon: 'FileJson',
    category: 'formatting',
    component: React.lazy(() => Promise.resolve({ default: () => null })),
    path: 'json',
    enabled: true,
  },
  {
    id: 'jwt',
    name: 'JWT Decoder',
    description: 'Decode and inspect JWT tokens',
    version: '1.0.0',
    author: 'test',
    icon: 'Key',
    category: 'security',
    component: React.lazy(() => Promise.resolve({ default: () => null })),
    path: 'jwt',
    enabled: true,
  },
  {
    id: 'hash',
    name: 'Hash Generator',
    description: 'Generate MD5, SHA hashes',
    version: '1.0.0',
    author: 'test',
    icon: 'Hash',
    category: 'security',
    component: React.lazy(() => Promise.resolve({ default: () => null })),
    path: 'hash',
    enabled: true,
  },
];

vi.mock('../../../lib/plugins/plugin-registry', () => ({
  pluginRegistry: {
    getEnabledPlugins: () => MOCK_PLUGINS,
  },
}));

function renderWithRouter(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ToolGrid />
    </MemoryRouter>
  );
}

describe('ToolGrid', () => {
  beforeEach(() => {
    renderWithRouter('/json');
  });

  describe('Grid Layout', () => {
    it('should render grid container with proper styling', () => {
      const grid = screen.getByRole('grid', { name: /tool selection/i });
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('grid');
    });

    it('should have responsive grid columns', () => {
      const grid = screen.getByRole('grid', { name: /tool selection/i });
      expect(grid.className).toMatch(/grid-cols-1/);
      expect(grid.className).toMatch(/md:grid-cols-2/);
      expect(grid.className).toMatch(/lg:grid-cols-3/);
      expect(grid.className).toMatch(/xl:grid-cols-4/);
    });
  });

  describe('Tool Cards', () => {
    it('should render all mock plugin cards', () => {
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(MOCK_PLUGINS.length);
    });

    it('should render JSON Formatter card', () => {
      expect(screen.getByRole('link', { name: /json formatter/i })).toBeInTheDocument();
    });

    it('should render JWT Decoder card', () => {
      expect(screen.getByRole('link', { name: /jwt decoder/i })).toBeInTheDocument();
    });

    it('should render Hash Generator card', () => {
      expect(screen.getByRole('link', { name: /hash generator/i })).toBeInTheDocument();
    });
  });

  describe('Card Content', () => {
    it('should display card title text', () => {
      expect(screen.getByText('JSON Formatter')).toBeInTheDocument();
    });

    it('should display card description', () => {
      expect(screen.getByText(/format.*validate.*json/i)).toBeInTheDocument();
    });

    it('should render lucide-react icon inside card', () => {
      const jsonCard = screen.getByRole('link', { name: /json formatter/i });
      const icon = jsonCard.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Card Interactions', () => {
    it('should have hover effect with translate transform', () => {
      const card = screen.getByRole('link', { name: /json formatter/i });
      expect(card.className).toContain('hover:-translate-y-2');
    });

    it('should have hover effect with shadow', () => {
      const card = screen.getByRole('link', { name: /json formatter/i });
      expect(card.className).toContain('hover:shadow-xl');
    });

    it('should have smooth transition with ease-out', () => {
      const card = screen.getByRole('link', { name: /json formatter/i });
      expect(card.className).toContain('duration-300');
      expect(card.className).toContain('ease-out');
    });

    it('should have active state with scale effect', () => {
      const card = screen.getByRole('link', { name: /json formatter/i });
      expect(card.className).toContain('active:scale-[0.98]');
    });

    it('should navigate to tool path when card is clicked', () => {
      const jwtCard = screen.getByRole('link', { name: /jwt decoder/i });
      expect(jwtCard).toHaveAttribute('href', '/jwt');
    });
  });

  describe('Active Tool Selection', () => {
    it('should not highlight inactive tools (pathname is / in global mock)', () => {
      // useLocation is globally mocked to return pathname '/'
      // so no plugin is active; ring-2 class must be absent
      const jsonCard = screen.getByRole('link', { name: /json formatter/i });
      expect(jsonCard.className).not.toContain('ring-2');
    });

    it('should not highlight jwt card when root is active', () => {
      const inactiveCard = screen.getByRole('link', { name: /jwt decoder/i });
      expect(inactiveCard.className).not.toContain('ring-2');
    });
  });

  describe('Search Functionality', () => {
    it('should render search input', () => {
      const searchInput = screen.getByRole('textbox');
      expect(searchInput).toBeInTheDocument();
    });

    it('should filter cards to only matching tools', () => {
      const searchInput = screen.getByRole('textbox');

      fireEvent.change(searchInput, { target: { value: 'json' } });

      expect(screen.getByRole('link', { name: /json formatter/i })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /jwt decoder/i })).not.toBeInTheDocument();
    });

    it('should search by tool name', () => {
      const searchInput = screen.getByRole('textbox');

      fireEvent.change(searchInput, { target: { value: 'hash' } });

      expect(screen.getByRole('link', { name: /hash generator/i })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /json formatter/i })).not.toBeInTheDocument();
    });

    it('should search by tool description', () => {
      const searchInput = screen.getByRole('textbox');

      fireEvent.change(searchInput, { target: { value: 'format' } });

      expect(screen.getByRole('link', { name: /json formatter/i })).toBeInTheDocument();
    });

    it('should restore all tools when search is cleared', () => {
      const searchInput = screen.getByRole('textbox');

      fireEvent.change(searchInput, { target: { value: 'json' } });
      fireEvent.change(searchInput, { target: { value: '' } });

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(MOCK_PLUGINS.length);
    });

    it('should show no-results message for unmatched query', () => {
      const searchInput = screen.getByRole('textbox');

      fireEvent.change(searchInput, { target: { value: 'zzznomatch' } });

      expect(screen.queryAllByRole('link')).toHaveLength(0);
      expect(screen.getByText(/no tools found/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA label on grid', () => {
      const grid = screen.getByRole('grid', { name: /tool selection/i });
      expect(grid).toHaveAttribute('aria-label', 'Tool Selection Grid');
    });

    it('should support keyboard navigation by focusing card link', () => {
      const firstCard = screen.getByRole('link', { name: /json formatter/i });
      firstCard.focus();
      expect(document.activeElement).toBe(firstCard);
    });
  });
});
