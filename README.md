# Annotate user guide

The Annotate user guide with its tutorial videos, published with GitHub Pages at
<https://patrickjykang.github.io/annotate-docs/> in English, French, Spanish and Simplified Chinese.

Each page opens with the complete-workflow video (about 13 minutes, with chapters), followed by the
guide and the twelve short tutorials in the sections they illustrate. The videos are silent and
captioned in the page's language.

## Layout

- `index.html`, `fr/`, `es/`, `zh-CN/`: generated pages. Do not edit them by hand.
- `assets/`: stylesheet, search and chapter script, icons.
- `videos/<locale>/<id>.mp4` and `.jpg`: 1440 × 930 H.264 web encodes and their posters.
- `data/chapters.json`: chapter start times in seconds for each language's complete-workflow video.
- `scripts/`: the build, the video encoder and a local preview server.

## Updating

The text comes from the in-app guide in the main repository
(`webapp/components/userguide/content/<locale>.ts`), so the site and the app say the same thing.
Text that exists only on the site (the complete-workflow section, the header links) is in
`scripts/build.mjs`. After changing the guide in the app:

```sh
node scripts/build.mjs ../annotate
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
