import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResponseBody } from '../ResponseBody';

describe('ResponseBody', () => {
  const jsonBody = '{"message": "success", "data": {"id": 1, "name": "Test"}}';
  const textBody = 'Plain text response';
  const emptyBody = '';

  it('should render JSON body with syntax highlighting', () => {
    render(<ResponseBody body={jsonBody} contentType="application/json" />);

    expect(screen.getByText(/success/i)).toBeInTheDocument();
  });

  it('should render plain text body', () => {
    render(<ResponseBody body={textBody} contentType="text/plain" />);

    expect(screen.getByText(/Plain text response/i)).toBeInTheDocument();
  });

  it('should handle empty body', () => {
    render(<ResponseBody body={emptyBody} contentType="application/json" />);

    expect(screen.getByText(/no body content/i)).toBeInTheDocument();
  });

  it('should show formatted view toggle for JSON', () => {
    render(<ResponseBody body={jsonBody} contentType="application/json" />);

    expect(screen.getByRole('button', { name: /formatted/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /raw/i })).toBeInTheDocument();
  });

  it('should toggle between formatted and raw view', async () => {
    const user = userEvent.setup();
    render(<ResponseBody body={jsonBody} contentType="application/json" />);

    const rawButton = screen.getByRole('button', { name: /raw/i });
    await user.click(rawButton);

    // In raw mode, the JSON should not be prettified
    expect(screen.getByText(jsonBody)).toBeInTheDocument();
  });

  it('should display copy button', () => {
    render(<ResponseBody body={jsonBody} contentType="application/json" />);

    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('should detect JSON content type', () => {
    render(<ResponseBody body={jsonBody} contentType="application/json" />);

    // Should show formatted JSON by default
    expect(screen.getByRole('button', { name: /formatted/i })).toBeInTheDocument();
  });

  it('should handle malformed JSON gracefully', () => {
    const malformedJson = '{"invalid": json}';
    render(<ResponseBody body={malformedJson} contentType="application/json" />);

    // Should still render the text
    expect(screen.getByText(/invalid/i)).toBeInTheDocument();
  });

  it('should render with monospace font', () => {
    const { container } = render(<ResponseBody body={textBody} contentType="text/plain" />);

    const pre = container.querySelector('pre');
    expect(pre).toHaveClass('font-mono');
  });

  it('should support different content types', () => {
    const { rerender } = render(<ResponseBody body={jsonBody} contentType="application/json" />);
    expect(screen.getByRole('button', { name: /formatted/i })).toBeInTheDocument();

    rerender(<ResponseBody body={textBody} contentType="text/plain" />);
    expect(screen.queryByRole('button', { name: /formatted/i })).not.toBeInTheDocument();
  });
});
