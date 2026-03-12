# Size Recommender UI

Embeddable size-fit widget for retailer product detail pages.

## Build

```sh
npm install
npm run build
```

Build output:

- `dist/size-recommender.iife.js` for `<script>` embeds
- `dist/size-recommender.esm.js` for module consumers

## Dev Demo

```sh
npm run dev
```

Open [http://localhost:4173](http://localhost:4173). The demo page uses your sample defaults:

- `accountId`: `1619650`
- `articleName`: `Men's Iver Pants (tailored fit)`

The page loads the local IIFE bundle and initializes the widget via
`window.SizeRecommender.init(...)`.

## HTML Embed

```html
<div
  data-size-recommender
  data-account-id="1619650"
  data-article-name="Men's Iver Pants (tailored fit)"
  data-not-found-mode="true-to-size"
  data-messages='{"title":"How It Fits"}'
></div>

<script src="/dist/size-recommender.iife.js" defer></script>
```

The IIFE build auto-initializes any `[data-size-recommender]` element.

## JavaScript API

```js
const widget = window.SizeRecommender.init({
  target: '#size-recommender',
  accountId: 1619650,
  articleName: "Men's Iver Pants (tailored fit)",
  appearance: 'neutral',
  density: 'compact',
  surface: 'subtle',
  notFoundMode: 'true-to-size',
  className: 'merchant-fit-widget',
  theme: {
    backgroundColor: '#f6f6f6',
    textColor: '#222222',
    mutedTextColor: '#666666',
    borderColor: '#e4e4e4',
    radius: '12px'
  },
  messages: {
    title: 'How It Fits',
    recommendationHeadingSmall: 'Consider sizing up'
  }
});

widget.update({
  articleName: "Women's New Product"
});
```

## Config

| Option | Type | Notes |
| --- | --- | --- |
| `target` | `string \| HTMLElement` | Required for JS init |
| `accountId` | `number \| string` | Required |
| `articleName` | `string` | Required. Must match the API article name |
| `locale` | `string` | Defaults to `en` |
| `messages` | `Partial<WidgetMessages>` | Localization and copy overrides |
| `notFoundMode` | `'empty' \| 'true-to-size'` | Controls 404 fallback behavior |
| `apiBaseUrl` | `string` | Defaults to the staging API base URL |
| `appearance` | `'neutral' \| 'colored'` | `neutral` is the compact grayscale default |
| `density` | `'compact' \| 'comfortable'` | `compact` is the default for sidebar placements |
| `surface` | `'subtle' \| 'plain'` | `subtle` adds a light card, `plain` renders inline |
| `className` | `string` | Extra classes added to the root widget element |
| `theme` | `Partial<WidgetTheme>` | CSS-token style overrides such as colors and radius |

## Styling

The widget now renders in light DOM, not Shadow DOM, so host-page typography
inherits naturally and merchants can target the markup directly.

Root classes:

- `.pl-size-recommender`
- `.pl-size-recommender--neutral` / `.pl-size-recommender--colored`
- `.pl-size-recommender--density-compact` / `.pl-size-recommender--density-comfortable`
- `.pl-size-recommender--surface-subtle` / `.pl-size-recommender--surface-plain`
- `.pl-size-recommender--fit-small` / `--fit-true` / `--fit-large`

Element classes:

- `.pl-size-recommender__header`
- `.pl-size-recommender__title`
- `.pl-size-recommender__pill`
- `.pl-size-recommender__scale`
- `.pl-size-recommender__scale-labels`
- `.pl-size-recommender__track`
- `.pl-size-recommender__marker`
- `.pl-size-recommender__confidence`
- `.pl-size-recommender__recommendation`
- `.pl-size-recommender__recommendation-title`
- `.pl-size-recommender__recommendation-summary`

Useful CSS variables:

- `--plsr-background`
- `--plsr-recommendation-background`
- `--plsr-border`
- `--plsr-text`
- `--plsr-muted-text`
- `--plsr-accent`
- `--plsr-badge-background`
- `--plsr-badge-text`
- `--plsr-track`
- `--plsr-track-start`
- `--plsr-track-end`
- `--plsr-radius`

## Behavior

- Renders fit category, bar position, confidence, and recommendation callout
- Uses `llm_summary` as the smaller customer-feedback copy
- Hides product image and return statistics
- Uses compact defaults suitable for PDP sidebars
- Shows a minimal loading state
- Supports two 404 modes:
  - `empty`: render a no-data message
  - `true-to-size`: render a likely true-to-size fallback without confidence
