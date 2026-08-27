export interface ModerationVerdict {
  flagged: boolean;
  reason?: string;
}

export interface CoachTurn {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * ALL AI features go through this interface (hard rule 3 in AGENTS.md).
 * Implementations: OpenRouterAiService (real) and StubAiService (fallback when
 * no OPENROUTER_API_KEY is configured, and whenever a live call fails).
 */
export interface AiService {
  /** 0..1 compatibility between two profiles. */
  compatibilityScore(profileA: object, profileB: object): Promise<number>;
  /** French suggestions to improve one's own profile. */
  profileSuggestions(profile: object): Promise<string[]>;
  /** French icebreakers tailored to both profiles. */
  conversationStarters(profileA: object, profileB: object): Promise<string[]>;
  /** French reply options for the last received message. */
  replySuggestions(context: { lastMessage: string; history?: string[] }): Promise<string[]>;
  /** Dating-coach answer in French. */
  coach(message: string, history?: CoachTurn[]): Promise<string>;
  /** Safety check for user-authored text. */
  moderateText(text: string): Promise<ModerationVerdict>;
}

export const AI_SERVICE = Symbol('AI_SERVICE');

/** Deterministic French fallbacks — used when no API key is set, or a call fails. */
export class StubAiService implements AiService {
  async compatibilityScore(): Promise<number> {
    return 0.5;
  }

  async profileSuggestions(): Promise<string[]> {
    return [
      'Ajoutez une photo de vous en train de pratiquer un de vos hobbies.',
      'Complétez votre bio : dites ce que vous recherchez vraiment.',
      'Ajoutez au moins trois centres d’intérêt pour améliorer vos matchs.',
    ];
  }

  async conversationStarters(): Promise<string[]> {
    return [
      'Quel est ton endroit préféré dans ta ville ?',
      'Team thé ou café ? ☕',
      'Ta chanson du moment ?',
    ];
  }

  async replySuggestions(): Promise<string[]> {
    return [
      'Ça me parle ! Raconte-moi en plus 😊',
      'Bonne question — et toi, qu’en penses-tu ?',
      'J’aime beaucoup ta façon de voir les choses.',
    ];
  }

  async coach(): Promise<string> {
    return "Sois toi-même, pose des questions ouvertes et propose une activité concrète quand la conversation est lancée. (Assistant IA indisponible pour le moment — conseil générique.)";
  }

  async moderateText(): Promise<ModerationVerdict> {
    return { flagged: false };
  }
}
