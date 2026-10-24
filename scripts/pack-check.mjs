/**
 * Checks what npm would receive, the way a consumer meets it. Packs every published package (each `prepack` builds it
 * through turbo's cache), asserts what must and must not ship in each tarball, then installs it into a throwaway app
 * and type-checks real usage with a consumer's TypeScript: no `source` condition, no workspace links, only what the
 * tarball declares.
 *
 * The negative cases matter as much as the positive ones: if a declaration failed to resolve, its imports would
 * quietly become `any` and everything would compile, so each `@ts-expect-error` is there to prove the types are real.
 */
import {execFileSync} from 'node:child_process'
import {existsSync} from 'node:fs'
import {mkdir, readdir, readFile, rm, writeFile} from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const WORK = path.join(ROOT, '.pack-check')

const run = (command, args, cwd = ROOT) => execFileSync(command, args, {cwd, encoding: 'utf8'})

const fail = message => {
  console.error(`pack-check: ${message}`)
  process.exit(1)
}

const REQUIRED = {
  '@hzblj/expo-rich-haptics': [
    'package.json',
    'README.md',
    'LICENSE',
    'build/index.js',
    'build/index.d.ts',
    'expo-module.config.json',
    'ios/ExpoRichHaptics.podspec',
    'ios/ExpoRichHapticsModule.swift',
    'ios/Haptic.swift',
    'ios/HapticPrimitive.swift',
    'ios/PatternPlayer.swift',
    'android/build.gradle',
    'android/src/main/AndroidManifest.xml',
    'android/src/main/java/com/hzblj/exporichhaptics/ExpoRichHapticsModule.kt',
  ],
}

// The tests, the TypeScript sources and the build output of the native projects stay home.
const FORBIDDEN = [/^src\//, /^test\//, /\/build\/intermediates\//, /\.DS_Store$/]

const packages = []

for (const directory of await readdir(path.join(ROOT, 'packages'))) {
  const manifestPath = path.join(ROOT, 'packages', directory, 'package.json')

  if (!existsSync(manifestPath)) {
    continue
  }

  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))

  if (!manifest.private) {
    packages.push({directory, name: manifest.name})
  }
}

await rm(WORK, {force: true, recursive: true})
await mkdir(path.join(WORK, 'tarballs'), {recursive: true})

let fileCount = 0

for (const {directory, name} of packages) {
  const tarball = path.join(WORK, 'tarballs', `${directory}.tgz`)

  run('yarn', ['pack', '--out', tarball], path.join(ROOT, 'packages', directory))

  const files = run('tar', ['-tzf', tarball])
    .split('\n')
    .filter(Boolean)
    .map(file => file.replace(/^package\//, ''))

  const missing = (REQUIRED[name] ?? ['package.json', 'README.md']).filter(file => !files.includes(file))
  const leaked = files.filter(file => FORBIDDEN.some(pattern => pattern.test(file)))

  if (missing.length > 0) {
    fail(`${name} is missing:\n  ${missing.join('\n  ')}`)
  }

  if (leaked.length > 0) {
    fail(`${name} must not ship:\n  ${leaked.join('\n  ')}`)
  }

  const packed = JSON.parse(run('tar', ['-xzOf', tarball, 'package/package.json']))

  if (JSON.stringify(packed.dependencies ?? {}).includes('workspace:')) {
    fail(`${name} still declares a workspace: range: it would not install outside this repo`)
  }

  const installed = path.join(WORK, 'node_modules', name)

  await mkdir(installed, {recursive: true})
  run('tar', ['-xzf', tarball, '-C', installed, '--strip-components', '1'])
  fileCount += files.length
}

const consumer = `import {
  HAPTIC_PRIMITIVES,
  HAPTICS,
  type Haptic,
  type HapticPattern,
  type HapticPrimitive,
  haptics,
  useHapticFeedback,
} from '@hzblj/expo-rich-haptics'

const heartbeat: HapticPattern = [{primitive: 'thud'}, {at: 140, intensity: 0.6, primitive: 'thud'}]

export const feel = (haptic: Haptic) => {
  haptics.success()
  haptics.light({intensity: 0.6})
  haptics.play(haptic)
  haptics.play(heartbeat, {intensity: 0.5})
  haptics.prepare('selection')
  haptics.prepare(heartbeat)
  haptics.setEnabled(!haptics.isEnabled())
}

export const names: readonly Haptic[] = HAPTICS
export const primitives: readonly HapticPrimitive[] = HAPTIC_PRIMITIVES

export const useFeedback = (quantity: number, tab: string) => {
  useHapticFeedback(tab, 'selection')
  useHapticFeedback(quantity, (previous, next) => (next > previous ? 'tick' : 'soft'))
  useHapticFeedback(quantity, (_, next) => next === 0 && heartbeat)
}

// @ts-expect-error: not a haptic
haptics.play('buzz')

// @ts-expect-error: not a primitive
export const wrong: HapticPattern = [{primitive: 'buzz'}]

// @ts-expect-error: intensity is a number
haptics.light({intensity: 'strong'})
`

await writeFile(path.join(WORK, 'consumer.tsx'), consumer)
await writeFile(
  path.join(WORK, 'tsconfig.json'),
  JSON.stringify(
    {
      compilerOptions: {noEmit: true, skipLibCheck: true, strict: true},
      extends: 'expo/tsconfig.base',
      include: ['consumer.tsx'],
    },
    null,
    2
  )
)

try {
  run('yarn', ['run', '-T', 'tsc', '-p', WORK])
} catch (error) {
  fail(`a consumer's type check failed:\n${error.stdout}`)
}

await rm(WORK, {force: true, recursive: true})

console.log(`pack-check: ${packages.length} package, ${fileCount} files, and a consumer type-checks`)
