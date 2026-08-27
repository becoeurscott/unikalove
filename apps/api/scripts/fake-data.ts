/**
 * Dev-only: enrich the database with fake data so the admin dashboard
 * charts look alive. Idempotent-ish: skips users it already created.
 * Run: npx ts-node scripts/fake-data.ts
 */
import { Gender, MatchStatus, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CITIES = [
  { city: 'Douala', country: 'Cameroun', lat: 4.0511, lng: 9.7679 },
  { city: 'Yaoundé', country: 'Cameroun', lat: 3.848, lng: 11.5021 },
  { city: 'Abidjan', country: "Côte d'Ivoire", lat: 5.3599, lng: -4.0083 },
  { city: 'Dakar', country: 'Sénégal', lat: 14.7167, lng: -17.4677 },
  { city: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792 },
  { city: 'Accra', country: 'Ghana', lat: 5.6037, lng: -0.187 },
  { city: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
  { city: 'Nairobi', country: 'Kenya', lat: -1.2921, lng: 36.8219 },
];

const F = ['Awa','Khady','Adjoua','Ngozi','Zeinab','Marième','Josiane','Afi','Chiamaka','Yasmine','Béatrice','Ramatou','Solange','Dieynaba','Akosua','Larissa','Fanta','Michelle','Oumou','Nadège','Pélagie','Rokhaya','Ifeoma','Sandra','Aminata','Gloria','Hawa','Patricia','Salimata','Vanessa'];
const M = ['Mamadou','Kwame','Chinedu','Serge','Boubacar','Yao','Olivier','Tunde','Cheikh','Franck','Ismaël','Kojo','Landry','Souleymane','Hervé','Obinna','Modou','Patrick','Aziz','Rodrigue','Yannick','Demba','Femi','Armand','Sékou','Bruno','Idrissa','Cédric','Moussa','Junior'];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function daysAgo(max: number) {
  return new Date(Date.now() - Math.random() * max * 86_400_000);
}

async function main() {
  const password = await bcrypt.hash('Demo123!unika', 10);
  const interests = await prisma.interest.findMany();

  // 1. Spread existing demo users' signup dates over the last 7 days.
  const existing = await prisma.user.findMany({
    where: { email: { endsWith: 'demo.unikalove.com' } },
  });
  for (const u of existing) {
    await prisma.user.update({ where: { id: u.id }, data: { createdAt: daysAgo(7) } });
  }
  console.log(`Backdated ${existing.length} existing demo users`);

  // 2. Add 60 more fake users with signup dates over the last 7 days.
  const created: { id: string; gender: Gender }[] = [];
  for (let i = 0; i < 60; i++) {
    const gender: Gender = i % 2 === 0 ? 'FEMALE' : 'MALE';
    const name = gender === 'FEMALE' ? F[(i / 2) | 0] : M[(i / 2) | 0];
    const email = `${name.toLowerCase().replace(/[^a-z]/g, '')}.fake${i}@demo.unikalove.com`;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      created.push({ id: exists.id, gender });
      continue;
    }
    const loc = rand(CITIES);
    const birthYear = 1985 + Math.floor(Math.random() * 18);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: password,
        emailVerifiedAt: new Date(),
        createdAt: daysAgo(7),
        plan: Math.random() < 0.2 ? 'PREMIUM' : 'FREE',
        profile: {
          create: {
            displayName: name,
            gender,
            birthDate: new Date(`${birthYear}-0${1 + ((i % 9) | 0)}-12`),
            bio: 'Ici pour une vraie connexion. Fan de musique, de cuisine et de voyages.',
            city: loc.city,
            country: loc.country,
            latitude: loc.lat + Math.random() * 0.05,
            longitude: loc.lng + Math.random() * 0.05,
            intent: Math.random() < 0.5 ? 'serious' : 'open',
            verified: Math.random() < 0.35,
            completeness: 60 + Math.floor(Math.random() * 40),
            interests: {
              create: [rand(interests), rand(interests)]
                .filter((v, idx, a) => a.findIndex((x) => x.id === v.id) === idx)
                .map((it) => ({ interestId: it.id })),
            },
          },
        },
        preference: {
          create: { genders: [gender === 'FEMALE' ? 'MALE' : 'FEMALE'], maxDistanceKm: 500 },
        },
      },
    });
    created.push({ id: user.id, gender });
  }
  console.log(`Created/kept ${created.length} extra fake users`);

  // 3. Fake mutual matches with mixed statuses + short conversations.
  const females = created.filter((u) => u.gender === 'FEMALE');
  const males = created.filter((u) => u.gender === 'MALE');
  const statuses: MatchStatus[] = [
    ...Array(28).fill('ACTIVE'),
    ...Array(8).fill('UNMATCHED'),
    ...Array(6).fill('EXPIRED'),
  ];
  let matchCount = 0;
  for (let i = 0; i < statuses.length && i < females.length * males.length; i++) {
    const a = females[i % females.length].id;
    const b = males[(i * 7 + (i % 5)) % males.length].id;
    if (a === b) continue;
    const [userAId, userBId] = [a, b].sort();
    const dup = await prisma.match.findUnique({ where: { userAId_userBId: { userAId, userBId } } });
    if (dup) continue;
    const when = daysAgo(7);
    for (const [actorId, targetId] of [
      [a, b],
      [b, a],
    ]) {
      await prisma.swipe.upsert({
        where: { actorId_targetId: { actorId, targetId } },
        create: { actorId, targetId, type: 'LIKE', createdAt: when },
        update: {},
      });
    }
    const match = await prisma.match.create({
      data: {
        userAId,
        userBId,
        status: statuses[i],
        matchedAt: when,
        conversation: { create: { createdAt: when } },
      },
      include: { conversation: true },
    });
    const lines = [
      'Salut ! Ravie de matcher avec toi 😊',
      'Salut ! Comment se passe ta semaine ?',
      'Très bien, et toi ? Tu viens souvent par ici ? 😄',
      'On pourrait prendre un café un de ces jours ?',
    ];
    const nMsgs = 1 + Math.floor(Math.random() * 4);
    for (let m = 0; m < nMsgs; m++) {
      await prisma.message.create({
        data: {
          conversationId: match.conversation!.id,
          senderId: m % 2 === 0 ? a : b,
          content: lines[m % lines.length],
          createdAt: new Date(when.getTime() + (m + 1) * 3_600_000),
          readAt: Math.random() < 0.7 ? new Date(when.getTime() + (m + 2) * 3_600_000) : null,
        },
      });
    }
    matchCount++;
  }
  console.log(`Created ${matchCount} fake matches with conversations`);

  const totals = {
    users: await prisma.user.count(),
    matches: await prisma.match.count(),
    messages: await prisma.message.count(),
  };
  console.log('Totals:', totals);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
