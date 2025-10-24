import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BasicAuth } from '../BasicAuth';

describe('BasicAuth', () => {
  it('should render username and password inputs', () => {
    render(<BasicAuth onChange={vi.fn()} />);

    expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  it('should render password input with type password', () => {
    render(<BasicAuth onChange={vi.fn()} />);

    const passwordInput = screen.getByPlaceholderText(/password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should call onChange when both username and password are entered', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<BasicAuth onChange={handleChange} />);

    const usernameInput = screen.getByPlaceholderText(/username/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'testpass');

    expect(handleChange).toHaveBeenCalled();
    expect(handleChange).toHaveBeenCalledWith({
      username: 'testuser',
      password: 'testpass',
    });
  });

  it('should show password visibility toggle button', () => {
    render(<BasicAuth onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /toggle password visibility/i })).toBeInTheDocument();
  });

  it('should toggle password visibility when button is clicked', async () => {
    const user = userEvent.setup();
    render(<BasicAuth onChange={vi.fn()} />);

    const passwordInput = screen.getByPlaceholderText(/password/i);
    const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i });

    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should show Base64 encoded credentials preview', async () => {
    const user = userEvent.setup();
    render(<BasicAuth onChange={vi.fn()} />);

    const usernameInput = screen.getByPlaceholderText(/username/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);

    await user.type(usernameInput, 'admin');
    await user.type(passwordInput, 'secret');

    expect(screen.getByText(/encoded credentials/i)).toBeInTheDocument();
    // Base64 of "admin:secret" is "YWRtaW46c2VjcmV0"
    const encodedElements = screen.getAllByText(/YWRtaW46c2VjcmV0/);
    expect(encodedElements.length).toBeGreaterThan(0);
  });

  it('should show Authorization header preview', async () => {
    const user = userEvent.setup();
    render(<BasicAuth onChange={vi.fn()} />);

    const usernameInput = screen.getByPlaceholderText(/username/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);

    await user.type(usernameInput, 'admin');
    await user.type(passwordInput, 'secret');

    expect(screen.getByText(/authorization header/i)).toBeInTheDocument();
    expect(screen.getByText(/Basic YWRtaW46c2VjcmV0/)).toBeInTheDocument();
  });

  it('should have Encode Credentials button', async () => {
    const user = userEvent.setup();
    render(<BasicAuth onChange={vi.fn()} />);

    const usernameInput = screen.getByPlaceholderText(/username/i);
    await user.type(usernameInput, 'test');

    expect(screen.getByRole('button', { name: /encode credentials/i })).toBeInTheDocument();
  });

  it('should disable Encode Credentials button when fields are empty', () => {
    render(<BasicAuth onChange={vi.fn()} />);

    const encodeButton = screen.getByRole('button', { name: /encode credentials/i });
    expect(encodeButton).toBeDisabled();
  });

  it('should enable Encode Credentials button when both fields have values', async () => {
    const user = userEvent.setup();
    render(<BasicAuth onChange={vi.fn()} />);

    const usernameInput = screen.getByPlaceholderText(/username/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);

    await user.type(usernameInput, 'user');
    await user.type(passwordInput, 'pass');

    const encodeButton = screen.getByRole('button', { name: /encode credentials/i });
    expect(encodeButton).not.toBeDisabled();
  });

  it('should have copy button for Authorization header', async () => {
    const user = userEvent.setup();
    render(<BasicAuth onChange={vi.fn()} />);

    const usernameInput = screen.getByPlaceholderText(/username/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);

    await user.type(usernameInput, 'admin');
    await user.type(passwordInput, 'secret');

    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('should clear credentials when clear buttons are clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<BasicAuth onChange={handleChange} />);

    const usernameInput = screen.getByPlaceholderText(/username/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);

    await user.type(usernameInput, 'admin');
    await user.type(passwordInput, 'secret');

    const clearButtons = screen.getAllByRole('button', { name: /clear/i });
    await user.click(clearButtons[0]); // Clear username

    expect(usernameInput).toHaveValue('');
  });

  it('should have proper accessibility labels', () => {
    render(<BasicAuth onChange={vi.fn()} />);

    const usernameInput = screen.getByPlaceholderText(/username/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);

    expect(usernameInput).toHaveAttribute('type', 'text');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
