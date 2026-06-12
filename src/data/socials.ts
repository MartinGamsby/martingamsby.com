import type { Lang } from '../i18n/ui';

export type Social = { label: string; url: string };

// Source of truth: wiki/sources/profiles-and-channels.md (extracted from the
// linktrees 2026-06-11). NO raw email anywhere — PLAN.md open question #6.
export const perLang: Record<Lang, Social[]> = {
  fr: [
    { label: 'YouTube', url: 'https://www.youtube.com/@MartinGamsby' },
    { label: 'Bluesky', url: 'https://bsky.app/profile/martin-gamsby.bsky.social' },
    { label: 'X / Twitter', url: 'https://x.com/MartinGamsby' },
    { label: 'Facebook', url: 'https://www.facebook.com/martin.gamsby' },
  ],
  en: [
    { label: 'YouTube', url: 'https://www.youtube.com/@MartinGamsbyEN' },
    { label: 'Bluesky', url: 'https://bsky.app/profile/martingamsby.bsky.social' },
    { label: 'X / Twitter', url: 'https://x.com/Martin_Gamsby' },
    { label: 'Typeshare', url: 'https://typeshare.co/martingamsby' },
  ],
};

export const neutral: Social[] = [
  { label: 'GitHub', url: 'https://github.com/MartinGamsby' },
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/martingamsby/' },
  { label: 'ORCID', url: 'https://orcid.org/0009-0007-4069-9687' },
];
