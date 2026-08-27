import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ModerationService } from '../safety/moderation.service';
import {
  AddPhotoDto,
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

  /** Completeness: bio 20, photos 30 (10 each up to 3), interests 20 (5 each up to 4), location 15, intent 15. */
  private async recomputeCompleteness(profileId: string, userId: string) {
    const profile = await this.prisma.profile.findUniqueOrThrow({
      where: { id: profileId },
      include: {
        photos: { where: { deletedAt: null } },
        interests: true,
      },
    });
    let score = 0;
    if (profile.bio && profile.bio.length >= 20) score += 20;
    score += Math.min(profile.photos.length, 3) * 10;
    score += Math.min(profile.interests.length, 4) * 5;
    if (profile.latitude != null && profile.longitude != null) score += 15;
    if (profile.intent) score += 15;

    await this.prisma.profile.update({
      where: { id: profileId },
      data: { completeness: score },
    });
    return this.getMine(userId);
  }
}
