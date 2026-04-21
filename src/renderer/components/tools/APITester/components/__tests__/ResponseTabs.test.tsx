import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResponseTabs } from '../ResponseTabs';
import type { ResponseData } from '../../types';

describe('ResponseTabs', () => {
  const mockResponse: ResponseData = {
    status: 200,
    statusText: 'OK',
    body: '{"message": "success"}',
    headers: {
      'content-type': 'application/json',
      'content-length': '25',
    },
    time: 150,
    size: 25,
  };

  it('should render Body and Headers tabs', () => {
    render(<ResponseTabs response={mockResponse} />);

    expect(screen.getByRole('tab', { name: /body/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /headers/i })).toBeInTheDocument();
  });

  it('should show Body tab as default active', () => {
    render(<ResponseTabs response={mockResponse} />);

    const bodyTab = screen.getByRole('tab', { name: /body/i });
    expect(bodyTab).toHaveAttribute('aria-selected', 'true');
  });

  it('should display body content when Body tab is active', () => {
    render(<ResponseTabs response={mockResponse} />);

    expect(screen.getByText(/success/i)).toBeInTheDocument();
  });

  it('should switch to Headers tab when clicked', async () => {
    const user = userEvent.setup();
    render(<ResponseTabs response={mockResponse} />);

    const headersTab = screen.getByRole('tab', { name: /headers/i });
    await user.click(headersTab);

    expect(headersTab).toHaveAttribute('aria-selected', 'true');
  });

  it('should display headers content when Headers tab is active', async () => {
    const user = userEvent.setup();
    render(<ResponseTabs response={mockResponse} />);

    const headersTab = screen.getByRole('tab', { name: /headers/i });
    await user.click(headersTab);

    expect(screen.getByText(/content-type/i)).toBeInTheDocument();
    expect(screen.getByText(/application\/json/i)).toBeInTheDocument();
  });

  it('should show header count badge', () => {
    render(<ResponseTabs response={mockResponse} />);

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should handle empty body', () => {
    const emptyBodyResponse: ResponseData = { ...mockResponse, body: '' };
    render(<ResponseTabs response={emptyBodyResponse} />);

    expect(screen.getByRole('tab', { name: /body/i })).toBeInTheDocument();
  });

  it('should handle empty headers', () => {
    const emptyHeadersResponse: ResponseData = { ...mockResponse, headers: {} };
    render(<ResponseTabs response={emptyHeadersResponse} />);

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should support keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<ResponseTabs response={mockResponse} />);

    const bodyTab = screen.getByRole('tab', { name: /body/i });
    bodyTab.focus();

    await user.keyboard('{ArrowRight}');

    const headersTab = screen.getByRole('tab', { name: /headers/i });
    expect(headersTab).toHaveAttribute('aria-selected', 'true');
  });

  it('should call onTabChange when tab switches', async () => {
    const user = userEvent.setup();
    const handleTabChange = vi.fn();
    render(<ResponseTabs response={mockResponse} onTabChange={handleTabChange} />);

    const headersTab = screen.getByRole('tab', { name: /headers/i });
    await user.click(headersTab);

    expect(handleTabChange).toHaveBeenCalledWith('headers');
  });

  it('should maintain tab state when switching between tabs multiple times', async () => {
    const user = userEvent.setup();
    render(<ResponseTabs response={mockResponse} />);

    const bodyTab = screen.getByRole('tab', { name: /body/i });
    const headersTab = screen.getByRole('tab', { name: /headers/i });

    await user.click(headersTab);
    expect(headersTab).toHaveAttribute('aria-selected', 'true');

    await user.click(bodyTab);
    expect(bodyTab).toHaveAttribute('aria-selected', 'true');

    await user.click(headersTab);
    expect(headersTab).toHaveAttribute('aria-selected', 'true');
  });
});
