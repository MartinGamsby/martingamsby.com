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
  { id: 'zCH4HInSziA', title: { fr: 'Bach — Invention à deux voix n° 9 : le groupe en pixels + un instrument', en: 'Bach — Two-Part Invention No. 9: the pixel band + one instrument' } },
  { id: 's-en7-6bsxg', title: { fr: 'Debussy — Arabesque n° 1 : un instrument à la fois', en: 'Debussy — Arabesque No. 1: one instrument at a time' } },
  { id: '6e4baQnJK24', title: { fr: 'Schubert — Écossaise : le groupe en pixels + un instrument', en: 'Schubert — Écossaise: the pixel band + one instrument' } },
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
      'Un jeu incrémental sur la découverte de la musique : écoutez, et la musique grandit. En développement, bientôt sur Steam (Windows).',
    back: '← Musique',
    badge: 'En développement',
    badgeNote: 'pas encore sorti',
    pitch:
      'Écoutez, et la musique grandit. Chaque chanson que vous entendez apprend quelque chose de nouveau à la suivante — le rythme, les instruments, les accords, les solos — jusqu’à ce qu’un groupe au complet joue ce que vous avez découvert.',
    status:
      'Le jeu n’est pas encore sorti. Il s’en vient sur Steam, pour Windows — pas de date de sortie pour l’instant. La bande-annonce arrivera avec la page Steam.',
    steamSoon: 'Page Steam à venir',
    steamSoonNote: 'Le bouton pour l’ajouter à votre liste de souhaits apparaîtra ici.',
    wishlist: 'Ajouter à ma liste de souhaits sur Steam',
    stageAlt:
      'Capture d’écran du jeu : un groupe en pixel art — clavier, trompettes, guitare, batterie — joue sur scène, entouré de son public.',
    stageCaption: 'Sur scène, le groupe joue la chanson en cours; le public s’est rassemblé au fil de l’histoire.',
    aboutHeading: 'Un jeu incrémental sur la découverte de la musique',
    about: [
      'Au début, il n’y a presque rien : quelques notes, un seul son. Le jeu compose ses chansons lui-même, une après l’autre, et le temps que vous passez à écouter fait avancer l’histoire. Chaque étape débloque des idées — près d’une centaine — que vous allumez dans l’arbre des idées : un rythme, un nouvel instrument, une ligne de basse, des accords, une gamme, un solo… La chanson suivante s’en sert tout de suite : vous entendez ce que chaque idée change.',
      'Pendant ce temps, un petit groupe en pixel art joue les instruments de chaque chanson, au rythme de ses notes, et un public se rassemble à mesure que l’histoire avance. Chaque chanson devient aussi une vidéo de notes qui tombent : un clavier pour le piano, un manche pour la guitare, des tablatures de doigtés pour les bois et les cuivres, une batterie pour les percussions.',
    ],
    proceduralHeading: 'Procédural, pas de l’IA générative',
    procedural:
      'Aucune chanson ne sort d’un modèle d’IA. Le jeu les écrit avec ses propres règles de théorie musicale — gammes, accords, rythmes, forme des phrases —, programmées une à une. Les idées que vous débloquez, ce sont ces règles : allumer « Basse marchante » ou « Accords d’accompagnement », c’est donner une règle de plus au compositeur.',
    featuresHeading: 'Dans le jeu',
    features: [
      { name: 'L’arbre des idées', text: 'Six branches — rythme, instruments, accompagnement, solos, gammes, harmonie — et près d’une centaine d’idées à découvrir.' },
      { name: 'Le groupe sur scène', text: 'Chaque musicien joue sa partie en même temps que la musique, et le public grossit avec l’histoire.' },
      { name: 'Les vidéos de notes qui tombent', text: 'Clavier, manches de guitare, doigtés des bois et des cuivres, batterie : chaque instrument a son affichage.' },
      { name: 'Le lecteur MIDI', text: 'Ouvrez n’importe quel fichier MIDI et un orchestre en pixels le joue : un musicien par piste, un chef d’orchestre, un balcon. Cliquez un musicien pour le couper, clic droit pour l’entendre seul.' },
      { name: 'Le jeu libre', text: 'Après l’histoire, toutes les idées, autant à la fois que vous voulez. Gardez les chansons que vous aimez (♥) et demandez-en une autre comme celle-là.' },
    ],
    shotsHeading: 'Captures d’écran',
    ideasAlt:
      'Capture d’écran de l’arbre des idées, branche Accompagnement : Ligne de basse, Duo, Accords d’accompagnement, Basse marchante, Cymbale ride…',
    ideasCaption: 'L’arbre des idées, branche Accompagnement : chaque idée allumée change la prochaine chanson.',
    orchestraAlt:
      'Capture d’écran du lecteur MIDI : des dizaines de musiciens en pixel art jouent l’Ouverture 1812, un public au balcon.',
    orchestraCaption: 'Le lecteur MIDI : l’Ouverture 1812 jouée par l’orchestre en pixels.',
    videosHeading: 'Le moteur vidéo du jeu, sur YouTube',
    videosIntro:
      'Les mêmes rendus que dans le jeu — les notes qui tombent, le groupe en pixels — appliqués à des pièces classiques.',
    videosChannel: 'Toutes les vidéos sur la chaîne',
    factsHeading: 'En bref',
    facts: [
      ['Statut', 'En développement, pas encore sorti'],
      ['Plateforme', 'Windows, sur Steam'],
      ['Langues', 'Français, anglais'],
      ['Musique', 'Composée par le jeu, avec ses propres règles'],
    ],
    licenses: 'Logiciels libres et code source',
    licensesNote: 'Les composants libres livrés avec le jeu, leurs licences et leur code source.',
  },
  en: {
    title: 'Music Experiment Game',
    description:
      'An incremental game about discovering music: listen, and the music grows. In development, coming to Steam (Windows).',
    back: '← Music',
    badge: 'In development',
    badgeNote: 'not out yet',
    pitch:
      'Listen, and the music grows. Each song you hear teaches the next one something new — rhythm, instruments, chords, solos — until a whole band is playing what you discovered.',
    status:
      'The game isn’t out yet. It’s coming to Steam, on Windows — no release date for now. The trailer will come with the Steam page.',
    steamSoon: 'Steam page coming',
    steamSoonNote: 'The wishlist button will show up here.',
    wishlist: 'Wishlist on Steam',
    stageAlt:
      'Screenshot of the game: a pixel-art band — keyboard, trumpets, guitar, drums — plays on stage, its audience around it.',
    stageCaption: 'On stage, the band plays the current song; the audience has gathered as the story went on.',
    aboutHeading: 'An incremental game about discovering music',
    about: [
      'At first there’s almost nothing: a few notes, a single sound. The game writes its songs itself, one after another, and the time you spend listening moves the story along. Each step unlocks ideas — close to a hundred of them — that you switch on in the Ideas tree: a rhythm, a new instrument, a bass line, chords, a scale, a solo… The next song uses them right away: you hear what every idea changes.',
      'Meanwhile, a small pixel-art band plays each song’s instruments in time with its notes, and an audience gathers as the story moves on. Every song also becomes a falling-notes video: a keyboard for the piano, a fretboard for the guitar, fingering charts for the woodwinds and brass, a kit for the drums.',
    ],
    proceduralHeading: 'Procedural, not generative AI',
    procedural:
      'No song comes out of an AI model. The game writes them with its own music-theory rules — scales, chords, rhythms, phrase shapes — each one programmed by hand. The ideas you unlock are those rules: switching on “Walking bass” or “Backing chords” gives the composer one more rule to play with.',
    featuresHeading: 'In the game',
    features: [
      { name: 'The Ideas tree', text: 'Six branches — rhythm, instruments, accompaniment, solos, scales, harmony — and close to a hundred ideas to discover.' },
      { name: 'The band on stage', text: 'Every musician plays their part along with the music, and the audience grows with the story.' },
      { name: 'Falling-notes videos', text: 'Piano roll, guitar fretboards, woodwind and brass fingering charts, drums: each instrument gets its own view.' },
      { name: 'The MIDI player', text: 'Open any MIDI file and a pixel orchestra plays it: one musician per track, a conductor, a balcony. Click a musician to mute them, right-click to hear them alone.' },
      { name: 'Free play', text: 'After the story, every idea, as many at once as you like. Keep the songs you love (♥) and ask for another one like it.' },
    ],
    shotsHeading: 'Screenshots',
    ideasAlt:
      'Screenshot of the Ideas tree, Accompaniment branch: Bass line, Duet, Backing chords, Walking bass, Ride cymbal…',
    ideasCaption: 'The Ideas tree, Accompaniment branch: every idea you switch on changes the next song.',
    orchestraAlt:
      'Screenshot of the MIDI player: dozens of pixel-art musicians play the 1812 Overture, an audience in the balcony.',
    orchestraCaption: 'The MIDI player: the 1812 Overture, played by the pixel orchestra.',
    videosHeading: 'The game’s video engine, on YouTube',
    videosIntro:
      'The same renders as in the game — falling notes, the pixel band — applied to classical pieces.',
    videosChannel: 'Every video on the channel',
    factsHeading: 'At a glance',
    facts: [
      ['Status', 'In development, not out yet'],
      ['Platform', 'Windows, on Steam'],
      ['Languages', 'English, French'],
      ['Music', 'Written by the game, with its own rules'],
    ],
    licenses: 'Free software and source code',
    licensesNote: 'The free components shipped with the game, their licenses and their source code.',
  },
};
