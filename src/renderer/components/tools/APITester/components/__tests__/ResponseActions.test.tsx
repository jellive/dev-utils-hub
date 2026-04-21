import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResponseActions } from '../ResponseActions';

describe('ResponseActions', () => {
  const jsonBody = '{"message": "success"}';
  const textBody = 'Plain text';

  it('should render copy button', () => {
    render(<ResponseActions body={jsonBody} contentType="application/json" />);

    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('should render download button', () => {
    render(<ResponseActions body={jsonBody} contentType="application/json" />);

    expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
  });

  it('should show Open in JSON Formatter button for JSON content', () => {
    render(<ResponseActions body={jsonBody} contentType="application/json" />);

    expect(screen.getByRole('button', { name: /json formatter/i })).toBeInTheDocument();
  });

  it('should not show JSON Formatter button for non-JSON content', () => {
    render(<ResponseActions body={textBody} contentType="text/plain" />);

    expect(screen.queryByRole('button', { name: /json formatter/i })).not.toBeInTheDocument();
  });

  it('should call onCopy when copy button is clicked', async () => {
    const user = userEvent.setup();
    const handleCopy = vi.fn();
    render(<ResponseActions body={jsonBody} contentType="application/json" onCopy={handleCopy} />);

    const copyButton = screen.getByRole('button', { name: /copy/i });
    await user.click(copyButton);

    expect(handleCopy).toHaveBeenCalledWith(jsonBody);
  });

  it('should call onDownload when download button is clicked', async () => {
    const user = userEvent.setup();
    const handleDownload = vi.fn();
    render(<ResponseActions body={jsonBody} contentType="application/json" onDownload={handleDownload} />);

    const downloadButton = screen.getByRole('button', { name: /download/i });
    await user.click(downloadButton);

    expect(handleDownload).toHaveBeenCalledWith(jsonBody, 'application/json');
  });
});
