import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ModerationService } from '../safety/moderation.service';
import {
  AddPhotoDto,
  LifestyleDto,
  PrivacyDto,
  ProfileStepDto,
  SetInterestsDto,
  UpdatePreferenceDto,
  UpsertProfileDto,
} from './dto/profile.dto';

const MIN_AGE = 18;

@Injectable()
export class ProfilesService {
  constructor(
    private prisma: PrismaService,
    private moderation: ModerationService,
  ) {}

  async getMine(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        photos: { where: { deletedAt: null }, orderBy: { position: 'asc' } },
        interests: { include: { interest: true } },
      },
    });
    if (!profile) throw new NotFoundException('Profile not created yet');
    return profile;
  }

  async upsert(userId: string, dto: UpsertProfileDto) {
    const age = (Date.now() - dto.birthDate.getTime()) / (365.25 * 86_400_000);
    if (age < MIN_AGE) throw new BadRequestException('You must be at least 18');

    if (dto.bio) this.moderation.review(userId, dto.bio, 'bio');
    const data = { ...dto };
    const profile = await this.prisma.profile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
    return this.recomputeCompleteness(profile.id, userId);
  }

  /**
   * Partial save used by each onboarding screen. Creating the row needs a name,
   * a gender and a birth date (screens 2 and 4), so earlier screens update an
   * existing row only.
   */
  async saveStep(userId: string, dto: ProfileStepDto) {
    if (dto.birthDate) {
      const age = (Date.now() - dto.birthDate.getTime()) / (365.25 * 86_400_000);
      if (age < MIN_AGE) throw new BadRequestException('Vous devez avoir au moins 18 ans');
    }
    if (dto.bio) this.moderation.review(userId, dto.bio, 'bio');

    const existing = await this.prisma.profile.findUnique({ where: { userId } });
    if (!existing) {
      if (!dto.displayName || !dto.birthDate || !dto.gender) {
        throw new BadRequestException(
          'Prénom, date de naissance et genre sont requis pour créer le profil',
        );
      }
      await this.prisma.profile.create({
        data: {
          userId,
          displayName: dto.displayName,
          birthDate: dto.birthDate,
          gender: dto.gender,
          city: dto.city,
          country: dto.country,
          latitude: dto.latitude,
          longitude: dto.longitude,
          intent: dto.intent,
          bio: dto.bio,
          onboardingStep: dto.onboardingStep ?? 2,
        },
      });
    } else {
      await this.prisma.profile.update({
        where: { userId },
        data: {
          ...dto,
          // Progress only moves forward, so a back-navigation cannot rewind it.
          onboardingStep: Math.max(existing.onboardingStep, dto.onboardingStep ?? 0),
        },
      });
    }
    const profile = await this.prisma.profile.findUniqueOrThrow({ where: { userId } });
    return this.recomputeCompleteness(profile.id, userId);
  }

  /** Screen 8. */
  async updateLifestyle(userId: string, dto: LifestyleDto) {
    const profile = await this.getMine(userId);
    await this.prisma.profile.update({ where: { userId }, data: { ...dto } });
    return this.recomputeCompleteness(profile.id, userId);
  }

  /** Screen 11 — privacy switches plus the consent stamp. */
  async updatePrivacy(userId: string, dto: PrivacyDto) {
    const { acceptTerms, marketingOptIn, ...profileFields } = dto;
    const profile = await this.getMine(userId);
    await this.prisma.profile.update({ where: { userId }, data: profileFields });
    if (acceptTerms !== undefined || marketingOptIn !== undefined) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(acceptTerms ? { acceptedTermsAt: new Date() } : {}),
          ...(marketingOptIn !== undefined ? { marketingOptIn } : {}),
        },
      });
    }
    return this.recomputeCompleteness(profile.id, userId);
  }

  async updatePreference(userId: string, dto: UpdatePreferenceDto) {
    if (dto.minAge && dto.maxAge && dto.minAge > dto.maxAge) {
      throw new BadRequestException('minAge cannot exceed maxAge');
    }
    return this.prisma.preference.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
    });
  }

  listInterests() {
    return this.prisma.interest.findMany({ orderBy: { slug: 'asc' } });
  }

  async setInterests(userId: string, dto: SetInterestsDto) {
    const profile = await this.getMine(userId);
    const interests = await this.prisma.interest.findMany({
      where: { slug: { in: dto.slugs } },
    });
    await this.prisma.$transaction([
      this.prisma.profileInterest.deleteMany({ where: { profileId: profile.id } }),
      this.prisma.profileInterest.createMany({
        data: interests.map((i) => ({ profileId: profile.id, interestId: i.id })),
      }),
    ]);
    return this.recomputeCompleteness(profile.id, userId);
  }

  async addPhoto(userId: string, dto: AddPhotoDto) {
    const profile = await this.getMine(userId);
    await this.prisma.photo.create({
      data: { profileId: profile.id, url: dto.url, position: dto.position ?? 0 },
    });
    return this.recomputeCompleteness(profile.id, userId);
  }

  async removePhoto(userId: string, photoId: string) {
    const profile = await this.getMine(userId);
    const result = await this.prisma.photo.updateMany({
      where: { id: photoId, profileId: profile.id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) throw new NotFoundException('Photo not found');
    return this.recomputeCompleteness(profile.id, userId);
  }

  async submitVerification(userId: string, selfieUrl: string) {
    await this.getMine(userId);
    return this.prisma.verificationRequest.create({ data: { userId, selfieUrl } });
  }

  /** Completeness: bio 15, photos 30 (10 each up to 3), interests 20 (5 each up
   *  to 4), location 10, intent 10, lifestyle 15 (3 each up to 5 fields). */
  private async recomputeCompleteness(profileId: string, userId: string) {
    const profile = await this.prisma.profile.findUniqueOrThrow({
      where: { id: profileId },
      include: {
        photos: { where: { deletedAt: null } },
        interests: true,
      },
    });
    let score = 0;
    if (profile.bio && profile.bio.length >= 20) score += 15;
    score += Math.min(profile.photos.length, 3) * 10;
    score += Math.min(profile.interests.length, 4) * 5;
    if (profile.latitude != null && profile.longitude != null) score += 10;
    if (profile.intent) score += 10;
    const lifestyle = [
      profile.occupation,
      profile.education,
      profile.smoking,
      profile.children,
      profile.languages?.length ? 'x' : null,
    ].filter(Boolean).length;
    score += Math.min(lifestyle, 5) * 3;

    await this.prisma.profile.update({
      where: { id: profileId },
      data: { completeness: score },
    });
    return this.getMine(userId);
  }
}
