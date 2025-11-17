import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResponseMetadata } from '../ResponseMetadata';

describe('ResponseMetadata', () => {
  it('should render status code with badge', () => {
    render(<ResponseMetadata status={200} time={150} size={1024} />);

    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('should display green badge for 2xx status codes', () => {
    render(<ResponseMetadata status={200} time={150} size={1024} />);

    const badge = screen.getByText('200').closest('.badge');
    expect(badge).toHaveClass('bg-green-500');
  });

  it('should display blue badge for 3xx status codes', () => {
    render(<ResponseMetadata status={301} time={150} size={1024} />);

    const badge = screen.getByText('301').closest('.badge');
    expect(badge).toHaveClass('bg-blue-500');
  });

  it('should display yellow badge for 4xx status codes', () => {
    render(<ResponseMetadata status={404} time={150} size={1024} />);

    const badge = screen.getByText('404').closest('.badge');
    expect(badge).toHaveClass('bg-yellow-500');
  });

  it('should display red badge for 5xx status codes', () => {
    render(<ResponseMetadata status={500} time={150} size={1024} />);

    const badge = screen.getByText('500').closest('.badge');
    expect(badge).toHaveClass('bg-red-500');
  });

  it('should display response time in milliseconds', () => {
    render(<ResponseMetadata status={200} time={150} size={1024} />);

    expect(screen.getByText(/150\s*ms/i)).toBeInTheDocument();
  });

  it('should display response time with decimal precision', () => {
    render(<ResponseMetadata status={200} time={150.56} size={1024} />);

    expect(screen.getByText(/150\.56\s*ms/i)).toBeInTheDocument();
  });

  it('should display size in bytes for small responses', () => {
    render(<ResponseMetadata status={200} time={150} size={512} />);

    expect(screen.getByText(/512\s*B/i)).toBeInTheDocument();
  });

  it('should display size in KB for medium responses', () => {
    render(<ResponseMetadata status={200} time={150} size={2048} />);

    expect(screen.getByText(/2\.00\s*KB/i)).toBeInTheDocument();
  });

  it('should display size in MB for large responses', () => {
    render(<ResponseMetadata status={200} time={150} size={2097152} />);

    expect(screen.getByText(/2\.00\s*MB/i)).toBeInTheDocument();
  });

  it('should handle zero time', () => {
    render(<ResponseMetadata status={200} time={0} size={1024} />);

    expect(screen.getByText(/0\s*ms/i)).toBeInTheDocument();
  });

  it('should handle zero size', () => {
    render(<ResponseMetadata status={200} time={150} size={0} />);

    expect(screen.getByText(/0\s*B/i)).toBeInTheDocument();
  });

  it('should render all three metrics together', () => {
    render(<ResponseMetadata status={200} time={150} size={1024} />);

    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText(/150\s*ms/i)).toBeInTheDocument();
    expect(screen.getByText(/1\.00\s*KB/i)).toBeInTheDocument();
  });

  it('should have accessible structure', () => {
    const { container } = render(<ResponseMetadata status={200} time={150} size={1024} />);

    expect(container.querySelector('[role="status"]')).toBeInTheDocument();
  });
});
