import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BodyEditor } from '../BodyEditor';

describe('BodyEditor', () => {
  it('should render textarea for JSON input', () => {
    render(<BodyEditor value="" onChange={vi.fn()} />);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should display current value', () => {
    const value = '{"test": "value"}';
    render(<BodyEditor value={value} onChange={vi.fn()} />);

    expect(screen.getByRole('textbox')).toHaveValue(value);
  });

  it('should call onChange when value changes', () => {
    const handleChange = vi.fn();
    render(<BodyEditor value="" onChange={handleChange} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'test' } });

    expect(handleChange).toHaveBeenCalled();
  });

  it('should show format button', () => {
    render(<BodyEditor value="" onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /format/i })).toBeInTheDocument();
  });

  it('should format valid JSON when format button is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const unformatted = '{"test":"value","nested":{"key":"val"}}';
    render(<BodyEditor value={unformatted} onChange={handleChange} />);

    const formatButton = screen.getByRole('button', { name: /format/i });
    await user.click(formatButton);

    const formatted = JSON.stringify(JSON.parse(unformatted), null, 2);
    expect(handleChange).toHaveBeenCalledWith(formatted);
  });

  it('should show validation error for invalid JSON', async () => {
    const user = userEvent.setup();
    render(<BodyEditor value="invalid" onChange={vi.fn()} />);

    const formatButton = screen.getByRole('button', { name: /format/i });
    await user.click(formatButton);

    expect(screen.getByText(/invalid json/i)).toBeInTheDocument();
  });

  it('should clear error when valid JSON is entered', () => {
    const handleChange = vi.fn();
    render(<BodyEditor value="invalid" onChange={handleChange} />);

    // Try to format invalid JSON
    const formatButton = screen.getByRole('button', { name: /format/i });
    fireEvent.click(formatButton);

    expect(screen.getByText(/invalid json/i)).toBeInTheDocument();

    // Change to valid JSON
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: '{"test": "value"}' } });

    // Error should be cleared when typing
    expect(screen.queryByText(/invalid json/i)).not.toBeInTheDocument();
  });

  it('should handle empty input gracefully', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<BodyEditor value="" onChange={handleChange} />);

    const formatButton = screen.getByRole('button', { name: /format/i });
    await user.click(formatButton);

    // Should not show error for empty input
    expect(screen.queryByText(/invalid json/i)).not.toBeInTheDocument();
  });

  it('should have placeholder text', () => {
    render(<BodyEditor value="" onChange={vi.fn()} />);

    expect(screen.getByPlaceholderText(/enter request body/i)).toBeInTheDocument();
  });

  describe('Body Type Switching', () => {
    it('should show body type selector', () => {
      render(<BodyEditor value="" onChange={vi.fn()} />);

      expect(screen.getByRole('combobox', { name: /body type/i })).toBeInTheDocument();
    });

    it('should default to JSON type', () => {
      render(<BodyEditor value="" onChange={vi.fn()} />);

      const selector = screen.getByRole('combobox', { name: /body type/i });
      expect(selector).toHaveValue('json');
    });

    it('should switch to Text type', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<BodyEditor value="" onChange={handleChange} />);

      const selector = screen.getByRole('combobox', { name: /body type/i });
      await user.selectOptions(selector, 'text');

      expect(selector).toHaveValue('text');
    });

    it('should not show format button for Text type', async () => {
      const user = userEvent.setup();
      render(<BodyEditor value="" onChange={vi.fn()} />);

      const selector = screen.getByRole('combobox', { name: /body type/i });
      await user.selectOptions(selector, 'text');

      expect(screen.queryByRole('button', { name: /format/i })).not.toBeInTheDocument();
    });

    it('should show format button for JSON type', () => {
      render(<BodyEditor value="" onChange={vi.fn()} />);

      expect(screen.getByRole('button', { name: /format/i })).toBeInTheDocument();
    });
  });

  describe('JSON Templates', () => {
    it('should show template selector for JSON type', () => {
      render(<BodyEditor value="" onChange={vi.fn()} />);

      expect(screen.getByRole('combobox', { name: /template/i })).toBeInTheDocument();
    });

    it('should not show template selector for Text type', async () => {
      const user = userEvent.setup();
      render(<BodyEditor value="" onChange={vi.fn()} />);

      const typeSelector = screen.getByRole('combobox', { name: /body type/i });
      await user.selectOptions(typeSelector, 'text');

      expect(screen.queryByRole('combobox', { name: /template/i })).not.toBeInTheDocument();
    });

    it('should apply user object template', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<BodyEditor value="" onChange={handleChange} />);

      const templateSelector = screen.getByRole('combobox', { name: /template/i });
      await user.selectOptions(templateSelector, 'user');

      expect(handleChange).toHaveBeenCalledWith(expect.stringContaining('"name"'));
      expect(handleChange).toHaveBeenCalledWith(expect.stringContaining('"email"'));
    });

    it('should apply array template', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<BodyEditor value="" onChange={handleChange} />);

      const templateSelector = screen.getByRole('combobox', { name: /template/i });
      await user.selectOptions(templateSelector, 'array');

      const call = handleChange.mock.calls[0][0];
      expect(call).toMatch(/^\[/);
      expect(call).toMatch(/\]$/);
    });

    it('should apply nested object template', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<BodyEditor value="" onChange={handleChange} />);

      const templateSelector = screen.getByRole('combobox', { name: /template/i });
      await user.selectOptions(templateSelector, 'nested');

      expect(handleChange).toHaveBeenCalledWith(expect.stringContaining('{'));
      // Verify it's a valid JSON that can be parsed
      const call = handleChange.mock.calls[0][0];
      expect(() => JSON.parse(call)).not.toThrow();
    });
  });
});
