# Widget Enhancements Design Spec

**Date:** 2026-03-31
**Scope:** Hidden not-found mode, row visibility toggles, i18n, demo page updates, S3/CloudFront deployment

---

## 1. Hidden `notFoundMode`

### Current behavior

`notFoundMode` accepts `'empty'` (default) or `'true-to-size'`. On 404, the widget renders either a "no data" state or a "likely true to size" fallback.

### Change

Add `'hidden'` as a third value. When the API returns 404 and `notFoundMode` is `'hidden'`, the widget sets `display: none` on its root element and renders no inner content.

### Type changes

```typescript
// types.ts
export type NotFoundMode = 'empty' | 'true-to-size' | 'hidden';
```

### ViewModel

New state variant:

```typescript
export interface HiddenViewModel {
  state: 'hidden';
}
```

Add to the `ViewModel` union type.

### Model logic (`model.ts`)

In `handleFetchError`, when `config.notFoundMode === 'hidden'`, return `{ state: 'hidden' }`.

### Rendering (`render.ts`)

When `state === 'hidden'`:
- Set `root.style.display = 'none'`
- Clear inner HTML
- Add CSS class `.pl-size-recommender--state-hidden`

When the widget later receives valid data via `update()` or `refresh()`, reset `root.style.display = ''` so it reappears.

### Config resolution (`config.ts`)

Accept `'hidden'` as valid for `notFoundMode`. No default change — `'empty'` remains the default.

### Data attribute

```html
<div data-size-recommender data-not-found-mode="hidden" ...></div>
```

---

## 2. Row Visibility Toggles

### New config options

Four optional booleans, all defaulting to `true`:

| Option | What it controls | CSS class affected |
|--------|------------------|--------------------|
| `showPill` | Pill badge in header | `.pl-size-recommender__pill` |
| `showScale` | Fit position bar + labels | `.pl-size-recommender__scale` |
| `showRecommendation` | Entire recommendation callout box | `.pl-size-recommender__recommendation` |
| `showSummary` | LLM summary paragraph within recommendation | `.pl-size-recommender__recommendation-summary` |

### Behavior

- `showRecommendation: false` hides the whole recommendation box. `showSummary` is irrelevant when the box is hidden.
- `showSummary: false` with `showRecommendation: true` renders the recommendation box with heading, icon, and confidence — but omits the summary paragraph.
- All four toggles are independent otherwise.
- These apply to all states (`ready`, `fallback-true`, `empty`, `error`). If all visible elements are hidden, the widget still renders its root container (just empty).

### Type changes

```typescript
// types.ts — add to WidgetConfig / WidgetInitOptions
showPill?: boolean;
showScale?: boolean;
showRecommendation?: boolean;
showSummary?: boolean;
```

### Config resolution

Default all four to `true` in `resolveConfig`. Parse `data-show-pill`, `data-show-scale`, `data-show-recommendation`, `data-show-summary` as booleans from data attributes (string `"false"` -> `false`).

### Rendering

Pass the resolved config to the render function. Conditionally skip DOM creation for hidden elements — do not render and then hide with CSS; omit the nodes entirely.

### Data attributes

```html
<div data-size-recommender
     data-show-pill="false"
     data-show-scale="false"
     data-show-recommendation="true"
     data-show-summary="false"
     ...></div>
```

---

## 3. Internationalization

### Languages

English (en), German (de), French (fr), Italian (it), Spanish (es).

### File structure

```
src/
  locales/
    en.json
    de.json
    fr.json
    it.json
    es.json
  messages.ts
```

Each JSON file exports all 24 `WidgetMessages` keys. Example `de.json`:

```json
{
  "title": "Passform",
  "runsSmallLabel": "Faellt klein aus",
  "trueToSizeLabel": "Faellt normal aus",
  "runsLargeLabel": "Faellt gross aus",
  "confidenceText": "{value}% sicher basierend auf echtem Kundenfeedback",
  ...
}
```

### messages.ts changes

```typescript
import en from './locales/en.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import es from './locales/es.json';

const MESSAGE_MAP: Record<string, WidgetMessages> = { en, de, fr, it, es };

export function getMessages(locale: string): WidgetMessages {
  return MESSAGE_MAP[locale] ?? en;
}
```

### Bundle impact

Each locale is ~0.5-1KB minified. Total addition: ~3-4KB uncompressed for four new languages. Acceptable for an embeddable widget.

### Existing behavior preserved

- `locale` init option already exists and defaults to `'en'`
- User-provided `messages` overrides still merge on top of locale messages
- Fallback: user overrides -> locale messages -> English

### esbuild config

Add `loader: { '.json': 'json' }` if not already present (esbuild handles JSON imports by default, but worth being explicit).

### tsconfig

Add `"resolveJsonModule": true` to `compilerOptions` if not already set.

---

## 4. Demo Page Updates

### New controls in sidebar (`dev/index.html`)

Add to the configuration form, below existing controls:

**1. Language selector** (new `<select>`):
- Label: "Language"
- Options: English, Deutsch, Francais, Italiano, Espanol
- Values: `en`, `de`, `fr`, `it`, `es`
- Default: `en`

**2. Missing product mode** (update existing `<select>`):
- Add third option: "Hidden (hide widget)" with value `hidden`

**3. Visibility toggles** (new section with four checkboxes):
- Section label: "Visibility"
- "Show size tag" -> `showPill` (checked by default)
- "Show scale" -> `showScale` (checked by default)
- "Show recommendation" -> `showRecommendation` (checked by default)
- "Show summary" -> `showSummary` (checked by default)

