# Implementation Plan — 11-screen onboarding (screens 2–12)

Replaces the current 3-step wizard. Screen 1 is the existing signup.

## Screen → data mapping

| # | Screen | Data | Status |
|---|---|---|---|
| 2 | Name + date of birth | `Profile.displayName`, `birthDate` | exists |
| 3 | Location | `city`, `country`, `latitude`, `longitude` | exists |
| 4 | Identity | `Profile.gender` | exists |
| 5 | What you're looking for | `Profile.intent` | exists |
| 6 | Add 2–4 photos | `Photo[]` | **needs real upload** |
| 7 | Interests | `ProfileInterest` | exists |
| 8 | Lifestyle / personality | — | **new columns** |
| 9 | Dating preferences | `Preference` | exists |
| 10 | Profile preview | none (renders the card as others see it) | UI only |
| 11 | Safety & privacy | — | **new columns** |
| 12 | "Your matches are ready" | reads `/discovery/daily-picks` | UI only |

## Schema additions (one additive migration)

`Profile` — screen 8:
- `heightCm Int?`, `education String?`, `occupation String?`
- `smoking String?`, `drinking String?` (`never` / `socially` / `regularly`)
- `religion String?`, `children String?` (`have` / `want` / `none`)
- `languages String[]`, `traits String[]` (personality chips)

`Profile` — screen 11 (privacy controls):
- `showDistance Boolean @default(true)`, `showAge Boolean @default(true)`
- `discoverable Boolean @default(true)` (pause from discovery)

`User` — screen 11 (consent, needed for GDPR-style records):
- `acceptedTermsAt DateTime?`, `marketingOptIn Boolean @default(false)`

## API
- `PUT /profiles/me/lifestyle` — screen 8 fields
- `PUT /profiles/me/privacy` — screen 11 fields + consent stamp
- extend `UpsertProfileDto` so each screen can PATCH just its own slice
  (currently it demands the whole profile, which breaks a stepwise wizard)
- completeness scoring updated to count the new fields

## Web — `apps/web/src/app/onboarding/`
- one component per screen under `steps/`, driven by a single wizard shell that
  owns state, progress, back/next and validation
- reuses the existing `StepTransition` (slide in the direction of travel)
- **saves after each screen**, so a drop-out resumes where they left off rather
  than losing everything
- progress bar showing "Étape n sur 11"
- screen 10 renders the real `ProfileCard` component, so the preview is exactly
  what other users will see
- screen 12 fetches daily picks and reveals them

## Not in scope
Photo upload backend (see the question below) — screen 6 falls back to the
current URL field until storage is chosen.
