/*
 * Music Experiment Game's presentation page (`/{lang}/music/music-experiment-game/`):
 * the copy, per language, and the YouTube renders it embeds. The page itself is
 * `src/pages/[lang]/music/music-experiment-game.astro`.
 *
 * Status rules (wiki: music-game-page): the game is NOT out — no release date is
 * printed (the target isn't public), and no wishlist button until the Steam
 * store page exists (`steamUrl` stays null until then; the page swaps the quiet
 * "Steam page coming" note for the button when it's set).
 */
import type { Lang } from '../i18n/ui';

/** The Steam store page, once it exists. Null = "Steam page coming" note. */
export const steamUrl: string | null = null;

/** The upload channel of the game's video pipeline (the game repo's ledger). */
export const videoChannel = {
  name: 'All The Piano Tutorials',
  url: 'https://www.youtube.com/channel/UCX6KsvwOo2U2zrBumOL2bww/', // the footer's "Music YouTube" (src/data/socials.ts)
};

/**
 * Renders by the game's own video pipeline (falling notes, the pixel band), of
 * public-domain pieces. IDs come from the game repo's `video_cache.uploads.tsv`.
 */
export const videos = [
  { id: 'zCH4HInSziA', title: { fr: 'Bach, Invention à deux voix n° 9 (le groupe en pixels + un instrument)', en: 'Bach, Two-Part Invention No. 9 (the pixel band + one instrument)' } },
  { id: 's-en7-6bsxg', title: { fr: 'Debussy, Arabesque n° 1 (un instrument à la fois)', en: 'Debussy, Arabesque No. 1 (one instrument at a time)' } },
  { id: '6e4baQnJK24', title: { fr: 'Schubert, Écossaise (le groupe en pixels + un instrument)', en: 'Schubert, Écossaise (the pixel band + one instrument)' } },
];

interface Copy {
  title: string;
  description: string;
  back: string;
  badge: string;
  badgeNote: string;
  pitch: string;
  status: string;
  steamSoon: string;
  steamSoonNote: string;
  wishlist: string;
  stageAlt: string;
  stageCaption: string;
  aboutHeading: string;
  about: string[];
  proceduralHeading: string;
  procedural: string;
  featuresHeading: string;
  features: { name: string; text: string }[];
  shotsHeading: string;
  ideasAlt: string;
  ideasCaption: string;
  orchestraAlt: string;
  orchestraCaption: string;
  videosHeading: string;
  videosIntro: string;
  videosChannel: string;
  factsHeading: string;
  facts: [string, string][];
  licenses: string;
  licensesNote: string;
}

