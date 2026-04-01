# Widget Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add hidden not-found mode, row visibility toggles, multi-language support (de/fr/it/es), update the demo page with all new options, and migrate deployment from GitHub Pages to S3/CloudFront.

**Architecture:** Five independent feature areas that touch the same core files (types, config, model, render). We implement bottom-up: types first, then model/config, then render, then demo page, then deployment. i18n is a parallel track touching only messages and locales.

**Tech Stack:** TypeScript, esbuild, Vitest/jsdom, GitHub Actions, AWS S3/CloudFront

**Spec:** `docs/superpowers/specs/2026-03-31-widget-enhancements-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/types.ts` | Modify | Add `'hidden'` to `NotFoundMode`, `HiddenViewModel`, visibility booleans to config interfaces |
| `src/locales/en.json` | Create | English messages (extracted from `messages.ts`) |
| `src/locales/de.json` | Create | German translations |
| `src/locales/fr.json` | Create | French translations |
| `src/locales/it.json` | Create | Italian translations |
| `src/locales/es.json` | Create | Spanish translations |
| `src/messages.ts` | Modify | Import JSON locales, update `MESSAGE_MAP` and `getMessages` |
| `src/config.ts` | Modify | Parse `'hidden'` notFoundMode, parse visibility booleans, add to `ResolvedWidgetConfig` |
| `src/model.ts` | Modify | Return `HiddenViewModel` when `notFoundMode === 'hidden'` and 404 |
| `src/render.ts` | Modify | Handle `'hidden'` state, conditionally skip pill/scale/recommendation/summary |
| `src/widget.ts` | Modify | Reset `display` when transitioning from hidden to visible state |
| `dev/index.html` | Modify | Add language selector, hidden option, visibility checkboxes |
| `dev/main.js` | Modify | Wire new controls, update embed snippet generators |
| `test/widget.test.ts` | Modify | Add tests for hidden mode, visibility toggles, locale loading |
| `scripts/build-site.mjs` | Create | Replaces `build-pages.mjs` for S3 site build |
| `.github/workflows/deploy_to_staging.yml` | Create | S3/CloudFront staging deployment |
| `.github/workflows/deploy_to_prod.yml` | Create | S3/CloudFront production deployment |
| `.github/workflows/pages.yml` | Delete | Remove GitHub Pages workflow |
| `scripts/build-pages.mjs` | Delete | Replaced by `build-site.mjs` |
| `package.json` | Modify | Update `build:pages` -> `build:site` script, update homepage URL |
| `tsconfig.json` | Modify | Add `resolveJsonModule: true` |
| `README.md` | Modify | Document new options, update URLs, remove GitHub Pages references |

---

### Task 1: Add types for hidden mode and visibility toggles

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Add `'hidden'` to `NotFoundMode` type**

In `src/types.ts`, change line 3:

```typescript
// Before:
export type NotFoundMode = 'empty' | 'true-to-size';

// After:
export type NotFoundMode = 'empty' | 'true-to-size' | 'hidden';
```

- [ ] **Step 2: Add `HiddenViewModel` interface and update `ViewModel` union**

In `src/types.ts`, after the `ErrorViewModel` interface (after line 153), add:

```typescript
export interface HiddenViewModel {
  state: 'hidden';
}
```

Update the `ViewModel` union (lines 160-165) to include it:

```typescript
export type ViewModel =
  | LoadingViewModel
  | ReadyViewModel
  | FallbackTrueViewModel
  | EmptyViewModel
  | ErrorViewModel
  | HiddenViewModel;
```

- [ ] **Step 3: Add visibility booleans to config interfaces**

In `src/types.ts`, add four optional booleans to `WidgetConfig` (after line 68, before the closing `}`):

```typescript
  showPill?: boolean;
  showScale?: boolean;
  showRecommendation?: boolean;
  showSummary?: boolean;
```

Add the same four fields (non-optional, resolved to `boolean`) to `ResolvedWidgetConfig` (after line 83, before the closing `}`):

```typescript
  showPill: boolean;
  showScale: boolean;
  showRecommendation: boolean;
  showSummary: boolean;
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: Errors in `config.ts` and `render.ts` because `ResolvedWidgetConfig` now requires the new fields and `ViewModel` has a new variant. This is expected — we'll fix those in subsequent tasks.

- [ ] **Step 5: Commit**

```bash
git add src/types.ts
git commit -m "feat: add types for hidden mode and visibility toggles"
```

---

### Task 2: Create locale JSON files and update messages.ts

**Files:**
- Create: `src/locales/en.json`
- Create: `src/locales/de.json`
- Create: `src/locales/fr.json`
- Create: `src/locales/it.json`
- Create: `src/locales/es.json`
- Modify: `src/messages.ts`
- Modify: `tsconfig.json`

- [ ] **Step 1: Enable JSON module imports in tsconfig**

In `tsconfig.json`, add `"resolveJsonModule": true` to `compilerOptions`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "resolveJsonModule": true,
    "lib": ["DOM", "ES2020"],
    "skipLibCheck": true,
    "noEmit": true,
    "declaration": false,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "useDefineForClassFields": true
  },
  "include": ["src/**/*.ts", "test/**/*.ts", "scripts/**/*.mjs"]
}
```

- [ ] **Step 2: Create `src/locales/en.json`**

```json
{
  "title": "How It Fits",
  "runsSmallLabel": "Runs Small",
  "trueToSizeLabel": "True to Size",
  "runsLargeLabel": "Runs Large",
  "confidenceText": "{value}% confident based on real customer feedback",
  "loading": "Loading fit guidance...",
  "fitCategorySmall": "Likely to run small",
  "fitCategoryTrue": "True to size",
  "fitCategoryLarge": "Likely to run large",
  "fallbackTruePill": "Likely true to size",
  "noDataPill": "No data available",
  "errorPill": "Temporarily unavailable",
  "recommendationHeadingSmall": "Consider sizing up",
  "recommendationHeadingTrue": "Should fit as expected",
  "recommendationHeadingLarge": "Consider sizing down",
  "fallbackTrueHeading": "Should fit as expected",
  "fallbackTrueSummary": "We do not have enough customer feedback for this item yet, so this view falls back to a likely true-to-size fit.",
  "noDataHeading": "No data available",
  "noDataSummary": "We do not have enough customer feedback for this item yet.",
  "errorHeading": "Fit guidance unavailable",
  "errorSummary": "This fit recommendation is temporarily unavailable. Please try again later.",
  "fallbackSummarySmall": "Customer feedback suggests this item may fit smaller than expected.",
  "fallbackSummaryTrue": "Customer feedback suggests this item should fit as expected.",
  "fallbackSummaryLarge": "Customer feedback suggests this item may fit larger than expected."
}
```

