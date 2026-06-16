import type { Lang } from '../i18n/ui';
import type { IconName } from '../lib/icons';

export type Social = { label: string; url: string; icon: IconName };

// Source of truth: wiki/sources/profiles-and-channels.md (extracted from the
// linktrees 2026-06-11). NO raw email anywhere — PLAN.md open question #6.
export const perLang: Record<Lang, Social[]> = {
  fr: [
    { label: 'YouTube', url: 'https://www.youtube.com/@MartinGamsby', icon: 'youtube' },
    { label: 'Bluesky', url: 'https://bsky.app/profile/martin-gamsby.bsky.social', icon: 'bluesky' },
    { label: 'X / Twitter', url: 'https://x.com/MartinGamsby', icon: 'x' },
    { label: 'Facebook', url: 'https://www.facebook.com/martin.gamsby', icon: 'facebook' },
    { label: 'Interverti', url: 'https://www.amazon.ca/dp/B0H54274BY', icon: 'amazon' },
  ],
  en: [
    { label: 'YouTube', url: 'https://www.youtube.com/@MartinGamsbyEN', icon: 'youtube' },
    { label: 'Bluesky', url: 'https://bsky.app/profile/martingamsby.bsky.social', icon: 'bluesky' },
    { label: 'X / Twitter', url: 'https://x.com/Martin_Gamsby', icon: 'x' },
    { label: 'Typeshare', url: 'https://typeshare.co/martingamsby', icon: 'typeshare' },
    // TODO: { label: 'Interverted', url: 'https://www.amazon.ca/dp/ BLAHBLAHBLAHBLAH', icon: 'amazon' },
  ],
};

export const neutral: Social[] = [
  { label: 'GitHub', url: 'https://github.com/MartinGamsby', icon: 'github' },
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/martingamsby/', icon: 'linkedin' },
  { label: 'ORCID', url: 'https://orcid.org/0009-0007-4069-9687', icon: 'orcid' },
];
