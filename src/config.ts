import { getMessages } from './messages';
import type {
  AppearanceMode,
  DensityMode,
  ResolvedWidgetConfig,
  SurfaceMode,
  WidgetConfig,
  WidgetInitOptions,
  WidgetMessages,
  WidgetTheme,
} from './types';

const DEFAULT_API_BASE_URL =
  'https://product-api.parcellab.com';

function resolveTarget(target: WidgetInitOptions['target']): HTMLElement {
  if (typeof target === 'string') {
    const element = document.querySelector<HTMLElement>(target);

    if (!element) {
      throw new Error(`SizeRecommender target not found: ${target}`);
    }

    return element;
  }

  return target;
}

function parseAccountId(accountId: WidgetConfig['accountId']): number {
  const parsed = Number(accountId);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid accountId: ${String(accountId)}`);
  }

  return parsed;
}

function parseAppearance(
  appearance: WidgetConfig['appearance'],
): AppearanceMode {
  return appearance === 'colored' ? 'colored' : 'neutral';
}

function parseDensity(density: WidgetConfig['density']): DensityMode {
  return density === 'comfortable' ? 'comfortable' : 'compact';
}

function parseSurface(surface: WidgetConfig['surface']): SurfaceMode {
  return surface === 'plain' ? 'plain' : 'subtle';
}

function resolveProductId(config: Pick<WidgetConfig, 'productId' | 'articleName'>): string {
  const productId = config.productId?.trim() ?? config.articleName?.trim();

  if (!productId) {
    throw new Error('productId is required.');
  }

  return productId;
}

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
    notFoundMode: config.notFoundMode ?? 'empty',
    apiBaseUrl: (config.apiBaseUrl ?? DEFAULT_API_BASE_URL).replace(/\/$/, ''),
    appearance: parseAppearance(config.appearance),
    density: parseDensity(config.density),
    surface: parseSurface(config.surface),
    theme: config.theme ?? {},
    className: config.className?.trim() ?? '',
  };
}

function parseJsonObject<T>(value: string | undefined): Partial<T> | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value) as Partial<T>;
    return parsed && typeof parsed === 'object' ? parsed : undefined;
  } catch (error) {
    console.warn('SizeRecommender: failed to parse JSON config.', error);
    return undefined;
  }
}

export function readConfigFromElement(
  element: HTMLElement,
): WidgetInitOptions | null {
  const { dataset } = element;
  const accountId = dataset.accountId;
  const productId = dataset.productId ?? dataset.articleName;

  if (!accountId || !productId) {
    console.warn(
      'SizeRecommender: skipping element missing data-account-id or data-product-id.',
      'Legacy data-article-name is also accepted.',
      element,
    );
    return null;
  }

  const config: WidgetInitOptions = {
    target: element,
    accountId,
    productId,
    notFoundMode:
      dataset.notFoundMode === 'true-to-size' ? 'true-to-size' : 'empty',
  };

  if (dataset.locale) {
    config.locale = dataset.locale;
  }

  if (dataset.apiBaseUrl) {
    config.apiBaseUrl = dataset.apiBaseUrl;
  }

  if (dataset.appearance === 'colored' || dataset.appearance === 'neutral') {
    config.appearance = dataset.appearance;
  }

  if (dataset.density === 'comfortable' || dataset.density === 'compact') {
    config.density = dataset.density;
  }

  if (dataset.surface === 'plain' || dataset.surface === 'subtle') {
    config.surface = dataset.surface;
  }

  if (dataset.className) {
    config.className = dataset.className;
  }

  const messages = parseJsonObject<WidgetMessages>(dataset.messages);
  const theme = parseJsonObject<WidgetTheme>(dataset.theme);

  if (messages) {
    config.messages = messages;
  }

  if (theme) {
    config.theme = theme;
  }

  return config;
}
