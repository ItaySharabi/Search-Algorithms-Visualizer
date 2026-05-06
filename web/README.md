# search-algorithms-ts — web visualizer

Portfolio-grade visualizer for the search algorithms in `../src/`. The
algorithms run in a Web Worker, emit a stream of `SearchEvent`s, and the
React UI replays the trace on a scrubbable timeline.

The Vite alias `@algo` resolves to `../src/`, and the worker imports
exclusively from the Node-free barrel `@algo/games/marbles-puzzle/browser.js`
(NOT `index.js`, which pulls `IOHandler` and `node:fs/promises`).

## Commands

```
npm install
npm run dev          # Vite dev server
npm run typecheck
npm run build        # tsc + vite build → dist/
npm run preview      # serve dist/
```

Deploys to GitHub Pages — see `.github/workflows/deploy-web.yml` (added in Phase 4).
