# New game modules

The six post-MVP games live under `src/game-modules` and do not import `App`, the Zustand session store, or the legacy game registry.

## Integration boundary

- `contracts.ts` defines the portable module contract.
- Each game owns its schema, settings, instructions, runtime reducer, and question view.
- `registry.ts` is the only module-level registration point.
- `questions.ts` loads only the six new data directories.
- UI components receive state and actions through props.

The `feature/remaining-games-modules` branch can be merged independently. Changes that connect these modules to the current application are kept on `feature/remaining-games-current-adapter` so a newer host implementation can replace that adapter without rewriting the games.

## Assets

Bundled visual and audio samples are original, deterministic demo assets. They are intentionally fictional and should be replaced by licensed production content. Every media record must retain `source`, `metadata.license`, and `metadata.credit`.

Regenerate the audio samples with:

```bash
npm exec tsx scripts/generate-new-game-samples.ts
```