### Demo logic (`dev/main.js`)

- `currentConfig()` reads the new form values and includes them in the config object
- Only include non-default values (e.g., omit `showPill` if it's `true`)
- Embed code generators updated to include new options when they differ from defaults

### Embed code snippets

HTML snippet adds relevant data attributes:
```html
<div data-size-recommender
     data-locale="de"
     data-show-scale="false"
     ...></div>
```

JS snippet adds relevant options:
```javascript
window.SizeRecommender.init({
  locale: 'de',
  showScale: false,
  ...
});
```

---

## 5. Deployment: GitHub Pages -> S3/CloudFront

### Remove

- `.github/workflows/pages.yml`
- `scripts/build-pages.mjs`

### Build script: `scripts/build-site.mjs`

Replaces `build-pages.mjs`. Produces a `site/` directory:

```
site/
  index.html          <- dev/index.html (script paths adjusted)
  dev/main.js         <- dev/main.js
  dist/
    size-recommender.iife.js
    size-recommender.esm.js
```

The HTML `<script>` src paths are rewritten to reference `./dist/size-recommender.iife.js` (relative, works on S3).

### Staging workflow: `.github/workflows/deploy_to_staging.yml`

```yaml
name: Deploy to staging

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  NODE_VERSION: 22
  SLACK_CHANNEL_STAGING: C03BV5KJJQ7

jobs:
  push_to_s3:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v6

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm

      - run: npm ci

      - run: |
          npm run build
          node scripts/build-site.mjs
          rm -f ./dist/*.map

      - uses: aws-actions/configure-aws-credentials@v6
        with:
          aws-region: eu-central-1
          role-to-assume: ${{ secrets.AWS_ROLE_TO_ASSUME }}

      - name: Upload to S3
        run: |
          aws s3 cp ./site s3://parcellab-cdn/playground/selection-guide-ui \
            --recursive \
            --cache-control max-age=86400

      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id E3R5S2BJQI4RDS \
            --paths "/playground/selection-guide-ui/*"

      - name: Set SHORT_SHA
        run: echo "SHORT_SHA=${GITHUB_SHA::7}" >> "$GITHUB_ENV"

      - name: Notify Slack
        uses: darioblanco/slack-deployment@main
        env:
          SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
        with:
          channel_id: ${{ env.SLACK_CHANNEL_STAGING }}
          deployment_description: ${{ toJSON(github.event.head_commit.message) }}
          deployment_name: selection-guide-ui
          environment: staging
          owner: ${{ github.event.pusher.name || 'parcellab-dev-bot' }}
          package: selection-guide-ui
          ref: ${{ github.ref }}
          repo: ${{ github.repository }}
          sha: ${{ github.sha }}
          status_url: "placeholder"
          url: "placeholder"
          version: ${{ env.SHORT_SHA }}
```

### Production workflow: `.github/workflows/deploy_to_prod.yml`

```yaml
name: Deploy to prod (release-tag)

on:
  release:
    types: [published]

env:
  SLACK_CHANNEL_PROD: C03C6SP0R61

jobs:
  push_to_s3:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v6
        with:
          ref: ${{ github.event.release.tag_name }}

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci

      - run: |
          npm run build
          node scripts/build-site.mjs
          rm -f ./dist/*.map

      - uses: aws-actions/configure-aws-credentials@v6
        with:
          aws-region: eu-central-1
          role-to-assume: ${{ secrets.AWS_ROLE_TO_ASSUME }}

      - name: Upload versioned files to S3
        run: |
          aws s3 cp ./dist s3://parcellab-cdn/apps/selection-guide-ui/v1/${{ github.event.release.tag_name }} \
            --recursive --cache-control max-age=86400

      - name: Upload latest plugin files to S3
        run: |
          aws s3 cp ./dist s3://parcellab-cdn/js/selection-guide-ui/v1 \
            --recursive --cache-control max-age=86400

      - name: Upload demo page to S3
        run: |
          aws s3 cp ./site s3://parcellab-cdn/apps/selection-guide-ui/v1/demo \
            --recursive --cache-control max-age=86400

      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id E3R5S2BJQI4RDS \
            --paths "/js/selection-guide-ui/v1/*" "/apps/selection-guide-ui/v1/*"

      - name: Notify Slack
        uses: darioblanco/slack-deployment@main
        env:
          SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
        with:
          channel_id: ${{ env.SLACK_CHANNEL_PROD }}
          deployment_description: ${{ github.event.release.name }}
          deployment_name: selection-guide-ui
          environment: prod
          owner: ${{ github.actor }}
          package: selection-guide-ui
          ref: ${{ github.ref }}
          repo: ${{ github.repository }}
          sha: ${{ github.sha }}
          status_url: "placeholder"
          url: "placeholder"
          version: ${{ github.event.release.tag_name }}
```

### README updates

- Replace GitHub Pages demo URL with S3/CloudFront URL
- Add `notFoundMode: 'hidden'` to the configuration table
- Add `showPill`, `showScale`, `showRecommendation`, `showSummary` to the configuration table
- Add supported `locale` values: `en`, `de`, `fr`, `it`, `es`
- Remove any GitHub Pages setup references

---

## Out of scope

- Dark mode translations
- RTL language support
- Dynamic locale switching without re-init (user can call `update({ locale: 'de' })`)
- New test cases (existing tests should pass; new tests are a follow-up)
