/**
 * Closed vocabularies for the lifestyle screen.
 *
 * These used to be free-text inputs, which made them useless for matching:
 * "Enseignante", "prof" and "teacher" were three different values. Picking from
 * a list keeps the data comparable while still covering the common answers.
 */

/** Grouped so the picker stays scannable at ~70 entries. */
export const OCCUPATIONS: { group: string; items: string[] }[] = [
  {
    group: 'Santé',
    items: [
      'Médecin',
      'Infirmier(ère)',
      'Sage-femme',
      'Pharmacien(ne)',
      'Dentiste',
      'Kinésithérapeute',
      'Laborantin(e)',
      'Aide-soignant(e)',
    ],
  },
  {
    group: 'Éducation',
    items: [
      'Enseignant(e)',
      'Professeur(e) d’université',
      'Formateur(trice)',
      'Éducateur(trice)',
      'Chercheur(se)',
      'Étudiant(e)',
    ],
  },
  {
    group: 'Tech & ingénierie',
    items: [
      'Développeur(se)',
      'Ingénieur(e)',
      'Data analyst',
      'Designer UI/UX',
      'Administrateur(trice) système',
      'Technicien(ne)',
      'Chef(fe) de projet',
    ],
  },
  {
    group: 'Business & finance',
    items: [
      'Entrepreneur(e)',
      'Commerçant(e)',
      'Comptable',
      'Banquier(ère)',
      'Assureur(se)',
      'Consultant(e)',
      'Commercial(e)',
      'Marketeur(se)',
      'Ressources humaines',
      'Logisticien(ne)',
      'Import-export',
    ],
  },
  {
    group: 'Droit & administration',
    items: [
      'Avocat(e)',
      'Juriste',
      'Notaire',
      'Fonctionnaire',
      'Assistant(e) administratif(ve)',
      'Militaire',
      'Policier(ère) / gendarme',
      'Pompier(ère)',
      'Douanier(ère)',
    ],
  },
  {
    group: 'Métiers manuels',
    items: [
      'Mécanicien(ne)',
      'Électricien(ne)',
      'Plombier(ère)',
      'Menuisier(ère)',
      'Maçon(ne)',
      'Soudeur(se)',
      'Chauffeur(se)',
      'Agriculteur(trice)',
      'Éleveur(se)',
      'Pêcheur(se)',
      'Couturier(ère)',
      'Coiffeur(se)',
      'Esthéticien(ne)',
      'Cuisinier(ère)',
      'Boulanger(ère)',
    ],
  },
  {
    group: 'Arts & médias',
    items: [
      'Artiste',
      'Musicien(ne)',
      'Photographe',
      'Vidéaste',
      'Journaliste',
      'Créateur(trice) de contenu',
      'Comédien(ne)',
      'Styliste',
      'Architecte',
    ],
  },
  {
    group: 'Services',
    items: [
      'Hôtellerie / restauration',
      'Tourisme',
      'Vente au détail',
      'Agent(e) immobilier(ère)',
      'Sécurité',
      'Aide à domicile',
      'Sportif(ve) professionnel(le)',
      'Métiers religieux',
      'ONG / humanitaire',
    ],
  },
  {
    group: 'Autre situation',
    items: ['Sans emploi', 'En reconversion', 'Retraité(e)', 'Préfère ne pas dire', 'Autre'],
  },
];

export const EDUCATION_LEVELS = [
  'Sans diplôme',
  'Primaire',
  'Collège / BEPC',
  'Lycée / Baccalauréat',
  'BTS / DUT',
  'Licence',
  'Master',
  'Doctorat',
  'École de commerce',
  'École d’ingénieur',
  'Formation professionnelle',
  'Préfère ne pas dire',
];

export const DENOMINATIONS = [
  'Catholique',
  'Protestant',
  'Évangélique',
  'Pentecôtiste',
  'Orthodoxe',
  'Baptiste',
  'Méthodiste',
  'Adventiste',
  'Presbytérien',
  'Église de réveil',
  'Non-dénominationnel',
  'Autre',
];

export const CHURCH_ATTENDANCE = [
  'Chaque dimanche',
  'Plusieurs fois par semaine',
  'Quelques fois par mois',
  'Occasionnellement',
  'Rarement',
];

export const FAITH_IMPORTANCE = [
  'Ma foi est au centre de ma vie',
  'Très importante',
  'Importante',
  'En cheminement spirituel',
];

export const LANGUAGES = [
  'Français',
  'English',
  'Arabe',
  'Portugais',
  'Espagnol',
  'Wolof',
  'Lingala',
  'Bambara',
  'Douala',
  'Ewondo',
  'Fon',
  'Haoussa',
  'Igbo',
  'Yoruba',
  'Swahili',
  'Peul / Fulfulde',
  'Mooré',
  'Dioula',
  'Kikongo',
  'Tshiluba',
  'Créole',
  'Amharique',
  'Somali',
  'Zoulou',
];

export const TRAITS = [
  'Homme/Femme de prière',
  "Serviteur(e) dans l'église",
  "Famille d'abord",
  'Ambitieux(se)',
  'Attentionné(e)',
  'Généreux(se)',
  'Calme',
  'Drôle',
  'Créatif(ve)',
  'Sportif(ve)',
  'Sociable',
  'Optimiste',
  'Patient(e)',
  'Bienveillant(e)',
  'Humble',
  'Fidèle',
];

/** Flattened for a SearchSelect, keeping the group as a searchable prefix. */
export const OCCUPATION_OPTIONS = OCCUPATIONS.flatMap((g) =>
  g.items.map((label) => ({ value: label, label })),
);
