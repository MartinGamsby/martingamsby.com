# Music Experiment Game's presentation page

`/{fr,en}/music/music-experiment-game/` — the game's own page on the site: what the
Steam store page links back to, linked from the music door by a card (image +
"in development" badge). Page: `src/pages/[lang]/music/music-experiment-game.astro`;
all copy (FR + EN, written separately, not translated) and the embedded video IDs:
`src/data/music-game.ts`. Sibling: `/{lang}/music/licenses/` (see
[[github-repos-and-demos]]) — **never move that one**, every game build prints it.

## Status rules (the game isn't out)

- Badge "En développement · pas encore sorti" / "In development · not out yet" +
  a status line: coming to Steam, Windows, **no release date printed** (the game
  repo's target — Steam Next Fest — isn't public/confirmed).
- No store page yet → **no wishlist button**: a dashed "Page Steam à venir" /
  "Steam page coming" pill holds its place. `steamUrl` (null) in
  `src/data/music-game.ts` switches it: set it to the store URL and the page renders
  the real "Wishlist on Steam" button (Font Awesome `steam` icon) and drops the
  "the button will show up here" sentence. Add the trailer embed at the same time.
- Platform + languages: Windows · English · Français (the game ships en + fr).

## Content

Pitch (the game repo's draft store copy) → stage screenshot → "an incremental game
about discovering music" (≈100 ideas on the Ideas tree, the pixel band + audience,
falling-notes videos) → **"Procedural, not generative AI"** callout (the game's own
music-theory rules write the songs; the ideas *are* those rules) → 5 feature cards →
2 screenshots → 3 YouTube embeds → "at a glance" facts → licenses link.

## Screenshots (real, per language)

`src/assets/music-game/{stage,ideas,orchestra}.{en,fr}.webp`, through `astro:assets`
`<Image>` (responsive widths; each links to the full-size file). The FR page shows
the French UI. Made from the game repo with its own tools, never the real
`%APPDATA%`:

```sh
# game repo root; DIR = a scratch folder
python py/tools/seed_save.py finale.listeners multi_instruments lineup_band drums \
  bass_tracks backing_chords chords chord_progression solo instrument_guitar \
  instrument_piano instrument_brass dynamics walking_bass ride_cymbal --appdata DIR
# (FR: copy DIR, set `language = fr_FR` in GamesByGamsby/MusicExperiment/Config/config.ini)
export MSYS_NO_PATHCONV=1 QT_QPA_FONTDIR=C:/Windows/Fonts
export QT_QPA_PLATFORM="offscreen:configfile=/Users/.../screen.json"  # 1920x1080, no drive letter
APPDATA=DIR python py/tools/drive_game.py --quit 60 --grabs GRABS \
  2.5:set:audience=8 24:grab:stage 36:panel:full 44:click:890,166 47:grab:ideas
APPDATA=DIR python py/tools/drive_game.py --quit 50 --grabs GRABS \
  2:midis 2.5:set:audience=8 "3:midi:assets/1812 Overture.mid" 38:grab:orchestra
```

- `--grabs` must be an existing folder (the grab is silently skipped otherwise).
- Offscreen, the song video area stays black → `stage` is cropped to the band strip
  (y 190–580 of 1080); `ideas` = the Accompaniment tab (tab click at 890,166);
  `orchestra` = the MIDI player on the 1812 Overture (dozens of musicians).

## Videos

The game's video pipeline uploads to the "Music YouTube" channel
(`UCX6KsvwOo2U2zrBumOL2bww`, "All The Piano Tutorials"; same URL as the footer's
`src/data/socials.ts` entry). IDs come from the game repo's ledger
`video_cache.uploads.tsv` (never invented); the page picks **public-domain** pieces
(Bach, Debussy, Schubert) rendered as `band_featured` / `featured` variants.
Embeds use `youtube-nocookie.com` + `loading="lazy"` (no JS needed). Check a
candidate is live first: `https://www.youtube.com/oembed?url=…watch?v=ID`.

## The slug

`music-experiment-game` is the game's **working title**. Renaming the game = rename
the page file (and the music door's card link, `src/pages/[lang]/music.astro`);
consider a meta-refresh stub at the old path if the Steam page already links it.
