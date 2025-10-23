import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToolGrid } from '../ToolGrid';

// Mock useAppStore
const mockSetActiveTool = vi.fn();
vi.mock('../../stores/useAppStore', () => ({
  useAppStore: () => ({
    activeTool: 'json',
    setActiveTool: mockSetActiveTool,
  }),
}));

describe('ToolGrid', () => {
  beforeEach(() => {
    mockSetActiveTool.mockClear();
    render(<ToolGrid />);
  });

  describe('Grid Layout', () => {
    it('should render grid container with proper styling', () => {
      const grid = screen.getByRole('grid', { name: /tool selection/i });
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('grid');
    });

    it('should have responsive grid columns', () => {
      const grid = screen.getByRole('grid', { name: /tool selection/i });
      // Should have classes for 1, 2, 3, 4 column layouts
      expect(grid.className).toMatch(/grid-cols-1/);
      expect(grid.className).toMatch(/md:grid-cols-2/);
      expect(grid.className).toMatch(/lg:grid-cols-3/);
      expect(grid.className).toMatch(/xl:grid-cols-4/);
    });
  });

  describe('Tool Cards', () => {
    it('should render all 7 tool cards', () => {
      const cards = screen.getAllByRole('button', { name: /formatter|decoder|converter|encoder|tester|diff|generator/i });
      expect(cards).toHaveLength(7);
    });

    it('should render JSON Formatter card', () => {
      expect(screen.getByRole('button', { name: /json formatter/i })).toBeInTheDocument();
    });

    it('should render JWT Decoder card', () => {
      expect(screen.getByRole('button', { name: /jwt decoder/i })).toBeInTheDocument();
    });

    it('should render Base64 Converter card', () => {
      expect(screen.getByRole('button', { name: /base64 converter/i })).toBeInTheDocument();
    });

    it('should render URL Encoder/Decoder card', () => {
      expect(screen.getByRole('button', { name: /url.*encoder/i })).toBeInTheDocument();
    });

    it('should render Regex Tester card', () => {
      expect(screen.getByRole('button', { name: /regex tester/i })).toBeInTheDocument();
    });

    it('should render Text Diff card', () => {
      expect(screen.getByRole('button', { name: /text diff/i })).toBeInTheDocument();
    });

    it('should render Hash Generator card', () => {
      expect(screen.getByRole('button', { name: /hash generator/i })).toBeInTheDocument();
    });
  });

  describe('Card Content', () => {
    it('should display card title', () => {
      expect(screen.getByText('JSON Formatter')).toBeInTheDocument();
    });

    it('should display card description', () => {
      expect(screen.getByText(/format.*validate.*json/i)).toBeInTheDocument();
    });

    it('should render lucide-react icon', () => {
      const jsonCard = screen.getByRole('button', { name: /json formatter/i });
      const icon = jsonCard.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Card Interactions', () => {
    it('should have hover effect with translate transform', () => {
      const card = screen.getByRole('button', { name: /json formatter/i });
      expect(card.className).toContain('hover:-translate-y-1');
    });

    it('should have hover effect with shadow', () => {
      const card = screen.getByRole('button', { name: /json formatter/i });
      expect(card.className).toContain('hover:shadow-lg');
    });

    it('should call setActiveTool when card is clicked', () => {
      const jwtCard = screen.getByRole('button', { name: /jwt decoder/i });
      fireEvent.click(jwtCard);
      expect(mockSetActiveTool).toHaveBeenCalledWith('jwt');
    });
  });

  describe('Active Tool Selection', () => {
    it('should highlight active tool with ring styling', () => {
      const activeCard = screen.getByRole('button', { name: /json formatter/i });
      expect(activeCard.className).toContain('ring-2');
      expect(activeCard.className).toContain('ring-primary');
    });

    it('should not highlight inactive tools', () => {
      const inactiveCard = screen.getByRole('button', { name: /jwt decoder/i });
      expect(inactiveCard.className).not.toContain('ring-2');
    });
  });

  describe('Search Functionality', () => {
    it('should render search input using Command component', () => {
      const searchInput = screen.getByPlaceholderText(/search tools/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('should filter tools based on search query', () => {
      const searchInput = screen.getByPlaceholderText(/search tools/i);

      fireEvent.change(searchInput, { target: { value: 'json' } });

      expect(screen.getByRole('button', { name: /json formatter/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /jwt decoder/i })).not.toBeInTheDocument();
    });

    it('should search by tool name', () => {
      const searchInput = screen.getByPlaceholderText(/search tools/i);

      fireEvent.change(searchInput, { target: { value: 'hash' } });

      expect(screen.getByRole('button', { name: /hash generator/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /json formatter/i })).not.toBeInTheDocument();
    });

    it('should search by tool description', () => {
      const searchInput = screen.getByPlaceholderText(/search tools/i);

      fireEvent.change(searchInput, { target: { value: 'format' } });

      expect(screen.getByRole('button', { name: /json formatter/i })).toBeInTheDocument();
    });

    it('should show all tools when search is cleared', () => {
      const searchInput = screen.getByPlaceholderText(/search tools/i);

      fireEvent.change(searchInput, { target: { value: 'json' } });
      fireEvent.change(searchInput, { target: { value: '' } });

      const cards = screen.getAllByRole('button', { name: /formatter|decoder|converter|encoder|tester|diff|generator/i });
      expect(cards).toHaveLength(7);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on grid', () => {
      const grid = screen.getByRole('grid', { name: /tool selection/i });
      expect(grid).toHaveAttribute('aria-label', 'Tool Selection Grid');
    });

    it('should support keyboard navigation', () => {
      const firstCard = screen.getByRole('button', { name: /json formatter/i });
      firstCard.focus();
      expect(document.activeElement).toBe(firstCard);
    });
  });
});