export const copy: Record<Lang, Copy> = {
  fr: {
    title: 'Music Experiment Game',
    description:
      'Un jeu incrémental où on découvre comment la musique fonctionne en l’écoutant. En développement, s’en vient sur Steam (Windows).',
    back: '← Musique',
    badge: 'En développement',
    badgeNote: 'pas encore sorti',
    pitch:
      'Le jeu compose ses propres chansons. Au début, c’est juste quelques notes. Plus vous écoutez, plus vous débloquez d’idées (un rythme, un instrument, des accords, un solo…), et plus les chansons deviennent riches, jusqu’à ce qu’un groupe au complet les joue.',
    status:
      'Il n’est pas encore sorti. Il va être sur Steam, pour Windows, mais je n’ai pas de date à annoncer. La bande-annonce va arriver avec la page Steam.',
    steamSoon: 'Page Steam à venir',
    steamSoonNote: 'Le bouton pour l’ajouter à votre liste de souhaits va apparaître ici.',
    wishlist: 'Ajouter à ma liste de souhaits sur Steam',
    stageAlt:
      'Capture d’écran du jeu : un groupe en pixel art (clavier, trompettes, guitare, batterie) joue sur scène devant son public.',
    stageCaption: 'Le groupe joue la chanson en cours. Le public arrive petit à petit pendant l’histoire.',
    aboutHeading: 'C’est quoi, le jeu?',
    about: [
      'Au départ, il n’y a presque rien : quelques notes, un seul son. Le jeu écrit ses chansons lui-même, une après l’autre, et c’est le temps passé à écouter qui fait avancer l’histoire.',
      'En avançant, vous débloquez des idées dans l’arbre des idées. Il y en a près d’une centaine : un rythme, un instrument, une ligne de basse, des accords, une gamme, un solo… La chanson d’après les utilise tout de suite, alors on entend vraiment ce que chaque idée change.',
      'Il y a un petit groupe en pixel art qui joue chaque chanson, note par note, et un public qui grossit pendant l’histoire. Et chaque chanson devient une vidéo de notes qui tombent, avec un clavier pour le piano, un manche pour la guitare, les doigtés pour les bois et les cuivres, et une batterie.',
    ],
    proceduralHeading: 'Pas d’IA générative',
    procedural:
      'Aucune chanson ne sort d’un modèle d’IA. J’ai programmé les règles de théorie musicale moi-même, une par une (gammes, accords, rythmes, forme des phrases), et c’est avec ça que le jeu compose. Les idées que vous débloquez, c’est justement ces règles. Quand vous allumez « Basse marchante » ou « Accords d’accompagnement », le compositeur a une règle de plus à utiliser.',
    featuresHeading: 'Dans le jeu',
    features: [
      { name: 'L’arbre des idées', text: 'Six branches (rythme, instruments, accompagnement, solos, gammes, harmonie) et près d’une centaine d’idées à découvrir.' },
      { name: 'Le groupe sur scène', text: 'Chaque musicien joue sa partie en même temps que la musique. Le public grossit au fil de l’histoire.' },
      { name: 'Les vidéos de notes qui tombent', text: 'Chaque instrument a son affichage : clavier, manche de guitare, doigtés des bois et des cuivres, batterie.' },
      { name: 'Le lecteur MIDI', text: 'Ouvrez n’importe quel fichier MIDI et un orchestre en pixels va le jouer, avec un musicien par piste, un chef d’orchestre et un balcon. Un clic sur un musicien le met en sourdine, un clic droit le fait jouer tout seul.' },
      { name: 'Le jeu libre', text: 'Une fois l’histoire finie, vous avez toutes les idées, autant que vous voulez en même temps. Gardez les chansons que vous aimez (♥) et demandez-en une autre dans le même genre.' },
    ],
    shotsHeading: 'Captures d’écran',
    ideasAlt:
      'Capture d’écran de l’arbre des idées, branche Accompagnement : Ligne de basse, Duo, Accords d’accompagnement, Basse marchante, Cymbale ride…',
    ideasCaption: 'L’arbre des idées, branche Accompagnement. Chaque idée allumée change la prochaine chanson.',
    orchestraAlt:
      'Capture d’écran du lecteur MIDI : des dizaines de musiciens en pixel art jouent l’Ouverture 1812, avec un public au balcon.',
    orchestraCaption: 'Le lecteur MIDI qui joue l’Ouverture 1812.',
    videosHeading: 'Des vidéos faites avec le jeu',
    videosIntro:
      'Le jeu sert aussi à faire des vidéos YouTube : les mêmes notes qui tombent et le même groupe en pixels, mais sur des pièces classiques du domaine public.',
    videosChannel: 'Toutes les vidéos sur la chaîne',
    factsHeading: 'En bref',
    facts: [
      ['Statut', 'En développement, pas encore sorti'],
      ['Plateforme', 'Windows, sur Steam'],
      ['Langues', 'Français, anglais'],
      ['Musique', 'Composée par le jeu, avec ses propres règles'],
    ],
    licenses: 'Logiciels libres et code source',
    licensesNote: 'Les composants libres inclus avec le jeu, leurs licences et leur code source.',
  },
  en: {
    title: 'Music Experiment Game',
    description:
      'An incremental game where you figure out how music works by listening to it. In development, coming to Steam (Windows).',
    back: '← Music',
    badge: 'In development',
    badgeNote: 'not out yet',
    pitch:
      'The game writes its own songs. At first it’s just a few notes. The more you listen, the more ideas you unlock (a rhythm, an instrument, chords, a solo…), and the fuller the songs get, until a whole band is playing them.',
    status:
      'It’s not out yet. It’s going to be on Steam, for Windows, but I don’t have a date to announce. The trailer will come with the Steam page.',
    steamSoon: 'Steam page coming',
    steamSoonNote: 'The wishlist button will show up here.',
    wishlist: 'Wishlist on Steam',
    stageAlt:
      'Screenshot of the game: a pixel-art band (keyboard, trumpets, guitar, drums) plays on stage in front of its audience.',
    stageCaption: 'The band plays the current song. The audience shows up little by little during the story.',
    aboutHeading: 'So what is it?',
    about: [
      'At the start there’s almost nothing: a few notes, a single sound. The game writes its songs by itself, one after the other, and the time you spend listening is what moves the story forward.',
      'As you go, you unlock ideas in the Ideas tree. There are close to a hundred: a rhythm, an instrument, a bass line, chords, a scale, a solo… The next song uses them right away, so you really hear what each idea changes.',
      'There’s a small pixel-art band that plays every song, note by note, and an audience that grows during the story. And every song becomes a falling-notes video, with a keyboard for the piano, a fretboard for the guitar, fingering charts for the woodwinds and brass, and a drum kit.',
    ],
    proceduralHeading: 'No generative AI',
    procedural:
      'No song comes out of an AI model. I programmed the music-theory rules myself, one at a time (scales, chords, rhythms, phrase shapes), and that’s what the game composes with. The ideas you unlock are those rules. When you switch on “Walking bass” or “Backing chords”, the composer gets one more rule to use.',
    featuresHeading: 'In the game',
    features: [
      { name: 'The Ideas tree', text: 'Six branches (rhythm, instruments, accompaniment, solos, scales, harmony) and close to a hundred ideas to discover.' },
      { name: 'The band on stage', text: 'Every musician plays their part along with the music. The audience grows as the story goes on.' },
      { name: 'Falling-notes videos', text: 'Each instrument has its own view: piano roll, guitar fretboard, woodwind and brass fingerings, drums.' },
      { name: 'The MIDI player', text: 'Open any MIDI file and a pixel orchestra will play it, with one musician per track, a conductor and a balcony. Click a musician to mute them, right-click to hear them alone.' },
      { name: 'Free play', text: 'Once the story’s done, you get every idea, as many at once as you want. Keep the songs you like (♥) and ask for another one in the same style.' },
    ],
    shotsHeading: 'Screenshots',
    ideasAlt:
      'Screenshot of the Ideas tree, Accompaniment branch: Bass line, Duet, Backing chords, Walking bass, Ride cymbal…',
    ideasCaption: 'The Ideas tree, Accompaniment branch. Every idea you switch on changes the next song.',
    orchestraAlt:
      'Screenshot of the MIDI player: dozens of pixel-art musicians play the 1812 Overture, with an audience in the balcony.',
    orchestraCaption: 'The MIDI player playing the 1812 Overture.',
    videosHeading: 'Videos made with the game',
    videosIntro:
      'The game also makes YouTube videos: the same falling notes and the same pixel band, but on public-domain classical pieces.',
    videosChannel: 'Every video on the channel',
    factsHeading: 'At a glance',
    facts: [
      ['Status', 'In development, not out yet'],
      ['Platform', 'Windows, on Steam'],
      ['Languages', 'English, French'],
      ['Music', 'Written by the game, with its own rules'],
    ],
    licenses: 'Free software and source code',
    licensesNote: 'The free components included with the game, their licenses and their source code.',
  },
};
