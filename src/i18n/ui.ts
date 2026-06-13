export const LANGS = ['fr', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'fr';

export function otherLang(lang: Lang): Lang {
  return lang === 'fr' ? 'en' : 'fr';
}

// Joins a site path onto the deploy base path (project URL now, '/' after cutover).
const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
export function url(path: string): string {
  return base + (path.startsWith('/') ? path : `/${path}`);
}

export function formatDate(date: Date, lang: Lang): string {
  // Frontmatter dates parse as UTC midnight; format in UTC or they shift a day.
  return date.toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export const ui = {
  fr: {
    siteTagline: 'Tout est connecté',
    heroLine:
      'Je fais beaucoup de choses — logiciel, physique, fiction, musique. Tout est connecté.',
    doorsHeading: 'Par où entrer ?',
    doors: {
      dev: { title: 'Logiciel', blurb: '13+ ans de C++, Python et IA — projets, CV, brevets' },
      physics: { title: 'Physique', blurb: 'Un article + son code : et si l’énergie noire était de la gravité déguisée ?' },
      book: { title: 'Livre', blurb: 'Interverti — un roman, à paraître' },
      music: { title: 'Musique', blurb: 'L’expérience musicale, compositions et vidéos' },
      everything: { title: 'Tout', blurb: 'Le flux complet, sans filtre' },
    },
    nav: { blog: 'Blogue', about: 'À propos', links: 'Liens' },
    latestPosts: 'Derniers billets',
    allPosts: 'Tous les billets',
    blogTitle: 'Blogue',
    filterAll: 'Tout',
    facetNames: { dev: 'logiciel', physics: 'physique', fiction: 'fiction', music: 'musique', ideas: 'idées' },
    readTwin: 'Read this post in English →',
    backToBlog: '← Tous les billets',
    underConstruction: 'Cette page s’étoffera bientôt — en attendant, voici les billets reliés.',
    notFound: 'Page introuvable.',
    goHome: 'Retour à l’accueil',
    switchLang: 'English',
    otherAccounts: 'Comptes en anglais',
    linksIntro: 'Tous mes liens, au même endroit.',
    themeToggle: 'Basculer le thème',
    footerNote: 'Fait au Québec.',
  },
  en: {
    siteTagline: 'Everything is connected',
    heroLine:
      'I do many things — software, physics, fiction, music. Everything is connected.',
    doorsHeading: 'Pick a door',
    doors: {
      dev: { title: 'Software', blurb: '13+ years of C++, Python and AI — projects, CV, patents' },
      physics: { title: 'Physics', blurb: 'A paper + its code: what if dark energy is gravity in disguise?' },
      book: { title: 'Book', blurb: 'Interverti — a novel, coming soon' },
      music: { title: 'Music', blurb: 'The musical experiment, compositions and videos' },
      everything: { title: 'Everything', blurb: 'The full stream, unfiltered' },
    },
    nav: { blog: 'Blog', about: 'About', links: 'Links' },
    latestPosts: 'Latest posts',
    allPosts: 'All posts',
    blogTitle: 'Blog',
    filterAll: 'All',
    facetNames: { dev: 'software', physics: 'physics', fiction: 'fiction', music: 'music', ideas: 'ideas' },
    readTwin: 'Lire ce billet en français →',
    backToBlog: '← All posts',
    underConstruction: 'This page will grow soon — meanwhile, here are the related posts.',
    notFound: 'Page not found.',
    goHome: 'Back home',
    switchLang: 'Français',
    otherAccounts: 'French accounts',
    linksIntro: 'All my links, in one place.',
    themeToggle: 'Toggle theme',
    footerNote: 'Made in Québec.',
  },
} as const;

export function t(lang: Lang) {
  return ui[lang];
}
