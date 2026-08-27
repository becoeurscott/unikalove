'use client';

import { HeartHandshake, Sparkles, UserRound } from 'lucide-react';
import { Reveal } from './Reveal';

const STEPS = [
  {
    Icon: UserRound,
    step: '01',
    title: 'Créez votre profil',
    text: 'Photos, centres d’intérêt, intentions — dites qui vous êtes vraiment. La vérification vous donne le badge ✓.',
  },
  {
    Icon: Sparkles,
    step: '02',
    title: "L'IA vous propose",
    text: 'Une sélection du jour, courte et pertinente. Notre IA apprend de vos préférences, pas de swipe infini.',
  },
  {
    Icon: HeartHandshake,
    step: '03',
    title: 'Rencontrez en sécurité',
    text: 'Discutez, appelez, rencontrez. Icebreakers IA, modération continue et outils de signalement.',
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mb-14 text-center">
          <h2 className="text-3xl font-extrabold sm:text-4xl">Comment ça marche</h2>
          <p className="mt-3 text-gray-500">Trois étapes vers une histoire vraie.</p>
        </Reveal>
        <div className="grid gap-10 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.step} delay={i * 2} y={48}>
              <div className="relative rounded-3xl bg-brand-cream p-8">
                <span className="absolute -top-5 left-8 rounded-full bg-brand px-3 py-1 text-sm font-bold text-white shadow-lg shadow-brand/30">
                  {s.step}
                </span>
                <s.Icon className="mb-4 text-brand" size={30} />
                <h3 className="mb-2 text-lg font-bold">{s.title}</h3>
                <p className="text-sm text-gray-600">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
