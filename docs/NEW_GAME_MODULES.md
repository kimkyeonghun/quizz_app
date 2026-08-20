# New game modules

The six post-MVP game modules live under `src/game-modules` and do not import `App`, the Zustand session store, or the legacy game registry. `src/adapters` connects them to the current host without replacing its phase, timer, locking, host-console, direct-input, Undo, or persistence behavior.

## Integration boundary

- `contracts.ts` defines the portable module contract.
- Each game owns its schema, settings, instructions, runtime reducer, and question view.
- `registry.ts` is the only module-level registration point.
- `questions.ts` loads only the six new data directories.
- UI components receive state and actions through props.

The `feature/remaining-games-modules` branch can be merged independently. Changes that connect these modules to the current application are kept on `feature/remaining-games-current-adapter` so a newer host implementation can replace that adapter without rewriting the games.

## Current game behavior

- `logo_quiz` now owns the three-stage crop behavior that was prototyped by `zoom_image`. The legacy `zoom_image` module remains registered for old sessions but is hidden from the selection screen.
- `movie_poster` supports normalized title masks with `BLUR` and `BLANK` modes. Masks disappear when the answer is revealed.
- `song_drawing` displays one completed image per song. Content records one selected style: `CHILD_DOODLE`, `ADULT_SKETCH`, or `PROFESSIONAL_ILLUSTRATION`.
- `taboo` remains disabled by its feature flag.

## Assets

Local visual and audio samples are original, deterministic demo assets. They are intentionally fictional, are excluded from Git with the rest of `data/` and `public/`, and should be replaced by licensed production content. Every media record must retain `source`, `metadata.license`, and `metadata.credit`.

Regenerate the audio samples with:

```bash
npm exec tsx scripts/generate-new-game-samples.ts
```
