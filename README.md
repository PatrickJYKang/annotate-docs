# Annotate user guide

The Annotate user guide with its tutorial videos, published with GitHub Pages at
<https://patrickjykang.github.io/annotate-docs/> in English, French, Spanish and Simplified Chinese.

Each page opens with the complete-workflow video (about 13 minutes, with chapters), followed by the
guide and the twelve short tutorials in the sections they illustrate. The videos are silent and
captioned in the page's language.

## Layout

- `content/<locale>.ts`: the guide text, one file per language (see `content/types.ts` for its structure).
- `index.html`, `fr/`, `es/`, `zh-CN/`: generated pages. Do not edit them by hand.
- `assets/`: stylesheet, search and chapter script, wordmark and icons.
- `videos/<locale>/<id>.mp4` and `.jpg`: 1440 × 930 H.264 web encodes and their posters.
- `data/chapters.json`: chapter start times in seconds for each language's complete-workflow video.
- `scripts/`: the build, the video encoder and a local preview server.

## Updating

This repository is the only copy of the guide: the app's **User guide** button opens this site in the
current UI language. Edit `content/<locale>.ts` (bold UI labels must match the app's catalogs in
`webapp/lib/i18n/messages` of the main repository), or `scripts/build.mjs` for the page chrome and
the complete-workflow section, then rebuild and push:

```sh
node scripts/build.mjs
```

The videos are encoded from the recording masters, which are kept outside Git (see
`docs/demo-recording-handoff.md` in the main repository):

```sh
node scripts/encode-videos.mjs "/path/to/Annotate Demos/youtube-upload/videos.json" --force
```

When the complete-workflow video changes, update `data/chapters.json` from the chapter list that its
build writes (`full-workflow/youtube-<locale>.txt`).

Preview locally with `node scripts/serve.mjs` and open <http://localhost:8765/>. Pages serves the
`main` branch root; pushing to `main` publishes.
