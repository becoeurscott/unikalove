/** Shape the wizard accumulates across all 11 screens. */
export interface OnboardingDraft {
  displayName: string;
  birthDate: string;
  gender: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  intent: string;
  bio: string;
  photos: string[];
  interests: string[];
  heightCm?: number;
  education: string;
  occupation: string;
  smoking: string;
  drinking: string;
  religion: string;
  children: string;
  languages: string[];
  traits: string[];
  minAge: number;
  maxAge: number;
  maxDistanceKm: number;
  genders: string[];
  showDistance: boolean;
  showAge: boolean;
  discoverable: boolean;
  acceptTerms: boolean;
  marketingOptIn: boolean;
}

export const EMPTY_DRAFT: OnboardingDraft = {
  displayName: '', birthDate: '', gender: '', city: '', country: '',
  intent: '', bio: '', photos: [], interests: [],
  education: '', occupation: '', smoking: '', drinking: '', religion: '',
  children: '', languages: [], traits: [],
  minAge: 21, maxAge: 45, maxDistanceKm: 100, genders: [],
  showDistance: true, showAge: true, discoverable: true,
  acceptTerms: false, marketingOptIn: false,
};

export interface StepProps {
  draft: OnboardingDraft;
  set: <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => void;
}

/** Free plans search locally; wider radii are Premium. Mirrors the API. */
export const FREE_MAX_DISTANCE_KM = 100;

/** Photos are the single biggest driver of matches, so the wizard insists. */
export const MIN_PHOTOS = 5;

/** Screens 2-12. Screen 1 is signup. */
export const TOTAL_STEPS = 12;
export const FIRST_STEP = 2;
