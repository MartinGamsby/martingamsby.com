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

// Resolve a post `image:` value. External URLs (http/https, protocol-relative,
// data:) pass through untouched; bare paths are local public/ assets routed
// through the deploy base like any other internal link.
export function imageUrl(src: string): string {
  return /^(https?:)?\/\/|^data:/.test(src) ? src : url(src);
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

// Experience counters that never go stale: hard-code the start year, recompute the
// running total on every build (this is a static Astro site, so each deploy refreshes
// the numbers — no client JS needed).
const EXPERIENCE_START = {
  professional: 2013, // first paid software role (Mirametrix)
  lifelong: 2004,     // started coding as a life choice / passion
  novel: 2015,        // started writing Interverti
} as const;

export function yearsSince(startYear: number, now: Date = new Date()): number {
  return now.getUTCFullYear() - startYear;
}

export const YEARS = {
  professional: yearsSince(EXPERIENCE_START.professional),
  lifelong: yearsSince(EXPERIENCE_START.lifelong),
  novel: yearsSince(EXPERIENCE_START.novel),
};

export const ui = {
  fr: {
    siteTagline: 'Tout est connecté',
    heroLine:
      'Logiciel, physique, fiction, musique... Tout est connecté.',
    doorsHeading: 'Par où entrer ?',
    doors: {
      dev: { title: 'Logiciel', blurb: `${YEARS.professional}+ ans de C++, Python et IA professionnellement (${YEARS.lifelong}+ par choix de vie) — projets, CV, brevets` },
      physics: { title: 'Physique', blurb: 'Un article + son code : et si l’énergie noire était de la gravité déguisée ?' },
      book: { title: 'Livre', blurb: `Interverti — un roman (écrit il y a ${YEARS.novel} ans), en vente` },
      music: { title: 'Musique', blurb: 'L’expérience musicale, compositions et vidéos' },
      everything: { title: 'Tout', blurb: 'Le flux complet, sans filtre' },
    },
    nav: { book: 'Interverti', guidepour: 'Guide pour', blog: 'Blogue', tags: 'Tags', about: 'À propos', links: 'Liens' },
    latestPosts: 'Derniers billets',
    allPosts: 'Tous les billets',
    relatedHeading: 'Billets reliés',
    tagsHeading: 'Galaxie de tags',
    tagsIntro: 'Chaque tag est une étoile : sa taille suit sa fréquence, sa couleur son thème dominant. Cliquez une étoile pour filtrer les billets.',
    tagsShowing: 'Tag :',
    tagsClear: 'Tous les tags',
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
      'Software, physics, fiction, music... Everything is connected.',
    doorsHeading: 'Pick a door',
    doors: {
      dev: { title: 'Software', blurb: `${YEARS.professional}+ years of C++, Python and AI professionally (${YEARS.lifelong}+ as a way of life) — projects, CV, patents` },
      physics: { title: 'Physics', blurb: 'A paper + its code: what if dark energy is gravity in disguise?' },
      book: { title: 'Book', blurb: `Interverti — a novel (written ${YEARS.novel} years ago), released in French` },
      music: { title: 'Music', blurb: 'The musical experiment, compositions and videos' },
      everything: { title: 'Everything', blurb: 'The full stream, unfiltered' },
    },
    nav: { book: 'Interverted', guidepour: 'Guidance for', blog: 'Blog', tags: 'Tags', about: 'About', links: 'Links' },
    latestPosts: 'Latest posts',
    allPosts: 'All posts',
    relatedHeading: 'Related posts',
    tagsHeading: 'Tag galaxy',
    tagsIntro: 'Each tag is a star: its size follows how often it’s used, its colour its dominant theme. Click a star to filter the posts.',
    tagsShowing: 'Tag:',
    tagsClear: 'All tags',
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
