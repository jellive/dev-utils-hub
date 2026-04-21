import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResponseHeaders } from '../ResponseHeaders';

describe('ResponseHeaders', () => {
  const headers = {
    'content-type': 'application/json',
    'content-length': '1024',
    'cache-control': 'no-cache',
  };

  it('should render all headers as a table', () => {
    render(<ResponseHeaders headers={headers} />);

    expect(screen.getByText('content-type')).toBeInTheDocument();
    expect(screen.getByText('application/json')).toBeInTheDocument();
    expect(screen.getByText('content-length')).toBeInTheDocument();
    expect(screen.getByText('1024')).toBeInTheDocument();
  });

  it('should handle empty headers', () => {
    render(<ResponseHeaders headers={{}} />);

    expect(screen.getByText(/no headers/i)).toBeInTheDocument();
  });

  it('should display header count', () => {
    render(<ResponseHeaders headers={headers} />);

    expect(screen.getByText(/3/)).toBeInTheDocument();
  });
});
