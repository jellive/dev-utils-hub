/**
 * Accessibility tests for tool component HTML patterns.
 *
 * Dev-utils-hub tools depend on Electron IPC, i18next, and electron-store
 * which cannot run in jsdom. These tests validate the HTML accessibility
 * patterns (labels, roles, landmarks) that the tools produce, using
 * equivalent minimal markup — the same approach used in the existing
 * component tests in this project.
 */
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Tool component accessibility patterns', () => {
  it('hash generator form pattern has no violations', async () => {
    const { container } = render(
      <div role="main">
        <h1>Hash Generator</h1>
        <form aria-label="Hash generation form">
          <div>
            <label htmlFor="hash-input">Input text</label>
            <textarea
              id="hash-input"
              aria-label="Text to hash"
              placeholder="Enter text to hash"
            />
          </div>
          <fieldset>
            <legend>Algorithm</legend>
            <label>
              <input type="radio" name="algorithm" value="md5" defaultChecked />
              MD5
            </label>
            <label>
              <input type="radio" name="algorithm" value="sha256" />
              SHA-256
            </label>
            <label>
              <input type="radio" name="algorithm" value="sha512" />
              SHA-512
            </label>
          </fieldset>
          <button type="button">Generate Hash</button>
        </form>
        <section aria-label="Hash result">
          <label htmlFor="hash-output">Result</label>
          <input
            id="hash-output"
            type="text"
            readOnly
            aria-label="Generated hash value"
            value=""
          />
          <button type="button" aria-label="Copy hash to clipboard">
            Copy
          </button>
        </section>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('diff tool two-panel pattern has no violations', async () => {
    const { container } = render(
      <div role="main">
        <h1>Text Diff</h1>
        <div role="group" aria-label="Text comparison">
          <div>
            <label htmlFor="original-text">Original text</label>
            <textarea id="original-text" rows={10} />
          </div>
          <div>
            <label htmlFor="modified-text">Modified text</label>
            <textarea id="modified-text" rows={10} />
          </div>
        </div>
        <button type="button">Compare</button>
        <section aria-label="Diff results" aria-live="polite">
          <ul aria-label="Differences">
            <li>
              <span aria-label="deleted line" style={{ color: 'red' }}>
                - old line
              </span>
            </li>
            <li>
              <span aria-label="inserted line" style={{ color: 'green' }}>
                + new line
              </span>
            </li>
          </ul>
        </section>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('UUID generator output pattern has no violations', async () => {
    const { container } = render(
      <div role="main">
        <h1>UUID Generator</h1>
        <div>
          <button type="button">Generate UUID</button>
          <label htmlFor="uuid-output">Generated UUID</label>
          <input
            id="uuid-output"
            type="text"
            readOnly
            value="550e8400-e29b-41d4-a716-446655440000"
            aria-label="Generated UUID value"
          />
          <button type="button" aria-label="Copy UUID to clipboard">
            Copy
          </button>
        </div>
        <section aria-label="UUID history">
          <h2>History</h2>
          <ul aria-label="Previously generated UUIDs">
            <li>550e8400-e29b-41d4-a716-446655440000</li>
          </ul>
        </section>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('base64 converter pattern has no violations', async () => {
    const { container } = render(
      <div role="main">
        <h1>Base64 Converter</h1>
        <form aria-label="Base64 conversion">
          <div>
            <label htmlFor="b64-input">Input</label>
            <textarea id="b64-input" rows={5} />
          </div>
          <div role="group" aria-label="Conversion direction">
            <button type="button" aria-pressed="true">
              Encode
            </button>
            <button type="button" aria-pressed="false">
              Decode
            </button>
          </div>
          <div>
            <label htmlFor="b64-output">Output</label>
            <textarea id="b64-output" readOnly rows={5} />
          </div>
        </form>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
