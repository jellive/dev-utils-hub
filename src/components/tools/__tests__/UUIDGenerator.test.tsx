import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UUIDGenerator } from '../UUIDGenerator';

describe('UUIDGenerator', () => {
  beforeEach(() => {
    render(<UUIDGenerator />);
  });

  describe('Basic Component Structure (Task 9.1)', () => {
    it('should render component title', () => {
      expect(screen.getByText('UUID Generator')).toBeInTheDocument();
    });

    it('should render generate button', () => {
      const generateButton = screen.getByRole('button', { name: /generate uuid/i });
      expect(generateButton).toBeInTheDocument();
    });

    it('should render info section', () => {
      expect(screen.getByText(/UUID v4/i)).toBeInTheDocument();
      expect(screen.getByText(/RFC 4122/i)).toBeInTheDocument();
    });
  });

  describe('UUID Generation (Task 9.2)', () => {
    it('should generate UUID when button is clicked', () => {
      const generateButton = screen.getByRole('button', { name: /generate uuid/i });
      fireEvent.click(generateButton);

      const uuidInput = screen.getByTestId('current-uuid') as HTMLInputElement;
      expect(uuidInput).toBeInTheDocument();
      expect(uuidInput.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should display copy button when UUID is generated', () => {
      const generateButton = screen.getByRole('button', { name: /generate uuid/i });
      fireEvent.click(generateButton);

      const copyButtons = screen.getAllByRole('button');
      const copyButton = copyButtons.find(btn => btn.querySelector('svg'));
      expect(copyButton).toBeInTheDocument();
    });

    it('should generate different UUIDs on each click', () => {
      const generateButton = screen.getByRole('button', { name: /generate uuid/i });

      fireEvent.click(generateButton);
      const firstUUID = (screen.getByTestId('current-uuid') as HTMLInputElement).value;

      fireEvent.click(generateButton);
      const secondUUID = (screen.getByTestId('current-uuid') as HTMLInputElement).value;

      expect(firstUUID).not.toBe(secondUUID);
    });
  });
});
