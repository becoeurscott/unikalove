import { Gender, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const INTERESTS = [
  ['travel', 'Voyage', 'Travel'],
  ['music', 'Musique', 'Music'],
  ['cooking', 'Cuisine', 'Cooking'],
  ['sports', 'Sport', 'Sports'],
  ['reading', 'Lecture', 'Reading'],
  ['movies', 'Cinéma', 'Movies'],
  ['dancing', 'Danse', 'Dancing'],
  ['photography', 'Photographie', 'Photography'],
  ['fashion', 'Mode', 'Fashion'],
  ['entrepreneurship', 'Entrepreneuriat', 'Entrepreneurship'],
  ['faith', 'Foi', 'Faith'],
  ['fitness', 'Fitness', 'Fitness'],
];

const CITIES = [
  { city: 'Douala', country: 'Cameroun', lat: 4.0511, lng: 9.7679 },
  { city: 'Yaoundé', country: 'Cameroun', lat: 3.848, lng: 11.5021 },
  { city: 'Abidjan', country: "Côte d'Ivoire", lat: 5.3599, lng: -4.0083 },
  { city: 'Dakar', country: 'Sénégal', lat: 14.7167, lng: -17.4677 },
  { city: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792 },
  { city: 'Accra', country: 'Ghana', lat: 5.6037, lng: -0.187 },
  { city: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
];

const FIRST_NAMES: Array<[string, Gender]> = [
  ['Aïcha', 'FEMALE'], ['Fatou', 'FEMALE'], ['Amina', 'FEMALE'], ['Grace', 'FEMALE'],
  ['Nadia', 'FEMALE'], ['Clarisse', 'FEMALE'], ['Bineta', 'FEMALE'], ['Chidinma', 'FEMALE'],
  ['Estelle', 'FEMALE'], ['Mariama', 'FEMALE'],
  ['Kofi', 'MALE'], ['Moussa', 'MALE'], ['Jean-Paul', 'MALE'], ['Emeka', 'MALE'],
  ['Ousmane', 'MALE'], ['Thierry', 'MALE'], ['Ibrahim', 'MALE'], ['Samuel', 'MALE'],
  ['Didier', 'MALE'], ['Abdoulaye', 'MALE'],
];

const BIOS = [
  "Passionné(e) de voyages et de bonne cuisine. À la recherche d'une histoire vraie.",
  "J'aime rire, danser et découvrir de nouveaux endroits. Sérieux s'abstenir de passer leur chemin !",
  'Entrepreneur(e) le jour, chef cuisinier le soir. Cherche mon/ma partenaire de vie.',
  "La famille d'abord. Je crois aux vraies connexions, pas aux jeux.",
  'Amoureux(se) de musique et de photographie. Dis-moi ton artiste préféré !',
];

async function main() {
  console.log('Seeding UnikaLove…');

  const interests = await Promise.all(
    INTERESTS.map(([slug, labelFr, labelEn]) =>
      prisma.interest.upsert({
        where: { slug },
        create: { slug, labelFr, labelEn },
        update: { labelFr, labelEn },
      }),
    ),
  );

  const adminPassword = await bcrypt.hash('Admin123!unika', 10);
  await prisma.user.upsert({
    where: { email: 'admin@unikalove.com' },
    create: {
      email: 'admin@unikalove.com',
      passwordHash: adminPassword,
      role: 'SUPER_ADMIN',
      emailVerifiedAt: new Date(),
    },
    update: { role: 'SUPER_ADMIN' },
  });

  const demoPassword = await bcrypt.hash('Demo123!unika', 10);
  const users: { id: string }[] = [];

  for (let i = 0; i < FIRST_NAMES.length; i++) {
    const [name, gender] = FIRST_NAMES[i];
    const loc = CITIES[i % CITIES.length];
    const email = `${name.toLowerCase().replace(/[^a-z]/g, '')}${i}@demo.unikalove.com`;
    const birthYear = 1988 + (i % 14); // ages ~24–38

    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        passwordHash: demoPassword,
        emailVerifiedAt: new Date(),
        plan: i % 5 === 0 ? 'PREMIUM' : 'FREE',
        profile: {
          create: {
            displayName: name,
            gender,
            birthDate: new Date(`${birthYear}-0${(i % 9) + 1}-15`),
            bio: BIOS[i % BIOS.length],
            city: loc.city,
            country: loc.country,
            latitude: loc.lat + (i % 10) * 0.002,
            longitude: loc.lng + (i % 10) * 0.002,
            intent: i % 3 === 0 ? 'serious' : 'open',
            verified: i % 4 === 0,
            completeness: 80,
          },
        },
        preference: {
          create: {
            minAge: 21,
            maxAge: 45,
            maxDistanceKm: 500,
            genders: [gender === 'FEMALE' ? 'MALE' : 'FEMALE'],
          },
        },
      },
      update: {},
      include: { profile: true },
    });
    users.push(user);

    const profile = await prisma.profile.findUniqueOrThrow({ where: { userId: user.id } });
    const picks = [interests[i % interests.length], interests[(i + 3) % interests.length], interests[(i + 7) % interests.length]];
    for (const interest of picks) {
      await prisma.profileInterest.upsert({
        where: { profileId_interestId: { profileId: profile.id, interestId: interest.id } },
        create: { profileId: profile.id, interestId: interest.id },
        update: {},
      });
    }
  }

  // A demo mutual match with a small conversation: Aïcha (0) ↔ Kofi (10).
  const [a, b] = [users[0], users[10]];
  await prisma.swipe.upsert({
    where: { actorId_targetId: { actorId: a.id, targetId: b.id } },
    create: { actorId: a.id, targetId: b.id, type: 'LIKE' },
    update: {},
  });
  await prisma.swipe.upsert({
    where: { actorId_targetId: { actorId: b.id, targetId: a.id } },
    create: { actorId: b.id, targetId: a.id, type: 'LIKE' },
    update: {},
  });
  const [userAId, userBId] = [a.id, b.id].sort();
  const match = await prisma.match.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    create: { userAId, userBId, conversation: { create: {} } },
    update: {},
    include: { conversation: true },
  });
  const convId = match.conversation!.id;
  const existing = await prisma.message.count({ where: { conversationId: convId } });
  if (existing === 0) {
    await prisma.message.createMany({
      data: [
        { conversationId: convId, senderId: a.id, content: 'Salut ! Ravie de matcher avec toi 😊' },
        { conversationId: convId, senderId: b.id, content: 'Salut Aïcha ! Moi aussi. Tu es de Douala ?' },
      ],
    });
  }

  console.log(`Seeded ${users.length} demo users + admin@unikalove.com`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
