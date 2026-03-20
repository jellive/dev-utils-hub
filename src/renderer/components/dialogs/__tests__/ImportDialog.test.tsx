import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImportDialog } from '../ImportDialog';

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  onImport: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ImportDialog', () => {
  describe('rendering', () => {
    it('renders dialog title when open', () => {
      render(<ImportDialog {...defaultProps} />);
      expect(screen.getByText('히스토리 가져오기')).toBeInTheDocument();
    });

    it('renders custom title when provided', () => {
      render(<ImportDialog {...defaultProps} title="My Import" />);
      expect(screen.getByText('My Import')).toBeInTheDocument();
    });

    it('renders import and cancel buttons', () => {
      render(<ImportDialog {...defaultProps} />);
      expect(screen.getByRole('button', { name: /가져오기/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /취소/i })).toBeInTheDocument();
    });

    it('does not render content when closed', () => {
      render(<ImportDialog {...defaultProps} open={false} />);
      expect(screen.queryByText('히스토리 가져오기')).not.toBeInTheDocument();
    });

    it('renders skip duplicates and replace existing checkboxes', () => {
      render(<ImportDialog {...defaultProps} />);
      expect(screen.getByText('중복 항목 건너뛰기')).toBeInTheDocument();
      expect(screen.getByText('기존 데이터 교체')).toBeInTheDocument();
    });
  });

  describe('default behavior', () => {
    it('calls onImport with skipDuplicates=true replaceExisting=false by default', () => {
      render(<ImportDialog {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /가져오기/i }));
      expect(defaultProps.onImport).toHaveBeenCalledWith({
        skipDuplicates: true,
        replaceExisting: false,
      });
    });

    it('calls onOpenChange(false) after import', () => {
      render(<ImportDialog {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /가져오기/i }));
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('cancel button', () => {
    it('calls onOpenChange(false) and does not call onImport', () => {
      render(<ImportDialog {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /취소/i }));
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
      expect(defaultProps.onImport).not.toHaveBeenCalled();
    });
  });

  describe('checkbox interactions', () => {
    it('shows warning alert when replace existing is checked', () => {
      render(<ImportDialog {...defaultProps} />);
      // Find and check the replace existing checkbox
      const checkboxes = screen.getAllByRole('checkbox');
      // replaceExisting is the second checkbox
      fireEvent.click(checkboxes[1]);
      expect(screen.getByText(/경고/)).toBeInTheDocument();
    });

    it('shows info alert when both checkboxes are unchecked', () => {
      render(<ImportDialog {...defaultProps} />);
      // Uncheck skip duplicates (first checkbox, checked by default)
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      // Now both are unchecked — info alert should show
      expect(screen.getByText(/중복 항목도 포함하여 모두 가져옵니다/)).toBeInTheDocument();
    });

    it('calls onImport with replaceExisting=true when checked', () => {
      render(<ImportDialog {...defaultProps} />);
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // check replaceExisting
      fireEvent.click(screen.getByRole('button', { name: /가져오기/i }));
      expect(defaultProps.onImport).toHaveBeenCalledWith(
        expect.objectContaining({ replaceExisting: true })
      );
    });
  });
});
