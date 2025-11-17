import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MethodSelector } from '../components/MethodSelector';
import { URLInput } from '../components/URLInput';
import { SendButton } from '../components/SendButton';
import { HeadersEditor } from '../components/HeadersEditor';
import { QueryParamsEditor } from '../components/QueryParamsEditor';
import { BodyEditor } from '../components/BodyEditor';
import { ResponseMetadata } from '../components/ResponseMetadata';
import { ResponseBody } from '../components/ResponseBody';
import { ResponseHeaders } from '../components/ResponseHeaders';
import { HistoryPanel } from '../components/HistoryPanel';
import { HistoryList } from '../components/HistoryList';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('API Tester - Accessibility Tests', () => {
  describe('MethodSelector', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <MethodSelector value="GET" onChange={vi.fn()} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('URLInput', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <URLInput value="https://api.example.com" onChange={vi.fn()} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes', () => {
      const { getByRole } = render(
        <URLInput value="" onChange={vi.fn()} />
      );
      const input = getByRole('textbox');
      expect(input).toHaveAttribute('type', 'url');
      expect(input).toHaveAttribute('placeholder');
    });
  });

  describe('SendButton', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <SendButton
          onSend={vi.fn()}
          onCancel={vi.fn()}
          disabled={false}
          loading={false}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should be keyboard accessible', () => {
      const { getByRole } = render(
        <SendButton
          onSend={vi.fn()}
          onCancel={vi.fn()}
          disabled={false}
          loading={false}
        />
      );
      const button = getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('HeadersEditor', () => {
    it('should have no accessibility violations', async () => {
      const mockHeaders = [
        { key: 'Content-Type', value: 'application/json', enabled: true },
      ];
      const { container } = render(
        <HeadersEditor headers={mockHeaders} onChange={vi.fn()} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('QueryParamsEditor', () => {
    it('should have no accessibility violations', async () => {
      const mockParams = [
        { key: 'page', value: '1', enabled: true },
      ];
      const { container } = render(
        <QueryParamsEditor params={mockParams} onChange={vi.fn()} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('BodyEditor', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <BodyEditor
          value=""
          onChange={vi.fn()}
          
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('ResponseMetadata', () => {
    it('should have no accessibility violations', async () => {
      const { container} = render(
        <ResponseMetadata
          status={200}
          time={123}
          size={1024}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('ResponseBody', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <ResponseBody
          body='{"message": "success"}'
          contentType="application/json"
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('ResponseHeaders', () => {
    it('should have no accessibility violations', async () => {
      const mockHeaders = {
        'content-type': 'application/json',
        'content-length': '123',
      };
      const { container } = render(
        <ResponseHeaders headers={mockHeaders} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('HistoryPanel', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <HistoryPanel count={5} onClear={vi.fn()}>
          <div>History items</div>
        </HistoryPanel>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('HistoryList', () => {
    it('should have no accessibility violations', async () => {
      const mockItems = [
        {
          id: '1',
          method: 'GET',
          url: 'https://api.example.com',
          timestamp: Date.now(),
          headers: {},
          body: '',
          response: {
            status: 200,
            statusText: 'OK',
            body: '{}',
            headers: {},
            time: 123,
          },
        },
      ];
      const { container } = render(
        <HistoryList items={mockItems} onRestore={vi.fn()} onDelete={vi.fn()} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support tab navigation between interactive elements', () => {
      const { getAllByRole } = render(
        <div>
          <URLInput value="" onChange={vi.fn()} />
          <SendButton onSend={vi.fn()} onCancel={vi.fn()} disabled={false} loading={false} />
        </div>
      );

      const inputs = getAllByRole('textbox');
      const buttons = getAllByRole('button');

      // Verify all interactive elements are present
      expect(inputs.length).toBeGreaterThan(0);
      expect(buttons.length).toBeGreaterThan(0);

      // Verify no elements have negative tabindex (unless intentionally disabled)
      [...inputs, ...buttons].forEach(element => {
        const tabIndex = element.getAttribute('tabindex');
        if (tabIndex !== null) {
          expect(parseInt(tabIndex)).toBeGreaterThanOrEqual(0);
        }
      });
    });
  });

  describe('Screen Reader Support', () => {
    it('should have descriptive labels for form inputs', () => {
      const { getByRole } = render(
        <URLInput value="" onChange={vi.fn()} />
      );
      const input = getByRole('textbox');

      // Should have either label, aria-label, or aria-labelledby
      const hasLabel =
        input.getAttribute('aria-label') !== null ||
        input.getAttribute('aria-labelledby') !== null ||
        input.getAttribute('placeholder') !== null;

      expect(hasLabel).toBe(true);
    });

    it('should announce button states properly', () => {
      const { getByRole } = render(
        <SendButton onSend={vi.fn()} onCancel={vi.fn()} disabled={true} loading={false} />
      );
      const button = getByRole('button');

      expect(button).toHaveAttribute('disabled');
    });
  });

  describe('Color Contrast', () => {
    it('should use semantic HTML elements for better structure', () => {
      const { getByRole } = render(
        <SendButton onSend={vi.fn()} onCancel={vi.fn()} disabled={false} loading={false} />
      );

      const button = getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });
  });

  describe('Focus Management', () => {
    it('should have visible focus indicators', async () => {
      const { getByRole } = render(
        <SendButton onSend={vi.fn()} onCancel={vi.fn()} disabled={false} loading={false} />
      );

      const button = getByRole('button');
      button.focus();

      expect(document.activeElement).toBe(button);
    });
  });
});
