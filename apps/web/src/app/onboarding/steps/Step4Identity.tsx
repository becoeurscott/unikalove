'use client';
import { CircleUser, User, UserRound } from 'lucide-react';
import { IconChoice, StepBody, StepHeader, StepNote } from '../ui';
import type { StepProps } from '../types';

export function Step4Identity({ draft, set }: StepProps) {
  return (
    <>
      <StepHeader title="Je suis…" sub="Cela aide à vous présenter aux bonnes personnes." />
      <StepBody>
        <IconChoice
          columns={3}
          value={draft.gender}
          onChange={(v) => set('gender', v)}
          options={[
            { value: 'FEMALE', label: 'Une femme', Icon: UserRound },
            { value: 'MALE', label: 'Un homme', Icon: User },
            { value: 'OTHER', label: 'Autre', Icon: CircleUser },
          ]}
        />
        <StepNote>
          Ce choix apparaît sur votre profil et sert aux filtres de recherche des autres membres.
        </StepNote>
      </StepBody>
    </>
  );
}