- [ ] **Step 3: Create `src/locales/de.json`**

```json
{
  "title": "Passform",
  "runsSmallLabel": "Faellt klein aus",
  "trueToSizeLabel": "Faellt normal aus",
  "runsLargeLabel": "Faellt gross aus",
  "confidenceText": "{value}% sicher basierend auf echtem Kundenfeedback",
  "loading": "Passform wird geladen...",
  "fitCategorySmall": "Faellt wahrscheinlich klein aus",
  "fitCategoryTrue": "Faellt normal aus",
  "fitCategoryLarge": "Faellt wahrscheinlich gross aus",
  "fallbackTruePill": "Wahrscheinlich normale Passform",
  "noDataPill": "Keine Daten verfuegbar",
  "errorPill": "Voruebergehend nicht verfuegbar",
  "recommendationHeadingSmall": "Erwaegen Sie eine groessere Groesse",
  "recommendationHeadingTrue": "Sollte wie erwartet passen",
  "recommendationHeadingLarge": "Erwaegen Sie eine kleinere Groesse",
  "fallbackTrueHeading": "Sollte wie erwartet passen",
  "fallbackTrueSummary": "Wir haben noch nicht genuegend Kundenfeedback fuer diesen Artikel, daher wird eine wahrscheinlich normale Passform angenommen.",
  "noDataHeading": "Keine Daten verfuegbar",
  "noDataSummary": "Wir haben noch nicht genuegend Kundenfeedback fuer diesen Artikel.",
  "errorHeading": "Passformempfehlung nicht verfuegbar",
  "errorSummary": "Diese Passformempfehlung ist voruebergehend nicht verfuegbar. Bitte versuchen Sie es spaeter erneut.",
  "fallbackSummarySmall": "Kundenfeedback deutet darauf hin, dass dieser Artikel kleiner als erwartet ausfallen koennte.",
  "fallbackSummaryTrue": "Kundenfeedback deutet darauf hin, dass dieser Artikel wie erwartet passen sollte.",
  "fallbackSummaryLarge": "Kundenfeedback deutet darauf hin, dass dieser Artikel groesser als erwartet ausfallen koennte."
}
```

- [ ] **Step 4: Create `src/locales/fr.json`**

```json
{
  "title": "Guide des tailles",
  "runsSmallLabel": "Taille petit",
  "trueToSizeLabel": "Taille normalement",
  "runsLargeLabel": "Taille grand",
  "confidenceText": "{value}% de confiance base sur les retours clients",
  "loading": "Chargement du guide des tailles...",
  "fitCategorySmall": "Taille probablement petit",
  "fitCategoryTrue": "Taille normalement",
  "fitCategoryLarge": "Taille probablement grand",
  "fallbackTruePill": "Probablement taille normalement",
  "noDataPill": "Aucune donnee disponible",
  "errorPill": "Temporairement indisponible",
  "recommendationHeadingSmall": "Envisagez une taille au-dessus",
  "recommendationHeadingTrue": "Devrait convenir comme prevu",
  "recommendationHeadingLarge": "Envisagez une taille en dessous",
  "fallbackTrueHeading": "Devrait convenir comme prevu",
  "fallbackTrueSummary": "Nous n'avons pas encore assez de retours clients pour cet article, cette vue suppose donc une taille normale.",
  "noDataHeading": "Aucune donnee disponible",
  "noDataSummary": "Nous n'avons pas encore assez de retours clients pour cet article.",
  "errorHeading": "Guide des tailles indisponible",
  "errorSummary": "Cette recommandation de taille est temporairement indisponible. Veuillez reessayer plus tard.",
  "fallbackSummarySmall": "Les retours clients suggerent que cet article pourrait tailler plus petit que prevu.",
  "fallbackSummaryTrue": "Les retours clients suggerent que cet article devrait convenir comme prevu.",
  "fallbackSummaryLarge": "Les retours clients suggerent que cet article pourrait tailler plus grand que prevu."
}
```

- [ ] **Step 5: Create `src/locales/it.json`**

```json
{
  "title": "Guida alle taglie",
  "runsSmallLabel": "Veste piccolo",
  "trueToSizeLabel": "Veste regolare",
  "runsLargeLabel": "Veste grande",
  "confidenceText": "{value}% di sicurezza basato su feedback reali dei clienti",
  "loading": "Caricamento guida alle taglie...",
  "fitCategorySmall": "Probabilmente veste piccolo",
  "fitCategoryTrue": "Veste regolare",
  "fitCategoryLarge": "Probabilmente veste grande",
  "fallbackTruePill": "Probabilmente veste regolare",
  "noDataPill": "Nessun dato disponibile",
  "errorPill": "Temporaneamente non disponibile",
  "recommendationHeadingSmall": "Considera una taglia in piu",
  "recommendationHeadingTrue": "Dovrebbe vestire come previsto",
  "recommendationHeadingLarge": "Considera una taglia in meno",
  "fallbackTrueHeading": "Dovrebbe vestire come previsto",
  "fallbackTrueSummary": "Non abbiamo ancora abbastanza feedback dei clienti per questo articolo, quindi questa vista presume una vestibilita regolare.",
  "noDataHeading": "Nessun dato disponibile",
  "noDataSummary": "Non abbiamo ancora abbastanza feedback dei clienti per questo articolo.",
  "errorHeading": "Guida alle taglie non disponibile",
  "errorSummary": "Questa raccomandazione sulla taglia e temporaneamente non disponibile. Riprova piu tardi.",
  "fallbackSummarySmall": "Il feedback dei clienti suggerisce che questo articolo potrebbe vestire piu piccolo del previsto.",
  "fallbackSummaryTrue": "Il feedback dei clienti suggerisce che questo articolo dovrebbe vestire come previsto.",
  "fallbackSummaryLarge": "Il feedback dei clienti suggerisce che questo articolo potrebbe vestire piu grande del previsto."
}
```

