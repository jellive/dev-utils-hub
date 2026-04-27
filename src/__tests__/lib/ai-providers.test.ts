import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OpenAIProvider } from '@/lib/ai/openai-provider';
import { GoogleProvider } from '@/lib/ai/google-provider';
import { OllamaProvider } from '@/lib/ai/ollama-provider';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn() as typeof global.fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

function makeFakeResponse(payload: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    text: async () => (typeof payload === 'string' ? payload : JSON.stringify(payload)),
    json: async () => payload,
    body: null,
  } as unknown as Response;
}

function makeStreamingResponse(chunks: string[]) {
  const encoder = new TextEncoder();
  let i = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (i < chunks.length) {
        controller.enqueue(encoder.encode(chunks[i++]));
      } else {
        controller.close();
      }
    },
  });
  return {
    ok: true,
    status: 200,
    body,
    text: async () => '',
  } as unknown as Response;
}

describe('OpenAIProvider — chat', () => {
  it('POSTs to /v1/chat/completions with default model + temperature', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      makeFakeResponse({ choices: [{ message: { content: 'hello' } }] })
    );
    const result = await new OpenAIProvider('key').chat([{ role: 'user', content: 'hi' }]);
    expect(result).toBe('hello');
    const init = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit;
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe('gpt-4o-mini');
    expect(body.temperature).toBe(0.2);
    expect(body.max_tokens).toBe(2048);
    expect(body.messages).toEqual([{ role: 'user', content: 'hi' }]);
  });

  it('throws with status code embedded on non-2xx', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      makeFakeResponse('rate limit', false, 429)
    );
    await expect(new OpenAIProvider('k').chat([{ role: 'user', content: 'hi' }])).rejects.toThrow(
      /OpenAI API error 429/
    );
  });

  it('returns empty string when choices array is empty', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      makeFakeResponse({ choices: [] })
    );
    const out = await new OpenAIProvider('k').chat([{ role: 'user', content: 'hi' }]);
    expect(out).toBe('');
  });

  it('forwards custom model + temperature + maxTokens', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      makeFakeResponse({ choices: [{ message: { content: 'ok' } }] })
    );
    await new OpenAIProvider('k').chat([{ role: 'user', content: 'hi' }], {
      model: 'gpt-4-turbo',
      temperature: 0.9,
      maxTokens: 100,
    });
    const init = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit;
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe('gpt-4-turbo');
    expect(body.temperature).toBe(0.9);
    expect(body.max_tokens).toBe(100);
  });
});

describe('OpenAIProvider — stream', () => {
  async function collect(asyncIter: AsyncIterable<string>): Promise<string> {
    let out = '';
    for await (const chunk of asyncIter) out += chunk;
    return out;
  }

  it('yields content deltas from SSE stream', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      makeStreamingResponse([
        'data: {"choices":[{"delta":{"content":"hello"}}]}\n',
        'data: {"choices":[{"delta":{"content":" world"}}]}\n',
        'data: [DONE]\n',
      ])
    );
    const text = await collect(new OpenAIProvider('k').stream([{ role: 'user', content: 'hi' }]));
    expect(text).toBe('hello world');
  });

  it('skips lines without "data:" prefix and malformed JSON', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      makeStreamingResponse([
        'event: ping\n',
        'data: not-json\n',
        'data: {"choices":[{"delta":{"content":"ok"}}]}\n',
        'data: [DONE]\n',
      ])
    );
    const text = await collect(new OpenAIProvider('k').stream([{ role: 'user', content: 'hi' }]));
    expect(text).toBe('ok');
  });

  it('throws on non-2xx before streaming starts', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      makeFakeResponse('forbidden', false, 403)
    );
    await expect(async () => {
      const iter = new OpenAIProvider('k').stream([{ role: 'user', content: 'hi' }]);
      for await (const _ of iter) {
        // pull
      }
    }).rejects.toThrow(/OpenAI API error 403/);
  });
});

describe('GoogleProvider — chat', () => {
  it('POSTs to generativelanguage with the configured key', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      makeFakeResponse({
        candidates: [{ content: { parts: [{ text: 'gemini hello' }] } }],
      })
    );
    const result = await new GoogleProvider('test-key').chat([{ role: 'user', content: 'hi' }]);
    expect(result).toBe('gemini hello');
    const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(String(url)).toContain('generativelanguage.googleapis.com');
    expect(String(url)).toContain('test-key');
  });

  it('throws on non-2xx with status embedded', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      makeFakeResponse('quota', false, 429)
    );
    await expect(new GoogleProvider('k').chat([{ role: 'user', content: 'hi' }])).rejects.toThrow(
      /429/
    );
  });
});

describe('OllamaProvider — chat', () => {
  it('POSTs to local ollama with model + messages', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      makeFakeResponse({ message: { content: 'ollama hi' } })
    );
    const result = await new OllamaProvider('http://localhost:11434', 'llama3.2').chat([
      { role: 'user', content: 'hi' },
    ]);
    expect(result).toBe('ollama hi');
    const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(String(url)).toBe('http://localhost:11434/api/chat');
    const init = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit;
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe('llama3.2');
    expect(body.messages).toEqual([{ role: 'user', content: 'hi' }]);
    expect(body.stream).toBe(false);
  });

  it('throws on non-2xx', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      makeFakeResponse('not running', false, 503)
    );
    await expect(
      new OllamaProvider('http://localhost:11434', 'llama3.2').chat([
        { role: 'user', content: 'hi' },
      ])
    ).rejects.toThrow(/503/);
  });
});
