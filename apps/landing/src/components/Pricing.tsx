'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Reveal } from './Reveal';

const APP = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

const PLANS = [
  {
    name: 'Gratuit',
    price: '0',
    period: '',
    features: ['20 likes par jour', 'Sélection du jour', 'Messagerie avec vos matchs', 'Profil vérifié'],
    cta: 'Commencer',
    plan: null,
    featured: false,
  },
  {
    name: 'Premium',
    price: '2 500',
    period: 'FCFA / mois',
    features: [
      'Likes illimités',
      'Voyez qui vous a aimé',
      'Filtres avancés',
      '1 boost par mois',
      'Coach IA',
    ],
    cta: 'Passer Premium',
    plan: 'PREMIUM',
    featured: true,
  },
  {
    name: 'Premium+',
    price: '5 000',
    period: 'FCFA / mois',
    features: [
      'Tout Premium',
      'Mode incognito',
      'Super likes illimités',
      'Boosts hebdomadaires',
      'Support prioritaire',
    ],
    cta: 'Passer Premium+',
    plan: 'PREMIUM_PLUS',
    featured: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mb-14 text-center">
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            Des tarifs pensés <span className="text-brand">pour l&apos;Afrique</span>
          </h2>
          <p className="mt-3 text-gray-500">
            Payez en Mobile Money (Wave, Orange Money, MTN MoMo) ou par carte bancaire.
          </p>
        </Reveal>
        <div className="grid gap-8 md:grid-cols-3">
          {PLANS.map((p, i) => (
            <Reveal key={p.name} delay={i * 2}>
              <motion.div
                whileHover={{ y: -8 }}
                className={`relative flex h-full flex-col rounded-3xl p-8 ${
                  p.featured
                    ? 'bg-brand text-white shadow-2xl shadow-brand/40'
                    : 'bg-brand-cream'
                }`}
              >
                {p.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-gold px-4 py-1 text-xs font-bold text-white">
                    POPULAIRE
                  </span>
                )}
                <h3 className="text-lg font-bold">{p.name}</h3>
                <div className="mb-6 mt-2">
                  <span className="text-4xl font-extrabold">{p.price}</span>
                  <span className={`ml-1 text-sm ${p.featured ? 'text-white/80' : 'text-gray-500'}`}>
                    {p.period || 'pour toujours'}
                  </span>
                </div>
                <ul className="mb-8 flex-1 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check
                        size={16}
                        className={`mt-0.5 shrink-0 ${p.featured ? 'text-brand-gold' : 'text-brand'}`}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={
                    p.plan
                      ? `${APP}/register?plan=${p.plan}&period=30`
                      : `${APP}/register`
                  }
                  className={`rounded-xl py-2.5 text-center text-sm font-semibold transition ${
                    p.featured
                      ? 'bg-white text-brand hover:opacity-90'
                      : 'bg-brand text-white hover:opacity-90'
                  }`}
                >
                  {p.cta}
                </a>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