- [ ] **Step 6: Create `src/locales/es.json`**

```json
{
  "title": "Guia de tallas",
  "runsSmallLabel": "Talla pequena",
  "trueToSizeLabel": "Talla normal",
  "runsLargeLabel": "Talla grande",
  "confidenceText": "{value}% de confianza basado en opiniones reales de clientes",
  "loading": "Cargando guia de tallas...",
  "fitCategorySmall": "Probablemente talla pequena",
  "fitCategoryTrue": "Talla normal",
  "fitCategoryLarge": "Probablemente talla grande",
  "fallbackTruePill": "Probablemente talla normal",
  "noDataPill": "Sin datos disponibles",
  "errorPill": "Temporalmente no disponible",
  "recommendationHeadingSmall": "Considere una talla mas grande",
  "recommendationHeadingTrue": "Deberia ajustar como se espera",
  "recommendationHeadingLarge": "Considere una talla mas pequena",
  "fallbackTrueHeading": "Deberia ajustar como se espera",
  "fallbackTrueSummary": "Aun no tenemos suficientes opiniones de clientes para este articulo, por lo que esta vista asume un ajuste normal.",
  "noDataHeading": "Sin datos disponibles",
  "noDataSummary": "Aun no tenemos suficientes opiniones de clientes para este articulo.",
  "errorHeading": "Guia de tallas no disponible",
  "errorSummary": "Esta recomendacion de talla no esta disponible temporalmente. Intentelo de nuevo mas tarde.",
  "fallbackSummarySmall": "Las opiniones de los clientes sugieren que este articulo podria ser mas pequeno de lo esperado.",
  "fallbackSummaryTrue": "Las opiniones de los clientes sugieren que este articulo deberia ajustar como se espera.",
  "fallbackSummaryLarge": "Las opiniones de los clientes sugieren que este articulo podria ser mas grande de lo esperado."
}
```

- [ ] **Step 7: Update `src/messages.ts` to import JSON locales**

Replace the entire file:

```typescript
import type { WidgetMessages } from './types';
import en from './locales/en.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import es from './locales/es.json';

const MESSAGE_MAP: Record<string, WidgetMessages> = { en, de, fr, it, es };

export function getMessages(locale: string): WidgetMessages {
  return MESSAGE_MAP[locale] ?? MESSAGE_MAP.en;
}
```

- [ ] **Step 8: Verify TypeScript compiles for locale files**

Run: `npx tsc --noEmit`

Expected: May still have errors from Task 1's type changes (config/render), but no errors related to messages or JSON imports.

- [ ] **Step 9: Commit**

```bash
git add src/locales/ src/messages.ts tsconfig.json
git commit -m "feat: add i18n support with de, fr, it, es translations"
```

---

### Task 3: Update config resolution for new options

**Files:**
- Modify: `src/config.ts`

- [ ] **Step 1: Add visibility booleans and hidden mode to `resolveConfig`**

In `src/config.ts`, update the `resolveConfig` function. The return object (lines 75-89) should include the new fields:

```typescript
export function resolveConfig(
  config: WidgetInitOptions,
): ResolvedWidgetConfig {
  const locale = config.locale ?? 'en';
  const baseMessages = getMessages(locale);
  const messages: WidgetMessages = {
    ...baseMessages,
    ...config.messages,
  };
  const productId = resolveProductId(config);

  return {
    target: resolveTarget(config.target),
    accountId: parseAccountId(config.accountId),
    productId,
    locale,
    messages,
    notFoundMode: config.notFoundMode === 'true-to-size'
      ? 'true-to-size'
      : config.notFoundMode === 'hidden'
        ? 'hidden'
        : 'empty',
    apiBaseUrl: (config.apiBaseUrl ?? DEFAULT_API_BASE_URL).replace(/\/$/, ''),
    appearance: parseAppearance(config.appearance),
    density: parseDensity(config.density),
    surface: parseSurface(config.surface),
    theme: config.theme ?? {},
    className: config.className?.trim() ?? '',
    showPill: config.showPill !== false,
    showScale: config.showScale !== false,
    showRecommendation: config.showRecommendation !== false,
    showSummary: config.showSummary !== false,
  };
}
```

- [ ] **Step 2: Update `readConfigFromElement` for new data attributes**

In `src/config.ts`, in the `readConfigFromElement` function, update the `notFoundMode` parsing (lines 125-126):

```typescript
  const notFoundMode = dataset.notFoundMode;
  config.notFoundMode =
    notFoundMode === 'true-to-size'
      ? 'true-to-size'
      : notFoundMode === 'hidden'
        ? 'hidden'
        : 'empty';
```

Add parsing for visibility booleans after the `className` block (after line 151):

