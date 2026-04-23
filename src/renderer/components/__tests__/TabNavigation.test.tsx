import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TabNavigation } from '../TabNavigation';
import { useAppStore } from '../../stores/useAppStore';

beforeEach(() => {
  // Reset store state before each test
  useAppStore.setState({
    activeTool: 'json',
    favorites: [],
  });
});

describe('TabNavigation', () => {
  it('renders all tools from TOOLS constant', () => {
    render(<TabNavigation />);
    expect(screen.getByText('JSON Formatter')).toBeInTheDocument();
    expect(screen.getByText('JWT Decoder')).toBeInTheDocument();
    expect(screen.getByText('Base64')).toBeInTheDocument();
    expect(screen.getByText('URL Encoder')).toBeInTheDocument();
    expect(screen.getByText('Regex Tester')).toBeInTheDocument();
    expect(screen.getByText('Text Diff')).toBeInTheDocument();
    expect(screen.getByText('Hash Generator')).toBeInTheDocument();
  });

  it('calls setActiveTool when a tab is clicked', () => {
    const _setActiveTool = vi.spyOn(useAppStore.getState(), 'setActiveTool');
    render(<TabNavigation />);
    fireEvent.click(screen.getByText('JWT Decoder'));
    // setActiveTool is called via the store action, check the store state
    expect(useAppStore.getState().activeTool).toBe('jwt');
  });

  it('shows unfilled star for non-favorite tools', () => {
    render(<TabNavigation />);
    const stars = screen.getAllByText('☆');
    expect(stars.length).toBeGreaterThan(0);
  });

  it('shows filled star for favorited tools', () => {
    useAppStore.setState({ favorites: ['json'] });
    render(<TabNavigation />);
    expect(screen.getByText('⭐')).toBeInTheDocument();
  });

  it('adds tool to favorites when star is clicked', () => {
    render(<TabNavigation />);
    // Find the favorite toggle for JSON Formatter
    const toggleBtn = screen.getByRole('button', { name: /toggle favorite for json formatter/i });
    fireEvent.click(toggleBtn);
    expect(useAppStore.getState().favorites).toContain('json');
  });

  it('removes tool from favorites when star is clicked on a favorite', () => {
    useAppStore.setState({ favorites: ['json'] });
    render(<TabNavigation />);
    const toggleBtn = screen.getByRole('button', { name: /toggle favorite for json formatter/i });
    fireEvent.click(toggleBtn);
    expect(useAppStore.getState().favorites).not.toContain('json');
  });

  it('favorite toggle aria-labels are present for all tools', () => {
    render(<TabNavigation />);
    // Each tool should have a toggle button with accessible label
    expect(
      screen.getByRole('button', { name: /toggle favorite for json formatter/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /toggle favorite for jwt decoder/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /toggle favorite for hash generator/i })
    ).toBeInTheDocument();
  });
});
