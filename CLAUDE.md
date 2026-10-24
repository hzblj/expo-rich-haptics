# expo-rich-haptics

Turborepo + Yarn 4 workspaces for **`@hzblj/expo-rich-haptics`**: haptics for Expo that feel like the platform, UIKit
feedback and Core Haptics patterns on iOS, the system's haptic feedback and composition primitives on Android. React
Native and Expo only, no web.

Every package has its own `CLAUDE.md`: read that one before touching it.

| Path | Package | What lives there |
| --- | --- | --- |
| `packages/expo-rich-haptics/` | `@hzblj/expo-rich-haptics` | The JavaScript API (`src/`), the `ExpoRichHaptics` module (`ios/`, `android/`) and the pattern tests. |
| `apps/example/` | `expo-rich-haptics-example` (private) | Expo Router app built with `@hzblj/kara-ui`: every named haptic, the primitives, preset patterns and a composer, and controls of the app's own wired with `useHapticFeedback`. Runs the package from **source**. |
| `scripts/` | | `pack-check.mjs`: the tarball as npm gets it, and a consumer type-checked against it. |
| `.changeset/`, `.github/workflows/` | | Release notes (`yarn changeset`), CI (Biome, typecheck, tests, pack check, the Android module compiled) and the changesets → npm release. |

`@hzblj/kara-ui` depends on this package (`@hzblj/kara-components` plays its haptics). In the example, Yarn links
kara's range to the workspace (transparent workspaces), so there is one copy of the module, the one being edited. A
version bump here that leaves kara's range (`^0.1.0`) puts a second, published copy under kara: bump kara after
releasing, or the example's kara controls play the old one.

## Commands

```bash
yarn ios / yarn android      # run the example (dev client)
yarn prebuild                # a clean `expo prebuild` of the example, after native or config changes
yarn test                    # the pattern normalization tests (node:test)
yarn typecheck / yarn lint   # tsc, Biome
yarn pack:check              # what npm receives, and a consumer type-check
yarn changeset               # describe a change for the next release
```

## Conventions that bite

**The example runs the package's source; the world runs `build/`.** The package's `exports` names a `source` entry,
which the example's `metro.config.js` maps and its `tsconfig.json` mirrors with `paths`, so nothing waits for a build.
Not a global `source` condition: published packages ship one too, and kara-ui's points at platform-split sources.

**Haptics are felt, not seen.** The simulator and the emulator play nothing: the example lights each tile and
waveform as it plays, so a run there still shows what ran, but only a device tells whether it feels right.

**Publish through Yarn, tag through changesets.** `yarn release` runs `yarn npm publish` in every public workspace and
then `changeset tag`. Never `changeset publish`: its npm call would ship `workspace:` ranges verbatim.

**Docs copy has no em dashes.** Not in the READMEs, the JSDoc in `src/` (it is the API reference), changesets or the
example's captions. Rewrite with a comma, a colon, parentheses or a second sentence. Code comments are exempt.

**Commits are Jan's alone.** Author `Jan Blazej <hello@janblazej.dev>` (set locally in this repo), no co-author or
generated-by lines.

Code style is Biome-enforced (`@hzblj/biome-config`): 2 spaces, 120 cols, single quotes, no semicolons, sorted imports
and object keys. Named exports and `const` arrow functions; `type` over `interface`.
