'use client';

import { Star } from 'lucide-react';
import { Reveal } from './Reveal';
import { TestimonialDrift, type Voice } from './TestimonialDrift';

/** Illustrative testimonials for the pre-launch landing page. */
const VOICES: Voice[] = [
  {
    quote:
      'On a matché grâce à la sélection du jour. Six mois plus tard, on prépare notre premier voyage ensemble.',
    name: 'Aïcha & Kofi',
    photo: '/photos/photo-5.webp',
    role: 'Ensemble depuis 6 mois',
    city: 'Douala ↔ Accra',
    tint: '#FDECF2',
    verified: true,
  },
  {
    quote:
      'Enfin une appli où je me sens en sécurité. Les profils vérifiés changent tout, je ne perds plus mon temps avec de faux comptes.',
    name: 'Mariama',
    photo: '/photos/photo-1.webp',
    role: 'Profil vérifié',
    city: 'Dakar',
    tint: '#D6336C',
    verified: true,
  },
  {
    quote:
      "Depuis la diaspora, retrouver quelqu'un qui partage ma culture semblait impossible. Plus maintenant.",
    name: 'Serge',
    photo: '/photos/photo-2.webp',
    role: 'Diaspora',
    city: 'Paris',
    tint: '#F5EBD6',
  },
  {
    quote:
      "Les suggestions de l'IA sont bluffantes. Trois matchs, trois vraies conversations — pas de swipe à l'infini.",
    name: 'Ngozi',
    photo: '/photos/photo-11.webp',
    role: 'Matchs intelligents',
    city: 'Lagos',
    tint: '#E8DCF7',
    verified: true,
  },
  {
    quote:
      "Les icebreakers m'ont débloqué. Je ne savais jamais quoi écrire, maintenant les conversations démarrent seules.",
    name: 'Ibrahim',
    photo: '/photos/photo-13.webp',
    role: 'Coach IA',
    city: 'Abidjan',
    tint: '#FAF3EC',
    verified: true,
  },
  {
    quote:
      'On habitait à 3 km sans jamais se croiser. UnikaLove nous a présentés un mardi soir.',
    name: 'Grace & Thierry',
    photo: '/photos/photo-7.webp',
    role: 'Fiancés 💍',
    city: 'Yaoundé',
    tint: '#A87B14',
    verified: true,
  },
  {
    quote:
      'La modération est réactive. J’ai signalé un profil douteux le matin, il avait disparu à midi.',
    name: 'Fatou',
    photo: '/photos/photo-12.webp',
    role: 'Sécurité',
    city: 'Abidjan',
    tint: '#D9EEF5',
    verified: true,
  },
  {
    quote:
      'Cinq profils par jour, choisis avec soin. Je passe moins de temps sur l’appli et je rencontre plus de monde.',
    name: 'Emeka',
    photo: '/photos/photo-8.webp',
    role: 'Sélection du jour',
    city: 'Lagos',
    tint: '#2B2B2B',
  },
];

const STATS = [
  { value: '12 000+', label: 'membres actifs' },
  { value: '3 600+', label: 'matchs créés' },
  { value: '54', label: 'pays connectés' },
  { value: '4,8/5', label: 'note moyenne' },
];

export function Testimonials() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-brand-soft/60 to-transparent" />

      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mb-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-brand shadow-sm">
            <Star size={13} className="fill-brand-gold text-brand-gold" />
            Ils ont trouvé leur histoire
          </span>
        </Reveal>
        <Reveal delay={1} className="mb-12 text-center">
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            Des histoires <span className="text-brand">vraies</span>
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-gray-500">
            Des milliers de célibataires se rencontrent chaque semaine sur UnikaLove, en Afrique
            et partout dans le monde.
          </p>
        </Reveal>
      </div>

      {/* full-bleed drifting rows */}
      <Reveal delay={2}>
        <TestimonialDrift voices={VOICES} />
      </Reveal>

      <div className="mx-auto max-w-6xl px-6">
        <Reveal delay={2}>
          <p className="mt-4 text-center text-xs text-gray-400">
            Glissez les cartes ou survolez pour ralentir.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-6 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-extrabold text-brand sm:text-3xl">{s.value}</div>
                <div className="mt-1 text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
