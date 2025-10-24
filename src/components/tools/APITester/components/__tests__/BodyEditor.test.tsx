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
});
