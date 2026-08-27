/**
 * Per-feature model routing.
 *
 * One model for everything is wrong economically: compatibility scoring is the
 * highest-volume call and its entire output is a single number, while the coach
 * is low-volume and genuinely benefits from reasoning. Measured on OpenRouter,
 * scoring on Opus 5 spent 104 output tokens to return `{"score":0.62}` — 8x the
 * cost of Haiku for identical output.
 *
 * Every entry is overridable by env so the mix can be retuned without a deploy.
 */
export type AiFeature =
  | 'compatibility'
  | 'moderation'
  | 'starters'
  | 'replies'
  | 'profileSuggestions'
  | 'coach';

/** Approximate OpenRouter list prices, USD per million tokens. */
export const MODEL_PRICES: Record<string, { in: number; out: number }> = {
  'anthropic/claude-haiku-4.5': { in: 1, out: 5 },
  'anthropic/claude-sonnet-5': { in: 2, out: 10 },
  'anthropic/claude-opus-5': { in: 5, out: 25 },
};

const DEFAULTS: Record<AiFeature, string> = {
  // High volume, trivial output → cheapest capable model.
  compatibility: 'anthropic/claude-haiku-4.5',
  moderation: 'anthropic/claude-haiku-4.5',
  // Short creative text → mid tier.
  starters: 'anthropic/claude-sonnet-5',
  replies: 'anthropic/claude-sonnet-5',
  profileSuggestions: 'anthropic/claude-sonnet-5',
  // Low volume, benefits from reasoning → top tier.
  coach: 'anthropic/claude-opus-5',
};

/** Env override per feature, e.g. AI_MODEL_COACH=anthropic/claude-sonnet-5 */
const ENV_KEYS: Record<AiFeature, string> = {
  compatibility: 'AI_MODEL_COMPATIBILITY',
  moderation: 'AI_MODEL_MODERATION',
  starters: 'AI_MODEL_STARTERS',
  replies: 'AI_MODEL_REPLIES',
  profileSuggestions: 'AI_MODEL_PROFILE_SUGGESTIONS',
  coach: 'AI_MODEL_COACH',
};

export function resolveModels(
  get: (key: string) => string | undefined,
): Record<AiFeature, string> {
  // OPENROUTER_MODEL still works as a blanket override for every feature.
  const blanket = get('OPENROUTER_MODEL');
  const out = {} as Record<AiFeature, string>;
  for (const feature of Object.keys(DEFAULTS) as AiFeature[]) {
    out[feature] = get(ENV_KEYS[feature]) || blanket || DEFAULTS[feature];
  }
  return out;
}
