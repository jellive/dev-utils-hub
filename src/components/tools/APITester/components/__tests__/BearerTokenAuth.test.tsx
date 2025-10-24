import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BearerTokenAuth } from '../BearerTokenAuth';

describe('BearerTokenAuth', () => {
  it('should render token input field', () => {
    render(<BearerTokenAuth onChange={vi.fn()} />);

    expect(screen.getByPlaceholderText(/enter bearer token/i)).toBeInTheDocument();
  });

  it('should call onChange when token is entered', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<BearerTokenAuth onChange={handleChange} />);

    const input = screen.getByPlaceholderText(/enter bearer token/i);
    await user.type(input, 'test-token');

    expect(handleChange).toHaveBeenCalled();
    expect(handleChange).toHaveBeenCalledWith('test-token');
  });

  it('should validate JWT format for valid token', async () => {
    const user = userEvent.setup();
    render(<BearerTokenAuth onChange={vi.fn()} />);

    const input = screen.getByPlaceholderText(/enter bearer token/i);
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

    await user.type(input, validToken);

    // Should not show error for valid JWT format
    expect(screen.queryByText(/invalid token format/i)).not.toBeInTheDocument();
  });

  it('should show error for invalid JWT format', async () => {
    const user = userEvent.setup();
    render(<BearerTokenAuth onChange={vi.fn()} />);

    const input = screen.getByPlaceholderText(/enter bearer token/i);
    await user.type(input, 'invalid-token');
    await user.tab(); // Trigger blur for validation

    expect(screen.getByText(/invalid token format/i)).toBeInTheDocument();
  });

  it('should render Decode Token button', () => {
    render(<BearerTokenAuth onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /decode token/i })).toBeInTheDocument();
  });

  it('should disable Decode Token button when no token', () => {
    render(<BearerTokenAuth onChange={vi.fn()} />);

    const decodeButton = screen.getByRole('button', { name: /decode token/i });
    expect(decodeButton).toBeDisabled();
  });

  it('should enable Decode Token button with valid token', async () => {
    const user = userEvent.setup();
    render(<BearerTokenAuth onChange={vi.fn()} />);

    const input = screen.getByPlaceholderText(/enter bearer token/i);
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.test';
    await user.type(input, validToken);

    const decodeButton = screen.getByRole('button', { name: /decode token/i });
    expect(decodeButton).not.toBeDisabled();
  });

  it('should show generated Authorization header preview', async () => {
    const user = userEvent.setup();
    render(<BearerTokenAuth onChange={vi.fn()} />);

    const input = screen.getByPlaceholderText(/enter bearer token/i);
    await user.type(input, 'test-token');

    expect(screen.getByText(/authorization header/i)).toBeInTheDocument();
    expect(screen.getByText(/Bearer test-token/)).toBeInTheDocument();
  });

  it('should have copy to clipboard button for header', async () => {
    const user = userEvent.setup();
    render(<BearerTokenAuth onChange={vi.fn()} />);

    const input = screen.getByPlaceholderText(/enter bearer token/i);
    await user.type(input, 'test-token');

    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('should clear token when clear button is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<BearerTokenAuth onChange={handleChange} />);

    const input = screen.getByPlaceholderText(/enter bearer token/i);
    await user.type(input, 'test-token');

    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    expect(input).toHaveValue('');
    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('should have proper accessibility labels', () => {
    render(<BearerTokenAuth onChange={vi.fn()} />);

    const input = screen.getByPlaceholderText(/enter bearer token/i);
    expect(input).toHaveAttribute('type', 'text');

    const decodeButton = screen.getByRole('button', { name: /decode token/i });
    expect(decodeButton).toBeInTheDocument();
  });
});
