import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportDialog } from '../ExportDialog';

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  onExport: vi.fn(),
  totalCount: 100,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ExportDialog', () => {
  describe('rendering', () => {
    it('renders dialog title when open', () => {
      render(<ExportDialog {...defaultProps} />);
      expect(screen.getByText('히스토리 내보내기')).toBeInTheDocument();
    });

    it('renders custom title when provided', () => {
      render(<ExportDialog {...defaultProps} title="Custom Export Title" />);
      expect(screen.getByText('Custom Export Title')).toBeInTheDocument();
    });

    it('renders custom description when provided', () => {
      render(<ExportDialog {...defaultProps} description="My description" />);
      expect(screen.getByText('My description')).toBeInTheDocument();
    });

    it('renders export and cancel buttons', () => {
      render(<ExportDialog {...defaultProps} />);
      expect(screen.getByRole('button', { name: /내보내기/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /취소/i })).toBeInTheDocument();
    });

    it('does not render content when closed', () => {
      render(<ExportDialog {...defaultProps} open={false} />);
      expect(screen.queryByText('히스토리 내보내기')).not.toBeInTheDocument();
    });
  });

  describe('export with count preset all (default)', () => {
    it('calls onExport with count=all when preset is all', () => {
      render(<ExportDialog {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /내보내기/i }));
      expect(defaultProps.onExport).toHaveBeenCalledWith(
        expect.objectContaining({ count: 'all' })
      );
    });

    it('calls onOpenChange(false) after export', () => {
      render(<ExportDialog {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /내보내기/i }));
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });

    it('calls onExport with json format by default', () => {
      render(<ExportDialog {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /내보내기/i }));
      expect(defaultProps.onExport).toHaveBeenCalledWith(
        expect.objectContaining({ format: 'json' })
      );
    });

    it('calls onExport with includeMetadata=true by default', () => {
      render(<ExportDialog {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /내보내기/i }));
      expect(defaultProps.onExport).toHaveBeenCalledWith(
        expect.objectContaining({ includeMetadata: true })
      );
    });
  });

  describe('cancel button', () => {
    it('calls onOpenChange(false) when cancel is clicked', () => {
      render(<ExportDialog {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /취소/i }));
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
      expect(defaultProps.onExport).not.toHaveBeenCalled();
    });
  });

  describe('totalCount display', () => {
    it('shows totalCount in the select options', () => {
      render(<ExportDialog {...defaultProps} totalCount={42} />);
      expect(screen.getByText(/42개/)).toBeInTheDocument();
    });
  });
});
