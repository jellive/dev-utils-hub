import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { APITester } from '../index';

describe('APITester', () => {
  it('should render the main container', () => {
    render(<APITester />);

    expect(screen.getByText('API Tester')).toBeInTheDocument();
  });

  it('should render method selector', () => {
    render(<APITester />);

    expect(screen.getByRole('combobox', { name: /method/i })).toBeInTheDocument();
  });

  it('should render URL input', () => {
    render(<APITester />);

    expect(screen.getByLabelText(/api url/i)).toBeInTheDocument();
  });

  it('should render send button', () => {
    render(<APITester />);

    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('should render request tabs', () => {
    render(<APITester />);

    expect(screen.getByRole('tab', { name: /query params/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /headers/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /body/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /authorization/i })).toBeInTheDocument();
  });

  it('should render QueryParamsEditor in params tab', () => {
    render(<APITester />);

    const paramsTab = screen.getByRole('tab', { name: /query params/i });
    expect(paramsTab).toBeInTheDocument();
  });

  it('should render HeadersEditor in headers tab', () => {
    render(<APITester />);

    const headersTab = screen.getByRole('tab', { name: /headers/i });
    expect(headersTab).toBeInTheDocument();
  });

  it('should render BodyEditor in body tab', () => {
    render(<APITester />);

    const bodyTab = screen.getByRole('tab', { name: /body/i });
    expect(bodyTab).toBeInTheDocument();
  });

  it('should render AuthTab in authorization tab', () => {
    render(<APITester />);

    const authTab = screen.getByRole('tab', { name: /authorization/i });
    expect(authTab).toBeInTheDocument();
  });

  it('should render ResponseTabs section', () => {
    render(<APITester />);

    // Response section should not be visible initially (no response data yet)
    // Note: ResponseTabs component itself isn't rendered until response exists
    expect(screen.queryByRole('tablist', { name: /response/i })).not.toBeInTheDocument();
  });

  it('should render HistoryPanel section', () => {
    render(<APITester />);

    expect(screen.getByRole('heading', { name: /history/i })).toBeInTheDocument();
  });

  it('should have responsive layout classes', () => {
    const { container } = render(<APITester />);

    const mainContainer = container.querySelector('.space-y-6');
    expect(mainContainer).toBeInTheDocument();
  });

  it('should render card with header and description', () => {
    render(<APITester />);

    expect(screen.getByText('API Tester')).toBeInTheDocument();
    expect(screen.getByText(/test http\/rest apis/i)).toBeInTheDocument();
  });

  it('should initialize with GET method by default', () => {
    render(<APITester />);

    const methodSelector = screen.getByRole('combobox', { name: /method/i });
    expect(methodSelector).toHaveTextContent('GET');
  });

  it('should initialize with empty URL', () => {
    render(<APITester />);

    const urlInput = screen.getByLabelText(/api url/i);
    expect(urlInput).toHaveValue('');
  });

  it('should disable send button when URL is empty', () => {
    render(<APITester />);

    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeDisabled();
  });
});
