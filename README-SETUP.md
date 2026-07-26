# MTAA OS Linting Setup

## What's Included

| File | Purpose |
|------|---------|
| `.oxlintrc.json` | Oxlint config — correctness-only, no react-in-jsx-scope noise |
| `knip.json` | Dead-code detector tuned for Expo Router + Next.js |
| `.github/workflows/ci.yml` | CI — 3 parallel jobs (oxlint, tsc, knip) |
| `package-additions.json` | Scripts + devDeps to merge into your package.json |
| `setup.sh` | Auto-merges everything — no manual editing |

## Install (2 steps)

```bash
cd ~/MTAA_OS_V10

# 1. Extract the ZIP
unzip -o ~/Downloads/oxlint-knip-final.zip

# 2. Run the setup script
bash setup.sh
```

## Why This Config Is Different

Your previous attempts failed because:
1. **Unsupported plugins** (`n`, `unicorn`, `import`, `jsx-a11y`, `promise`) — removed
2. **React version "detect"** — removed (not supported by your oxlint version)
3. **`react-in-jsx-scope`** — **DISABLED**. Your project uses React 17+ new JSX transform. `React` does NOT need to be in scope. This alone eliminates ~5,000 false errors.
4. **Max warnings 0** — All noisy rules (unused-vars, shadow, array-index-key, exhaustive-deps) are set to `off` so you get a clean baseline. Re-enable them one by one as you clean up.

## Available Commands

```bash
npm run lint:ox      # oxlint — correctness errors only
npm run typecheck    # tsc --noEmit
npm run knip         # unused exports, deps, files
npm run lint:ci      # all three sequentially
```

## Gradual Tightening Roadmap

After this passes clean, tighten rules in this order:

1. **Unused imports** → Set `"no-unused-vars": "warn"` in `.oxlintrc.json`, fix imports, then bump to `"error"`
2. **Hook deps** → Set `"react-hooks/exhaustive-deps": "warn"`, fix missing deps, then bump to `"error"`
3. **Array index keys** → Set `"react/no-array-index-key": "warn"`, fix keys, then bump to `"error"`
4. **Type imports** → Set `"typescript/consistent-type-imports": "warn"`
5. **Console logs** → Set `"no-console": ["warn", {"allow": ["error", "warn"]}]`

## CI Status

Push to `main`, `master`, or `develop` — or open a PR — and GitHub Actions will run all three checks in parallel.