```typescript
  if (dataset.showPill === 'false') {
    config.showPill = false;
  }

  if (dataset.showScale === 'false') {
    config.showScale = false;
  }

  if (dataset.showRecommendation === 'false') {
    config.showRecommendation = false;
  }

  if (dataset.showSummary === 'false') {
    config.showSummary = false;
  }
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: Errors should now only be in `render.ts` (unhandled `'hidden'` state in switch). Model and config should compile cleanly.

- [ ] **Step 4: Commit**

```bash
git add src/config.ts
git commit -m "feat: config resolution for hidden mode and visibility toggles"
```

---

### Task 4: Update model to handle hidden state

**Files:**
- Modify: `src/model.ts`

- [ ] **Step 1: Add hidden case to `handleFetchError`**

In `src/model.ts`, update the `handleFetchError` function (lines 142-172). Add the hidden case before the existing `true-to-size` check:

```typescript
export function handleFetchError(
  error: unknown,
  config: ResolvedWidgetConfig,
): ViewModel {
  if (error instanceof FetchError && error.code === 'not-found') {
    if (config.notFoundMode === 'hidden') {
      return { state: 'hidden' };
    }

    if (config.notFoundMode === 'true-to-size') {
      return {
        state: 'fallback-true',
        fitCategory: 'true',
        pillText: config.messages.fallbackTruePill,
        recommendationHeading: config.messages.fallbackTrueHeading,
        summary: config.messages.fallbackTrueSummary,
        position: DEFAULT_POSITIONS.true,
      };
    }

    return {
      state: 'empty',
      pillText: config.messages.noDataPill,
      recommendationHeading: config.messages.noDataHeading,
      summary: config.messages.noDataSummary,
    };
  }

  return {
    state: 'error',
    pillText: config.messages.errorPill,
    recommendationHeading: config.messages.errorHeading,
    summary: config.messages.errorSummary,
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: Only `render.ts` should have errors now (unhandled `'hidden'` in switch).

- [ ] **Step 3: Commit**

```bash
git add src/model.ts
git commit -m "feat: model returns hidden view model on 404 with hidden mode"
```

---

### Task 5: Update renderer for hidden state and visibility toggles

**Files:**
- Modify: `src/render.ts`

- [ ] **Step 1: Import HiddenViewModel type**

In `src/render.ts`, update the import (line 1-11) to include `HiddenViewModel`:

```typescript
import type {
  EmptyViewModel,
  ErrorViewModel,
  FallbackTrueViewModel,
  FitCategory,
  HiddenViewModel,
  LoadingViewModel,
  ReadyViewModel,
  ResolvedWidgetConfig,
  ViewModel,
  WidgetTheme,
} from './types';
```

- [ ] **Step 2: Update `appendHeader` to respect `showPill`**

In `src/render.ts`, update the `appendHeader` function (lines 397-413) to accept a config parameter and check `showPill`:

```typescript
function appendHeader(
  container: HTMLElement,
  config: ResolvedWidgetConfig,
  pillText?: string,
): void {
  const header = createElement('div', `${ROOT_CLASS}__header`);
  const title = createElement('h2', `${ROOT_CLASS}__title`, config.messages.title);
  header.appendChild(title);

  if (pillText && config.showPill) {
    header.appendChild(
      createElement('div', `${ROOT_CLASS}__pill`, pillText),
    );
  }

  container.appendChild(header);
}
```

- [ ] **Step 3: Update `appendRecommendation` to accept `showSummary`**

In `src/render.ts`, update the `appendRecommendation` function (lines 477-513) to accept and check `showSummary`:

```typescript
function appendRecommendation(
  container: HTMLElement,
  heading: string,
  summary: string,
  fitCategory?: FitCategory,
  confidenceText?: string,
  showSummary = true,
): void {
  const recommendation = createElement('section', `${ROOT_CLASS}__recommendation`);
  const header = createElement('div', `${ROOT_CLASS}__recommendation-header`);
  const titleRow = createElement('div', `${ROOT_CLASS}__recommendation-title-row`);
  const icon = recommendationIcon(fitCategory);

  if (icon) {
    titleRow.appendChild(icon);
  }

  titleRow.appendChild(
    createElement('h3', `${ROOT_CLASS}__recommendation-title`, heading),
  );
  header.appendChild(titleRow);

  if (confidenceText) {
    header.appendChild(
      createElement(
        'div',
        `${ROOT_CLASS}__recommendation-meta`,
        confidenceText,
      ),
    );
  }

  recommendation.appendChild(header);

  if (showSummary) {
    recommendation.appendChild(
      createElement('p', `${ROOT_CLASS}__recommendation-summary`, summary),
    );
  }

  container.appendChild(recommendation);
}
```

- [ ] **Step 4: Update `renderReadyLike` to use visibility toggles**

In `src/render.ts`, update the `renderReadyLike` function (lines 530-544):

```typescript
function renderReadyLike(
  mount: HTMLElement,
  config: ResolvedWidgetConfig,
  viewModel: ReadyViewModel | FallbackTrueViewModel,
): void {
  appendHeader(mount, config, viewModel.pillText);

  if (config.showScale) {
    appendScale(mount, config, viewModel.position);
  }

  if (config.showRecommendation) {
    appendRecommendation(
      mount,
      viewModel.recommendationHeading,
      viewModel.summary,
      viewModel.fitCategory,
      'confidenceText' in viewModel ? viewModel.confidenceText : undefined,
      config.showSummary,
    );
  }
}
```

- [ ] **Step 5: Update `renderMessageOnly` to use visibility toggles**

In `src/render.ts`, update the `renderMessageOnly` function (lines 546-553):

```typescript
function renderMessageOnly(
  mount: HTMLElement,
  config: ResolvedWidgetConfig,
  viewModel: EmptyViewModel | ErrorViewModel,
): void {
  appendHeader(mount, config, viewModel.pillText);

  if (config.showRecommendation) {
    appendRecommendation(
      mount,
      viewModel.recommendationHeading,
      viewModel.summary,
      undefined,
      undefined,
      config.showSummary,
    );
  }
}
```

- [ ] **Step 6: Add hidden state handling in `WidgetRenderer.render`**

In `src/render.ts`, update the `render` method of `WidgetRenderer` (lines 577-594):

```typescript
  render(config: ResolvedWidgetConfig, viewModel: ViewModel): void {
    if (viewModel.state === 'hidden') {
      this.mount.className = rootClassName(config, viewModel);
      this.mount.replaceChildren();
      this.mount.style.display = 'none';
      return;
    }

    this.mount.style.display = '';
    this.mount.className = rootClassName(config, viewModel);
    applyTheme(this.mount, config.theme);
    this.mount.replaceChildren();

    switch (viewModel.state) {
      case 'loading':
        renderLoading(this.mount, config, viewModel);
        break;
      case 'ready':
      case 'fallback-true':
        renderReadyLike(this.mount, config, viewModel);
        break;
      case 'empty':
      case 'error':
        renderMessageOnly(this.mount, config, viewModel);
        break;
    }
  }
```

- [ ] **Step 7: Update `viewModelFitCategory` to handle hidden state**

In `src/render.ts`, update `viewModelFitCategory` (lines 352-360):

```typescript
function viewModelFitCategory(viewModel: ViewModel): FitCategory {
  switch (viewModel.state) {
    case 'ready':
    case 'fallback-true':
      return viewModel.fitCategory;
    default:
      return 'unknown';
  }
}
```

This already handles `'hidden'` via the `default` case, so no change needed here. But verify TypeScript is satisfied.

- [ ] **Step 8: Verify TypeScript compiles cleanly**

Run: `npx tsc --noEmit`

Expected: PASS — no errors.

- [ ] **Step 9: Commit**

```bash
git add src/render.ts
git commit -m "feat: renderer handles hidden state and visibility toggles"
```

---

### Task 6: Write tests for new features

**Files:**
- Modify: `test/widget.test.ts`

- [ ] **Step 1: Add test for hidden mode on 404**

Add after the existing "renders likely true-to-size fallback" test (after line 121):

```typescript
  it('hides widget completely on 404 when notFoundMode is hidden', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 404)));

    document.body.innerHTML = '<div id="mount"></div>';
    init({
      target: '#mount',
      accountId: 1619650,
      productId: 'Unknown article',
      notFoundMode: 'hidden',
    });

    const host = document.querySelector<HTMLElement>('#mount');

    await vi.waitFor(() => {
      const root = host?.querySelector<HTMLElement>('.pl-size-recommender');
      expect(root?.style.display).toBe('none');
      expect(root?.textContent).toBe('');
    });
  });
```

- [ ] **Step 2: Add test for hidden mode recovery on update**

Add after the previous test:

```typescript
  it('un-hides widget when updated from hidden to valid data', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, 404))
      .mockResolvedValueOnce(jsonResponse(recommendationResponse()));

    vi.stubGlobal('fetch', fetchMock);

    document.body.innerHTML = '<div id="mount"></div>';
    const widget = init({
      target: '#mount',
      accountId: 1619650,
      productId: 'Unknown article',
      notFoundMode: 'hidden',
    });

    const host = document.querySelector<HTMLElement>('#mount');

    await vi.waitFor(() => {
      const root = host?.querySelector<HTMLElement>('.pl-size-recommender');
      expect(root?.style.display).toBe('none');
    });

    await widget.update({ productId: "Men's Iver Pants (tailored fit)" });

    await vi.waitFor(() => {
      const root = host?.querySelector<HTMLElement>('.pl-size-recommender');
      expect(root?.style.display).toBe('');
      expect(host?.textContent).toContain('How It Fits');
    });
  });
```

- [ ] **Step 3: Add test for visibility toggles**

```typescript
  it('hides pill, scale, and summary when visibility toggles are false', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(recommendationResponse())),
    );

    document.body.innerHTML = '<div id="mount"></div>';
    init({
      target: '#mount',
      accountId: 1619650,
      productId: "Men's Iver Pants (tailored fit)",
      showPill: false,
      showScale: false,
      showSummary: false,
    });

    const host = document.querySelector<HTMLElement>('#mount');

    await vi.waitFor(() => {
      expect(host?.querySelector('.pl-size-recommender__pill')).toBeNull();
      expect(host?.querySelector('.pl-size-recommender__scale')).toBeNull();
      expect(
        host?.querySelector('.pl-size-recommender__recommendation-summary'),
      ).toBeNull();
      expect(host?.querySelector('.pl-size-recommender__recommendation')).not.toBeNull();
      expect(host?.textContent).toContain('Consider sizing up');
    });
  });
```

- [ ] **Step 4: Add test for hiding entire recommendation**

```typescript
  it('hides entire recommendation box when showRecommendation is false', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(recommendationResponse())),
    );

    document.body.innerHTML = '<div id="mount"></div>';
    init({
      target: '#mount',
      accountId: 1619650,
      productId: "Men's Iver Pants (tailored fit)",
      showRecommendation: false,
    });

    const host = document.querySelector<HTMLElement>('#mount');

    await vi.waitFor(() => {
      expect(host?.querySelector('.pl-size-recommender__recommendation')).toBeNull();
      expect(host?.querySelector('.pl-size-recommender__scale')).not.toBeNull();
    });
  });
```

- [ ] **Step 5: Add test for locale loading**

```typescript
  it('loads German locale messages', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          recommendationResponse({
            size_fit_category: 'True to size',
            smoothed_fit_position: 0,
          }),
        ),
      ),
    );

    document.body.innerHTML = '<div id="mount"></div>';
    init({
      target: '#mount',
      accountId: 1619650,
      productId: 'Test product',
      locale: 'de',
    });

    const host = document.querySelector<HTMLElement>('#mount');

    await vi.waitFor(() => {
      expect(host?.textContent).toContain('Passform');
      expect(host?.textContent).toContain('Sollte wie erwartet passen');
      expect(host?.textContent).toContain('Faellt klein aus');
    });
  });
```

- [ ] **Step 6: Run all tests**

Run: `npm test`

Expected: All tests pass (original + 5 new tests).

- [ ] **Step 7: Commit**

```bash
git add test/widget.test.ts
git commit -m "test: add tests for hidden mode, visibility toggles, and i18n"
```

---

### Task 7: Update demo page with new controls

**Files:**
- Modify: `dev/index.html`
- Modify: `dev/main.js`

- [ ] **Step 1: Add language selector to `dev/index.html`**

In `dev/index.html`, add a language `<select>` after the Account ID label (after line 99, before the "Missing product" label):

```html
            <label class="grid gap-1.5 text-sm font-semibold text-navy-500">
              Language
              <select
                id="locale"
                name="locale"
                class="field bg-white border border-navy-200 rounded-lg h-11 px-3 text-navy-800 font-normal text-sm"
              >
                <option value="en">English</option>
                <option value="de">Deutsch</option>
                <option value="fr">Francais</option>
                <option value="it">Italiano</option>
                <option value="es">Espanol</option>
              </select>
            </label>
```

- [ ] **Step 2: Add "hidden" option to missing product select**

In `dev/index.html`, add a third `<option>` to the `#not-found-mode` select (after line 109):

```html
                <option value="hidden">Hide widget entirely</option>
```

- [ ] **Step 3: Add visibility checkboxes to `dev/index.html`**

In `dev/index.html`, add a visibility section after the Surface select (after line 148, before the closing `</div>` of `space-y-3.5`):

```html
            <fieldset class="space-y-2">
              <legend class="text-xs font-semibold text-navy-500 uppercase tracking-wide">Visibility</legend>
              <label class="flex items-center gap-2 text-sm text-navy-700 cursor-pointer">
                <input type="checkbox" id="show-pill" checked class="accent-navy-800" />
                Show size tag
              </label>
              <label class="flex items-center gap-2 text-sm text-navy-700 cursor-pointer">
                <input type="checkbox" id="show-scale" checked class="accent-navy-800" />
                Show scale
              </label>
              <label class="flex items-center gap-2 text-sm text-navy-700 cursor-pointer">
                <input type="checkbox" id="show-recommendation" checked class="accent-navy-800" />
                Show recommendation
              </label>
              <label class="flex items-center gap-2 text-sm text-navy-700 cursor-pointer">
                <input type="checkbox" id="show-summary" checked class="accent-navy-800" />
                Show summary
              </label>
            </fieldset>
```

- [ ] **Step 4: Update `dev/main.js` — add element references**

In `dev/main.js`, add these references after the existing element queries (after line 26):

```javascript
const localeSelect = document.querySelector('#locale');
const showPillCheckbox = document.querySelector('#show-pill');
const showScaleCheckbox = document.querySelector('#show-scale');
const showRecommendationCheckbox = document.querySelector('#show-recommendation');
const showSummaryCheckbox = document.querySelector('#show-summary');
```

- [ ] **Step 5: Update `currentConfig()` in `dev/main.js`**

Replace the `currentConfig` function (lines 34-44):

```javascript
function currentConfig() {
  return {
    target: mount,
    accountId: accountIdInput.value || DEFAULT_ACCOUNT_ID,
    productId: productIdInput.value || DEFAULT_PRODUCT_ID,
    notFoundMode: notFoundModeSelect.value,
    appearance: appearanceSelect.value,
    density: densitySelect.value,
    surface: surfaceSelect.value,
    locale: localeSelect.value,
    showPill: showPillCheckbox.checked,
    showScale: showScaleCheckbox.checked,
    showRecommendation: showRecommendationCheckbox.checked,
    showSummary: showSummaryCheckbox.checked,
  };
}
```

- [ ] **Step 6: Update `htmlEmbedSnippet()` in `dev/main.js`**

Replace the function (lines 62-73):

```javascript
function htmlEmbedSnippet(config) {
  const attrs = [
    `data-size-recommender`,
    `data-account-id="${escapeAttribute(config.accountId)}"`,
    `data-product-id="${escapeAttribute(config.productId)}"`,
    `data-not-found-mode="${escapeAttribute(config.notFoundMode)}"`,
    `data-appearance="${escapeAttribute(config.appearance)}"`,
    `data-density="${escapeAttribute(config.density)}"`,
    `data-surface="${escapeAttribute(config.surface)}"`,
  ];

  if (config.locale && config.locale !== 'en') {
    attrs.push(`data-locale="${escapeAttribute(config.locale)}"`);
  }
  if (!config.showPill) attrs.push(`data-show-pill="false"`);
  if (!config.showScale) attrs.push(`data-show-scale="false"`);
  if (!config.showRecommendation) attrs.push(`data-show-recommendation="false"`);
  if (!config.showSummary) attrs.push(`data-show-summary="false"`);

  return `<div\n  ${attrs.join('\n  ')}\n></div>\n<script ${scriptAttributes()}><\/script>`;
}
```

- [ ] **Step 7: Update `jsEmbedSnippet()` in `dev/main.js`**

Replace the function (lines 75-89):

```javascript
function jsEmbedSnippet(config) {
  const options = [
    `    target: '#size-recommender'`,
    `    accountId: ${JSON.stringify(config.accountId)}`,
    `    productId: ${JSON.stringify(config.productId)}`,
    `    notFoundMode: ${JSON.stringify(config.notFoundMode)}`,
    `    appearance: ${JSON.stringify(config.appearance)}`,
    `    density: ${JSON.stringify(config.density)}`,
    `    surface: ${JSON.stringify(config.surface)}`,
  ];

  if (config.locale && config.locale !== 'en') {
    options.push(`    locale: ${JSON.stringify(config.locale)}`);
  }
  if (!config.showPill) options.push(`    showPill: false`);
  if (!config.showScale) options.push(`    showScale: false`);
  if (!config.showRecommendation) options.push(`    showRecommendation: false`);
  if (!config.showSummary) options.push(`    showSummary: false`);

  return `<div id="size-recommender"></div>
<script src="${embedBundleUrl()}"><\/script>
<script>
  window.SizeRecommender.init({
${options.join(',\n')}
  });
<\/script>`;
}
```

- [ ] **Step 8: Update `renderWidget()` to sync new form fields**

In `dev/main.js`, update the `renderWidget` function. After the existing form sync lines (lines 169-174), add:

```javascript
  localeSelect.value = config.locale || 'en';
  showPillCheckbox.checked = config.showPill !== false;
  showScaleCheckbox.checked = config.showScale !== false;
  showRecommendationCheckbox.checked = config.showRecommendation !== false;
  showSummaryCheckbox.checked = config.showSummary !== false;
```

- [ ] **Step 9: Add new elements to event listener array**

In `dev/main.js`, update the event listener array (line 218) to include the new elements:

```javascript
[productIdInput, accountIdInput, notFoundModeSelect, appearanceSelect, densitySelect, surfaceSelect, localeSelect, showPillCheckbox, showScaleCheckbox, showRecommendationCheckbox, showSummaryCheckbox]
  .filter(Boolean)
  .forEach((element) => {
    element.addEventListener('input', () => {
      updateEmbedCodePreview();
    });
    element.addEventListener('change', () => {
      updateEmbedCodePreview();
    });
  });
```

- [ ] **Step 10: Test manually**

Run: `npm run dev`

Open `http://localhost:4173`. Verify:
1. Language selector changes widget text
2. "Hidden" option hides the widget on "Test missing product"
3. Visibility checkboxes toggle individual sections
4. Embed code snippets reflect all options

- [ ] **Step 11: Commit**

```bash
git add dev/index.html dev/main.js
git commit -m "feat: add language, hidden mode, and visibility controls to demo page"
```

---

### Task 8: Replace GitHub Pages with S3/CloudFront deployment

**Files:**
- Delete: `.github/workflows/pages.yml`
- Delete: `scripts/build-pages.mjs`
- Create: `scripts/build-site.mjs`
- Create: `.github/workflows/deploy_to_staging.yml`
- Create: `.github/workflows/deploy_to_prod.yml`
- Modify: `package.json`

- [ ] **Step 1: Delete GitHub Pages workflow and build script**

```bash
rm .github/workflows/pages.yml
rm scripts/build-pages.mjs
```

- [ ] **Step 2: Create `scripts/build-site.mjs`**

```javascript
import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const cwd = fileURLToPath(new URL('..', import.meta.url));
const siteDir = path.join(cwd, 'site');
const distDir = path.join(siteDir, 'dist');
const devDir = path.join(siteDir, 'dev');

await rm(siteDir, { force: true, recursive: true });
await mkdir(distDir, { recursive: true });
await mkdir(devDir, { recursive: true });

await cp(path.join(cwd, 'dist', 'size-recommender.iife.js'), path.join(distDir, 'size-recommender.iife.js'));
await cp(path.join(cwd, 'dist', 'size-recommender.esm.js'), path.join(distDir, 'size-recommender.esm.js'));
await cp(path.join(cwd, 'dev', 'index.html'), path.join(siteDir, 'index.html'));
await cp(path.join(cwd, 'dev', 'main.js'), path.join(devDir, 'main.js'));
```

- [ ] **Step 3: Update `package.json` scripts**

In `package.json`, replace the `build:pages` script:

```json
  "scripts": {
    "build": "rm -rf dist && node scripts/build.mjs && tsc -p tsconfig.types.json",
    "build:site": "node scripts/build-site.mjs",
    "dev": "node scripts/dev.mjs",
    "test": "vitest run --environment jsdom"
  },
```

- [ ] **Step 4: Create `.github/workflows/deploy_to_staging.yml`**

```yaml
name: Deploy to staging

on:
  push:
    branches:
      - main
  workflow_dispatch:

env:
  BOT_NAME: parcellab-dev-bot
  NODE_VERSION: 22
  SLACK_CHANNEL_STAGING: C03BV5KJJQ7

jobs:
  push_to_s3:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - name: Checkout
        uses: actions/checkout@v6

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: |
          npm run build
          npm run build:site

      - name: AWS - authentication
        uses: aws-actions/configure-aws-credentials@v6
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

      - name: Notify deployment
        uses: darioblanco/slack-deployment@main
        env:
          SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
        with:
          channel_id: ${{ env.SLACK_CHANNEL_STAGING }}
          deployment_description: ${{ toJSON(github.event.head_commit.message) }}
          deployment_name: ${{ github.event.repository.name || 'selection-guide-ui' }}
          environment: staging
          owner: ${{ github.event.pusher.name || env.BOT_NAME }}
          package: ${{ github.event.repository.name || 'selection-guide-ui' }}
          ref: ${{ github.ref }}
          repo: ${{ github.repository }}
          sha: ${{ github.sha }}
          status_url: "placeholder"
          url: "placeholder"
          version: ${{ env.SHORT_SHA }}
```

- [ ] **Step 5: Create `.github/workflows/deploy_to_prod.yml`**

```yaml
name: Deploy to prod (release-tag)

on:
  release:
    types: [published]

env:
  BOT_NAME: parcellab-dev-bot
  SLACK_CHANNEL_PROD: C03C6SP0R61

jobs:
  push_to_s3:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - name: Checkout
        uses: actions/checkout@v6
        with:
          ref: ${{ github.event.release.tag_name }}

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: |
          npm run build
          npm run build:site

      - name: AWS - authentication
        uses: aws-actions/configure-aws-credentials@v6
        with:
          aws-region: eu-central-1
          role-to-assume: ${{ secrets.AWS_ROLE_TO_ASSUME }}

      - name: Upload versioned files to S3
        run: |
          aws s3 cp ./dist s3://parcellab-cdn/apps/selection-guide-ui/v1/${{ github.event.release.tag_name }} \
            --recursive \
            --cache-control max-age=86400

      - name: Upload latest plugin files to S3
        run: |
          aws s3 cp ./dist s3://parcellab-cdn/js/selection-guide-ui/v1 \
            --recursive \
            --cache-control max-age=86400

      - name: Upload demo page to S3
        run: |
          aws s3 cp ./site s3://parcellab-cdn/apps/selection-guide-ui/v1/demo \
            --recursive \
            --cache-control max-age=86400

      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id E3R5S2BJQI4RDS \
            --paths "/js/selection-guide-ui/v1/*" "/apps/selection-guide-ui/v1/*"

      - name: Notify deployment
        uses: darioblanco/slack-deployment@main
        env:
          SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
        with:
          channel_id: ${{ env.SLACK_CHANNEL_PROD }}
          deployment_description: ${{ github.event.release.name }}
          deployment_name: ${{ github.event.repository.name || 'selection-guide-ui' }}
          environment: prod
          owner: ${{ github.actor }}
          package: ${{ github.event.repository.name || 'selection-guide-ui' }}
          ref: ${{ github.ref }}
          repo: ${{ github.repository }}
          sha: ${{ github.sha }}
          status_url: "placeholder"
          url: "placeholder"
          version: ${{ github.event.release.tag_name }}
```

- [ ] **Step 6: Commit**

```bash
git add -A .github/workflows/ scripts/build-site.mjs package.json
git rm scripts/build-pages.mjs 2>/dev/null || true
git commit -m "feat: replace GitHub Pages with S3/CloudFront deployment"
```

---

### Task 9: Update README with all new options

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update demo URL and remove GitHub Pages references**

In `README.md`, update the live demo link (line 7):

```markdown
**[Live demo](https://cdn.parcellab.com/playground/selection-guide-ui/)**
```

- [ ] **Step 2: Update Quick Start script URL**

In `README.md`, update the script src in the HTML embed example (line 58):

```html
<script src="https://cdn.parcellab.com/js/selection-guide-ui/v1/size-recommender.iife.js" defer></script>
```

- [ ] **Step 3: Update Configuration table**

In `README.md`, update the configuration table (lines 118-133). Replace the `notFoundMode` row and add new rows:

```markdown
| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `target` | `string \| HTMLElement` | — | **Required** for JS init. CSS selector or DOM element. |
| `accountId` | `number \| string` | — | **Required**. parcelLab account identifier. |
| `productId` | `string` | — | **Required**. Product identifier passed to the API. |
| `articleName` | `string` | — | Legacy alias for `productId`. Still accepted for backwards compatibility. |
| `locale` | `string` | `'en'` | Language for default messages. Supported: `en`, `de`, `fr`, `it`, `es`. |
| `messages` | `Partial<WidgetMessages>` | — | Override any default message string. |
| `notFoundMode` | `'empty' \| 'true-to-size' \| 'hidden'` | `'empty'` | Behavior when the API returns 404. `hidden` hides the widget entirely. |
| `apiBaseUrl` | `string` | `'https://product-api.parcellab.com'` | Override the API base URL. |
| `appearance` | `'neutral' \| 'colored'` | `'neutral'` | `neutral` is grayscale; `colored` uses gradient track. |
| `density` | `'compact' \| 'comfortable'` | `'compact'` | `compact` suits PDP sidebars; `comfortable` adds more spacing. |
| `surface` | `'subtle' \| 'plain'` | `'subtle'` | `subtle` renders a light card; `plain` renders inline. |
| `showPill` | `boolean` | `true` | Show or hide the fit category pill badge. |
| `showScale` | `boolean` | `true` | Show or hide the fit position scale bar. |
| `showRecommendation` | `boolean` | `true` | Show or hide the entire recommendation box. |
| `showSummary` | `boolean` | `true` | Show or hide the LLM summary within the recommendation. |
| `className` | `string` | — | Extra CSS classes added to the root element. |
| `theme` | `Partial<WidgetTheme>` | — | CSS token overrides (colors, radius, etc.). |
```

- [ ] **Step 4: Update 404 handling section**

In `README.md`, update the 404 handling section (lines 155-159):

```markdown
## 404 Handling

When a product has no recommendation data, the widget supports three modes:

- **`empty`** (default) — shows a "no data available" message
- **`true-to-size`** — renders a "likely true to size" fallback without confidence or summary
- **`hidden`** — hides the widget entirely (`display: none`); the widget reappears when valid data is provided via `update()` or `refresh()`
```

- [ ] **Step 5: Update root classes section**

In `README.md`, update the root classes (line 173) to include `hidden`:

```
.pl-size-recommender--state-{loading|ready|fallback-true|empty|error|hidden}
```

- [ ] **Step 6: Update Development section**

In `README.md`, replace the GitHub Pages section (lines 269-277) with:

```markdown
### Deployment

The project deploys to S3/CloudFront via GitHub Actions:

- **Staging:** automatically deployed on push to `main` to `s3://parcellab-cdn/playground/selection-guide-ui/`
- **Production:** deployed on GitHub release to `s3://parcellab-cdn/js/selection-guide-ui/v1/` (latest) and `s3://parcellab-cdn/apps/selection-guide-ui/v1/{tag}/` (versioned)

Build the demo site locally:

```sh
npm run build
npm run build:site
```
```

- [ ] **Step 7: Update data attribute example**

In `README.md`, update the data attribute HTML example (lines 139-152) to include the new attributes:

```html
<div
  data-size-recommender
  data-account-id="1617954"
  data-product-id="Men's Iver Pants (tailored fit)"
  data-not-found-mode="true-to-size"
  data-appearance="colored"
  data-density="comfortable"
  data-surface="plain"
  data-locale="de"
  data-show-pill="true"
  data-show-scale="true"
  data-show-recommendation="true"
  data-show-summary="false"
  data-messages='{"title":"How It Fits"}'
  data-theme='{"backgroundColor":"#f6f6f6","radius":"12px"}'
  data-class-name="my-custom-class"
></div>
```

- [ ] **Step 8: Update JS API example to show locale**

In `README.md`, update the JavaScript API example (lines 66-93) to include locale:

```javascript
const widget = window.SizeRecommender.init({
  target: '#size-recommender',
  accountId: 1617954,
  productId: "Men's Iver Pants (tailored fit)",
  locale: 'de',
  appearance: 'neutral',
  density: 'compact',
  surface: 'subtle',
  notFoundMode: 'true-to-size',
  showPill: true,
  showScale: true,
  showRecommendation: true,
  showSummary: true,
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
```

- [ ] **Step 9: Commit**

```bash
git add README.md
git commit -m "docs: update README with all new options and S3 deployment info"
```

---

### Task 10: Final verification

**Files:** None (verification only)

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`

Expected: PASS — no errors.

- [ ] **Step 2: Run full test suite**

Run: `npm test`

Expected: All tests pass.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: `dist/size-recommender.iife.js` and `dist/size-recommender.esm.js` are generated without errors.

- [ ] **Step 4: Run site build**

Run: `npm run build:site`

Expected: `site/` directory created with `index.html`, `dev/main.js`, `dist/size-recommender.iife.js`, `dist/size-recommender.esm.js`.

- [ ] **Step 5: Manual smoke test**

Run: `npm run dev`

Open `http://localhost:4173`. Verify:
1. Default widget renders correctly
2. Switching locale to "Deutsch" shows German text
3. "Test missing product" with mode "Hidden" hides the widget
4. Clicking a sample product brings the widget back
5. Unchecking "Show scale" removes the scale bar
6. Unchecking "Show summary" removes the summary paragraph but keeps the recommendation heading
7. Unchecking "Show recommendation" removes the entire box
8. Embed code reflects all configured options
