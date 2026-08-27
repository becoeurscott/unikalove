import { Logger } from '@nestjs/common';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  appUrl?: string;
  timeoutMs: number;
}

/**
 * Minimal OpenRouter client (OpenAI-compatible chat completions) over fetch —
 * no extra SDK dependency. Swap this file to move to another gateway or to the
 * first-party Anthropic SDK; nothing outside the ai module knows about it.
 */
export class OpenRouterClient {
  private readonly logger = new Logger(OpenRouterClient.name);

  constructor(private readonly config: OpenRouterConfig) {}

  async chat(
    messages: ChatMessage[],
    opts: { maxTokens?: number; temperature?: number } = {},
  ): Promise<string | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          authorization: `Bearer ${this.config.apiKey}`,
          'content-type': 'application/json',
          // Optional attribution headers OpenRouter shows on its dashboard.
          ...(this.config.appUrl ? { 'HTTP-Referer': this.config.appUrl } : {}),
          'X-Title': 'UnikaLove',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          max_tokens: opts.maxTokens ?? 700,
          temperature: opts.temperature ?? 0.7,
        }),
      });

      if (!res.ok) {
        this.logger.warn(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 300)}`);
        return null;
      }
      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      return json.choices?.[0]?.message?.content ?? null;
    } catch (err) {
      this.logger.warn(`OpenRouter call failed: ${(err as Error).message}`);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  /** Chat call that expects JSON; tolerates markdown fences around the payload. */
  async chatJson<T>(messages: ChatMessage[], maxTokens = 700): Promise<T | null> {
    const raw = await this.chat(messages, { maxTokens, temperature: 0.6 });
    if (!raw) return null;
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/, '')
      .trim();
    // Fall back to the outermost {...} or [...] if the model added prose.
    const start = cleaned.search(/[[{]/);
    const end = Math.max(cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}'));
    const slice = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
    try {
      return JSON.parse(slice) as T;
    } catch {
      this.logger.warn(`Could not parse JSON from model output: ${cleaned.slice(0, 200)}`);
      return null;
    }
  }
}
