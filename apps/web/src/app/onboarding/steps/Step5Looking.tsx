'use client';
import { Compass, Heart, Users } from 'lucide-react';
import { IconChoice, StepBody, StepHeader, StepNote } from '../ui';
import type { StepProps } from '../types';

export function Step5Looking({ draft, set }: StepProps) {
  return (
    <>
      <StepHeader
        title="Que recherchez-vous ?"
        sub="« Il n'est pas bon que l'homme soit seul » — Genèse 2:18"
      />
      <StepBody>
        <IconChoice
          columns={3}
          value={draft.intent}
          onChange={(v) => set('intent', v)}
          options={[
            {
              value: 'serious',
              label: 'Mariage',
              hint: 'Trouver un(e) partenaire pour la vie',
              Icon: Heart,
            },
            {
              value: 'open',
              label: 'Relation sérieuse',
              hint: 'Construire quelque chose de durable',
              Icon: Compass,
            },
            {
              value: 'friends',
              label: 'Amitié chrétienne',
              hint: 'Rencontrer des frères et sœurs en Christ',
              Icon: Users,
            },
          ]}
        />
        <StepNote>Vous pourrez changer d&apos;avis à tout moment depuis vos réglages.</StepNote>
      </StepBody>
    </>
  );
}
