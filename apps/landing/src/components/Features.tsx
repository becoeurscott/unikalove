'use client';

import { BadgeCheck, Globe2, MessageCircleHeart, ShieldCheck } from 'lucide-react';
import { Reveal } from './Reveal';

const FEATURES = [
  {
    Icon: BadgeCheck,
    title: 'Profils vérifiés',
    text: 'Des profils authentiques et sécurisés, contrôlés par IA et par nos modérateurs.',
    tint: '#FDECF2',
    color: '#D6336C',
  },
  {
    Icon: ShieldCheck,
    title: 'Sécurité & Confidentialité',
    text: 'Votre sécurité est notre priorité : détection des fraudes, signalement, blocage.',
    tint: '#F5EBD6',
    color: '#A87B14',
  },
  {
    Icon: MessageCircleHeart,
    title: 'Matchs intelligents',
    text: "L'IA apprend vos préférences pour vous proposer des personnes réellement compatibles.",
    tint: '#FDECF2',
    color: '#D6336C',
  },
  {
    Icon: Globe2,
    title: 'Ouvert à tous',
    text: "Africains & amoureux du monde entier — l'amour n'a pas de frontières.",
    tint: '#F5EBD6',
    color: '#A87B14',
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <Reveal className="mb-14 text-center">
        <h2 className="text-3xl font-extrabold sm:text-4xl">
          Le dating, <span className="text-brand">en mieux</span>
        </h2>
        <p className="mt-3 text-gray-500">
          Fini les faux profils, les mauvais matchs et les conversations sans lendemain.
        </p>
      </Reveal>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={i}>
            <div className="h-full rounded-3xl bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-brand/10">
              <div
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: f.tint, color: f.color }}
              >
                <f.Icon size={26} />
              </div>
              <h3 className="mb-2 font-bold">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
