import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { APIKeyAuth } from '../APIKeyAuth';

describe('APIKeyAuth', () => {
  it('should render API key input field', () => {
    render(<APIKeyAuth onChange={vi.fn()} />);

    expect(screen.getByPlaceholderText(/enter api key/i)).toBeInTheDocument();
  });

  it('should render key name input field', () => {
    render(<APIKeyAuth onChange={vi.fn()} />);

    expect(screen.getByPlaceholderText(/header name/i)).toBeInTheDocument();
  });

  it('should have default key name as X-API-Key', () => {
    render(<APIKeyAuth onChange={vi.fn()} />);

    const keyNameInput = screen.getByPlaceholderText(/header name/i) as HTMLInputElement;
    expect(keyNameInput.value).toBe('X-API-Key');
  });

  it('should render placement radio buttons', () => {
    render(<APIKeyAuth onChange={vi.fn()} />);

    expect(screen.getByLabelText(/header/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/query parameter/i)).toBeInTheDocument();
  });

  it('should have header placement selected by default', () => {
    render(<APIKeyAuth onChange={vi.fn()} />);

    const headerRadio = screen.getByLabelText(/header/i) as HTMLInputElement;
    expect(headerRadio).toBeChecked();
  });

  it('should call onChange when API key is entered', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<APIKeyAuth onChange={handleChange} />);

    const apiKeyInput = screen.getByPlaceholderText(/enter api key/i);
    await user.type(apiKeyInput, 'test-api-key-123');

    expect(handleChange).toHaveBeenCalled();
    expect(handleChange).toHaveBeenCalledWith({
      key: 'test-api-key-123',
      keyName: 'X-API-Key',
      placement: 'header',
    });
  });

  it('should call onChange when key name is changed', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<APIKeyAuth onChange={handleChange} />);

    const apiKeyInput = screen.getByPlaceholderText(/enter api key/i);
    const keyNameInput = screen.getByPlaceholderText(/header name/i);

    await user.type(apiKeyInput, 'my-key');
    await user.clear(keyNameInput);
    await user.type(keyNameInput, 'Authorization');

    expect(handleChange).toHaveBeenCalledWith({
      key: 'my-key',
      keyName: 'Authorization',
      placement: 'header',
    });
  });

  it('should update placement when radio button is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<APIKeyAuth onChange={handleChange} />);

    const apiKeyInput = screen.getByPlaceholderText(/enter api key/i);
    await user.type(apiKeyInput, 'test-key');

    const queryRadio = screen.getByLabelText(/query parameter/i);
    await user.click(queryRadio);

    expect(handleChange).toHaveBeenCalledWith({
      key: 'test-key',
      keyName: 'X-API-Key',
      placement: 'query',
    });
  });

  it('should show clear button when API key is entered', async () => {
    const user = userEvent.setup();
    render(<APIKeyAuth onChange={vi.fn()} />);

    const apiKeyInput = screen.getByPlaceholderText(/enter api key/i);
    await user.type(apiKeyInput, 'test-key');

    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('should clear API key when clear button is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<APIKeyAuth onChange={handleChange} />);

    const apiKeyInput = screen.getByPlaceholderText(/enter api key/i);
    await user.type(apiKeyInput, 'test-key');

    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    expect(apiKeyInput).toHaveValue('');
    expect(handleChange).toHaveBeenCalledWith(null);
  });

  it('should show example preview when API key is entered', async () => {
    const user = userEvent.setup();
    render(<APIKeyAuth onChange={vi.fn()} />);

    const apiKeyInput = screen.getByPlaceholderText(/enter api key/i);
    await user.type(apiKeyInput, 'abc123');

    expect(screen.getByText(/example/i)).toBeInTheDocument();
    expect(screen.getByText(/X-API-Key: abc123/i)).toBeInTheDocument();
  });

  it('should update example when placement is changed to query', async () => {
    const user = userEvent.setup();
    render(<APIKeyAuth onChange={vi.fn()} />);

    const apiKeyInput = screen.getByPlaceholderText(/enter api key/i);
    await user.type(apiKeyInput, 'abc123');

    const queryRadio = screen.getByLabelText(/query parameter/i);
    await user.click(queryRadio);

    expect(screen.getByText(/\?X-API-Key=abc123/i)).toBeInTheDocument();
  });

  it('should have proper accessibility labels', () => {
    render(<APIKeyAuth onChange={vi.fn()} />);

    const apiKeyInput = screen.getByPlaceholderText(/enter api key/i);
    const keyNameInput = screen.getByPlaceholderText(/header name/i);

    expect(apiKeyInput).toHaveAttribute('type', 'text');
    expect(keyNameInput).toHaveAttribute('type', 'text');
  });
});
