-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "children" TEXT,
ADD COLUMN     "discoverable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "drinking" TEXT,
ADD COLUMN     "education" TEXT,
ADD COLUMN     "heightCm" INTEGER,
ADD COLUMN     "languages" TEXT[],
ADD COLUMN     "occupation" TEXT,
ADD COLUMN     "onboardingStep" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "religion" TEXT,
ADD COLUMN     "showAge" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showDistance" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "smoking" TEXT,
ADD COLUMN     "traits" TEXT[];
