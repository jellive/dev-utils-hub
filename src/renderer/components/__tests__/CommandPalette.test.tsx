import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CommandPalette } from '../CommandPalette';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderPalette(isOpen = true) {
  const onClose = vi.fn();
  render(
    <MemoryRouter>
      <CommandPalette isOpen={isOpen} onClose={onClose} />
    </MemoryRouter>
  );
  return { onClose };
}

describe('CommandPalette', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  describe('Render', () => {
    it('renders nothing when closed', () => {
      renderPalette(false);
      expect(screen.queryByTestId('command-palette')).not.toBeInTheDocument();
    });

    it('renders the dialog when open', () => {
      renderPalette();
      expect(screen.getByTestId('command-palette')).toBeInTheDocument();
    });

    it('renders the search input', () => {
      renderPalette();
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    it('renders all 13 tools by default', () => {
      renderPalette();
      const items = screen.getAllByRole('option');
      expect(items).toHaveLength(13);
    });

    it('first item is selected by default', () => {
      renderPalette();
      const items = screen.getAllByRole('option');
      expect(items[0]).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Search filtering', () => {
    it('filters tools by name', () => {
      renderPalette();
      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'json' } });
      const items = screen.getAllByRole('option');
      // JSON Formatter should match
      expect(items.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByTestId('palette-item-json')).toBeInTheDocument();
    });

    it('shows no results message when nothing matches', () => {
      renderPalette();
      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'zzznomatch' } });
      expect(screen.queryAllByRole('option')).toHaveLength(0);
      expect(screen.getByText('No tools found')).toBeInTheDocument();
    });

    it('resets selection to 0 when query changes', () => {
      renderPalette();
      const input = screen.getByRole('searchbox');
      // Move selection down first
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      // Now filter — selection should reset
      fireEvent.change(input, { target: { value: 'hash' } });
      const items = screen.getAllByRole('option');
      expect(items[0]).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Keyboard navigation', () => {
    it('ArrowDown moves selection down', () => {
      renderPalette();
      const input = screen.getByRole('searchbox');
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      const items = screen.getAllByRole('option');
      expect(items[0]).toHaveAttribute('aria-selected', 'false');
      expect(items[1]).toHaveAttribute('aria-selected', 'true');
    });

    it('ArrowUp moves selection up (clamps at 0)', () => {
      renderPalette();
      const input = screen.getByRole('searchbox');
      // Already at 0, ArrowUp should stay at 0
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      const items = screen.getAllByRole('option');
      expect(items[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('ArrowDown + ArrowUp returns to first item', () => {
      renderPalette();
      const input = screen.getByRole('searchbox');
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      const items = screen.getAllByRole('option');
      expect(items[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('Enter navigates to selected tool', () => {
      renderPalette();
      const input = screen.getByRole('searchbox');
      // First item is json
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(mockNavigate).toHaveBeenCalledWith('/json');
    });

    it('Escape calls onClose', () => {
      const { onClose } = renderPalette();
      const input = screen.getByRole('searchbox');
      fireEvent.keyDown(input, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  describe('Mouse interaction', () => {
    it('clicking a tool item navigates to it', () => {
      renderPalette();
      const jwtItem = screen.getByTestId('palette-item-jwt');
      fireEvent.click(jwtItem);
      expect(mockNavigate).toHaveBeenCalledWith('/jwt');
    });

    it('clicking the backdrop calls onClose', () => {
      const { onClose } = renderPalette();
      const dialog = screen.getByTestId('command-palette');
      fireEvent.click(dialog);
      expect(onClose).toHaveBeenCalledOnce();
    });
  });
});
