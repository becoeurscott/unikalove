/**
 * Master interest catalogue, grouped by category.
 *
 * Onboarding screen 7 renders one section per category, so the list lives here
 * rather than in the seed: `ProfilesService.onModuleInit` upserts it on every
 * boot, which keeps production in sync without ever running the demo seed.
 */
export interface CatalogEntry {
  slug: string;
  labelFr: string;
  labelEn: string;
  category: string;
}

/** Display order and French headings for the categories below. */
export const INTEREST_CATEGORIES: { key: string; labelFr: string }[] = [
  { key: 'sport', labelFr: 'Sport & bien-être' },
  { key: 'musique', labelFr: 'Musique & danse' },
  { key: 'cuisine', labelFr: 'Cuisine & sorties' },
  { key: 'voyage', labelFr: 'Voyage & plein air' },
  { key: 'culture', labelFr: 'Culture & création' },
  { key: 'ecrans', labelFr: 'Films, séries & jeux' },
  { key: 'tech', labelFr: 'Tech & business' },
  { key: 'foi', labelFr: 'Foi & valeurs' },
  { key: 'style', labelFr: 'Style & lifestyle' },
  { key: 'autre', labelFr: 'Autres' },
];

const RAW: [string, string, string, string][] = [
  // --- sport ---
  ['football', 'Football', 'Football', 'sport'],
  ['basketball', 'Basketball', 'Basketball', 'sport'],
  ['course', 'Course à pied', 'Running', 'sport'],
  ['fitness', 'Fitness / musculation', 'Fitness', 'sport'],
  ['yoga', 'Yoga', 'Yoga', 'sport'],
  ['natation', 'Natation', 'Swimming', 'sport'],
  ['velo', 'Vélo', 'Cycling', 'sport'],
  ['arts-martiaux', 'Arts martiaux', 'Martial arts', 'sport'],
  ['tennis', 'Tennis', 'Tennis', 'sport'],
  ['marche-sportive', 'Marche sportive', 'Power walking', 'sport'],
  // Kept from the original seed so existing profile links survive.
  ['sports', 'Sport en général', 'Sports', 'sport'],

  // --- musique ---
  ['afrobeats', 'Afrobeats', 'Afrobeats', 'musique'],
  ['coupe-decale', 'Coupé-décalé', 'Coupe-decale', 'musique'],
  ['rumba', 'Rumba congolaise', 'Congolese rumba', 'musique'],
  ['mbalax', 'Mbalax', 'Mbalax', 'musique'],
  ['amapiano', 'Amapiano', 'Amapiano', 'musique'],
  ['gospel', 'Gospel', 'Gospel', 'musique'],
  ['rap', 'Rap / Hip-hop', 'Rap / Hip-hop', 'musique'],
  ['rnb', 'R&B / Soul', 'R&B / Soul', 'musique'],
  ['jazz', 'Jazz', 'Jazz', 'musique'],
  ['zouk', 'Zouk', 'Zouk', 'musique'],
  ['danse', 'Danse', 'Dancing', 'musique'],
  ['karaoke', 'Karaoké', 'Karaoke', 'musique'],
  ['instrument', "Jouer d'un instrument", 'Playing an instrument', 'musique'],
  ['concerts', 'Concerts & festivals', 'Concerts & festivals', 'musique'],
  // Kept from the original seed so existing profile links survive.
  ['music', 'Musique en général', 'Music', 'musique'],

  // --- cuisine ---
  ['cuisine', 'Cuisiner', 'Cooking', 'cuisine'],
  ['patisserie', 'Pâtisserie', 'Baking', 'cuisine'],
  ['restaurants', 'Restaurants', 'Eating out', 'cuisine'],
  ['street-food', 'Street food', 'Street food', 'cuisine'],
  ['cuisine-africaine', 'Cuisine africaine', 'African cuisine', 'cuisine'],
  ['vegetarien', 'Végétarien / vegan', 'Vegetarian / vegan', 'cuisine'],
  ['cafe', 'Café / thé', 'Coffee / tea', 'cuisine'],
  ['nightlife', 'Sorties & nightlife', 'Nightlife', 'cuisine'],
  ['brunch', 'Brunch entre amis', 'Brunch', 'cuisine'],

  // --- voyage ---
  ['voyage', 'Voyages', 'Travel', 'voyage'],
  ['plage', 'Plage', 'Beach', 'voyage'],
  ['randonnee', 'Randonnée', 'Hiking', 'voyage'],
  ['nature', 'Nature', 'Nature', 'voyage'],
  ['road-trip', 'Road trips', 'Road trips', 'voyage'],
  ['camping', 'Camping', 'Camping', 'voyage'],
  ['safari', 'Safari & faune', 'Safari & wildlife', 'voyage'],
  ['city-break', 'Découvrir des villes', 'City breaks', 'voyage'],

  // --- culture ---
  ['lecture', 'Lecture', 'Reading', 'culture'],
  ['ecriture', 'Écriture', 'Writing', 'culture'],
  ['photographie', 'Photographie', 'Photography', 'culture'],
  ['art', 'Art & peinture', 'Art & painting', 'culture'],
  ['theatre', 'Théâtre', 'Theatre', 'culture'],
  ['histoire', 'Histoire', 'History', 'culture'],
  ['langues', 'Apprendre des langues', 'Languages', 'culture'],
  ['poesie', 'Poésie / slam', 'Poetry / spoken word', 'culture'],
  ['artisanat', 'Artisanat / DIY', 'Crafts / DIY', 'culture'],
  ['musees', 'Musées & expositions', 'Museums & exhibitions', 'culture'],

  // --- ecrans ---
  ['cinema', 'Cinéma', 'Cinema', 'ecrans'],
  ['series', 'Séries', 'TV series', 'ecrans'],
  ['nollywood', 'Nollywood', 'Nollywood', 'ecrans'],
  ['animes', 'Animés / manga', 'Anime / manga', 'ecrans'],
  ['jeux-video', 'Jeux vidéo', 'Video games', 'ecrans'],
  ['jeux-societe', 'Jeux de société', 'Board games', 'ecrans'],
  ['podcasts', 'Podcasts', 'Podcasts', 'ecrans'],
  ['documentaires', 'Documentaires', 'Documentaries', 'ecrans'],

  // --- tech ---
  ['technologie', 'Technologie', 'Technology', 'tech'],
  ['entrepreneuriat', 'Entrepreneuriat', 'Entrepreneurship', 'tech'],
  ['finance', 'Finance & investissement', 'Finance & investing', 'tech'],
  ['ia', 'Intelligence artificielle', 'AI', 'tech'],
  ['crypto', 'Crypto', 'Crypto', 'tech'],
  ['code', 'Développement / code', 'Coding', 'tech'],
  ['marketing', 'Marketing digital', 'Digital marketing', 'tech'],
  ['immobilier', 'Immobilier', 'Real estate', 'tech'],

  // --- foi ---
  ['foi', 'Foi', 'Faith', 'foi'],
  ['eglise', 'Église', 'Church', 'foi'],
  ['mosquee', 'Mosquée', 'Mosque', 'foi'],
  ['spiritualite', 'Spiritualité', 'Spirituality', 'foi'],
  ['famille', 'Famille', 'Family', 'foi'],
  ['benevolat', 'Bénévolat', 'Volunteering', 'foi'],
  ['developpement-personnel', 'Développement personnel', 'Personal growth', 'foi'],
  ['communaute', 'Vie associative', 'Community life', 'foi'],

  // --- style ---
  ['mode', 'Mode', 'Fashion', 'style'],
  ['pagne', 'Pagne & créateurs africains', 'African prints & designers', 'style'],
  ['beaute', 'Beauté & soins', 'Beauty & skincare', 'style'],
  ['coiffure', 'Coiffure & tresses', 'Hair & braids', 'style'],
  ['decoration', 'Décoration', 'Interior design', 'style'],
  ['voitures', 'Voitures', 'Cars', 'style'],
  ['animaux', 'Animaux', 'Pets', 'style'],
  ['jardinage', 'Jardinage', 'Gardening', 'style'],
  ['meditation', 'Bien-être & méditation', 'Wellness & meditation', 'style'],
];

export const INTEREST_CATALOG: CatalogEntry[] = RAW.map(
  ([slug, labelFr, labelEn, category]) => ({ slug, labelFr, labelEn, category }),
);
