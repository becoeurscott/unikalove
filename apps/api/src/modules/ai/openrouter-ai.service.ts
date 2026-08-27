import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import {
  AiService,
  CoachTurn,
  ModerationVerdict,
  StubAiService,
} from './ai.service';
import { ChatMessage, OpenRouterClient } from './openrouter.client';

const SYSTEM_FR =
  "Tu es l'assistant IA d'UnikaLove, une application de rencontres pour l'Afrique et sa diaspora. " +
  'Tu réponds toujours en français, avec bienveillance, respect et concision. ' +
  'Tu ne rédiges jamais de contenu sexuellement explicite, discriminatoire ou manipulateur.';

/** Daily per-user call budget so a runaway client cannot burn the credit balance. */
const DAILY_BUDGET = 60;

@Injectable()
export class OpenRouterAiService implements AiService {
  private readonly logger = new Logger(OpenRouterAiService.name);
  private readonly fallback = new StubAiService();

  constructor(
    private readonly client: OpenRouterClient,
    private readonly redis: RedisService,
  ) {}

  /** Returns false once a user exceeds their daily allowance. */
  async withinBudget(userId: string): Promise<boolean> {
    const day = new Date().toISOString().slice(0, 10);
    const used = await this.redis.incr(`ai:budget:${userId}:${day}`, 86_400);
    if (used > DAILY_BUDGET) {
      this.logger.warn(`AI daily budget reached for user ${userId}`);
      return false;
    }
    return true;
  }

  private msgs(user: string): ChatMessage[] {
    return [
      { role: 'system', content: SYSTEM_FR },
      { role: 'user', content: user },
    ];
  }

  async compatibilityScore(profileA: object, profileB: object): Promise<number> {
    const result = await this.client.chatJson<{ score: number }>(
      this.msgs(
        'Évalue la compatibilité entre ces deux profils de rencontre.\n' +
          `Profil A : ${JSON.stringify(profileA)}\n` +
          `Profil B : ${JSON.stringify(profileB)}\n` +
          'Prends en compte les centres d’intérêt communs, l’intention de relation, ' +
          'la proximité géographique et l’écart d’âge.\n' +
          'Réponds UNIQUEMENT avec {"score": nombre entre 0 et 1}.',
      ),
      120,
    );
    const score = Number(result?.score);
    if (!Number.isFinite(score)) return this.fallback.compatibilityScore();
    return Math.min(1, Math.max(0, score));
  }

  async profileSuggestions(profile: object): Promise<string[]> {
    const result = await this.client.chatJson<{ suggestions: string[] }>(
      this.msgs(
        'Voici un profil UnikaLove : ' +
          JSON.stringify(profile) +
          '\nDonne 3 conseils concrets et bienveillants pour le rendre plus attractif ' +
          'et inspirer confiance. Chaque conseil fait une phrase.\n' +
          'Réponds UNIQUEMENT avec {"suggestions": ["...", "...", "..."]}.',
      ),
      400,
    );
    return this.clean(result?.suggestions) ?? this.fallback.profileSuggestions();
  }

  async conversationStarters(profileA: object, profileB: object): Promise<string[]> {
    const result = await this.client.chatJson<{ starters: string[] }>(
      this.msgs(
        'Deux personnes viennent de matcher sur UnikaLove.\n' +
          `Moi : ${JSON.stringify(profileA)}\n` +
          `L'autre personne : ${JSON.stringify(profileB)}\n` +
          'Propose 3 messages d’accroche courts (moins de 15 mots), chaleureux et ' +
          'personnalisés à partir de leurs points communs. Tutoiement.\n' +
          'Réponds UNIQUEMENT avec {"starters": ["...", "...", "..."]}.',
      ),
      400,
    );
    return this.clean(result?.starters) ?? this.fallback.conversationStarters();
  }

  async replySuggestions(context: {
    lastMessage: string;
    history?: string[];
  }): Promise<string[]> {
    const result = await this.client.chatJson<{ replies: string[] }>(
      this.msgs(
        'Conversation sur UnikaLove.\n' +
          (context.history?.length
            ? `Historique récent : ${context.history.slice(-6).join(' | ')}\n`
            : '') +
          `Dernier message reçu : "${context.lastMessage}"\n` +
          'Propose 3 réponses possibles, courtes, naturelles et respectueuses, ' +
          'qui relancent la conversation. Tutoiement.\n' +
          'Réponds UNIQUEMENT avec {"replies": ["...", "...", "..."]}.',
      ),
      400,
    );
    return this.clean(result?.replies) ?? this.fallback.replySuggestions();
  }

  async coach(message: string, history: CoachTurn[] = []): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          SYSTEM_FR +
          ' Tu joues ici le rôle de coach en rencontres : tu donnes des conseils ' +
          'pratiques et encourageants, tu rappelles les règles de sécurité quand ' +
          'c’est pertinent, et tu réponds en 120 mots maximum.',
      },
      ...history.slice(-6),
      { role: 'user', content: message },
    ];
    const answer = await this.client.chat(messages, { maxTokens: 500, temperature: 0.8 });
    return answer?.trim() || this.fallback.coach();
  }

  async moderateText(text: string): Promise<ModerationVerdict> {
    if (!text.trim()) return { flagged: false };
    const result = await this.client.chatJson<{ flagged: boolean; reason?: string }>(
      [
        {
          role: 'system',
          content:
            'Tu es un modérateur de contenu pour une application de rencontres. ' +
            'Tu signales : arnaques et demandes d’argent, contenu sexuel explicite, ' +
            'harcèlement, haine, coordonnées poussées hors plateforme de façon suspecte, ' +
            'et tout indice de minorité. Tu ne signales PAS le flirt normal.',
        },
        {
          role: 'user',
          content:
            `Texte à analyser : """${text.slice(0, 2000)}"""\n` +
            'Réponds UNIQUEMENT avec {"flagged": true|false, "reason": "courte raison en français"}.',
        },
      ],
      150,
    );
    if (!result || typeof result.flagged !== 'boolean') return { flagged: false };
    return { flagged: result.flagged, reason: result.reason };
  }

  /** Keep only non-empty strings; null when the model returned nothing usable. */
  private clean(list?: unknown): string[] | null {
    if (!Array.isArray(list)) return null;
    const out = list
      .filter((s): s is string => typeof s === 'string')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);
    return out.length ? out : null;
  }
}
