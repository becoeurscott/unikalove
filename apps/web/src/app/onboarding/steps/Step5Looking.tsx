'use client';
import { Compass, Heart, Users } from 'lucide-react';
import { IconChoice, StepBody, StepHeader, StepNote } from '../ui';
import type { StepProps } from '../types';

export function Step5Looking({ draft, set }: StepProps) {
  return (
    <>
      <StepHeader
        title="Que recherchez-vous ?"
        sub="Soyez honnête — c'est ce qui évite les malentendus."
      />
      <StepBody>
        <IconChoice
          columns={3}
          value={draft.intent}
          onChange={(v) => set('intent', v)}
          options={[
            {
              value: 'serious',
              label: 'Relation sérieuse',
              hint: 'Construire quelque chose de durable',
              Icon: Heart,
            },
            {
              value: 'open',
              label: 'Ouvert(e) à tout',
              hint: 'Voir où cela mène',
              Icon: Compass,
            },
            {
              value: 'friends',
              label: "L'amitié d'abord",
              hint: 'Rencontrer des gens, sans pression',
              Icon: Users,
            },
          ]}
        />
        <StepNote>Vous pourrez changer d&apos;avis à tout moment depuis vos réglages.</StepNote>
      </StepBody>
    </>
  );
}
