import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { autoInit, init } from '../src/index';

function recommendationResponse(overrides: Record<string, unknown> = {}) {
  return {
    article_name: "Men's Iver Pants (tailored fit)",
    size_fit_category: 'Likely to run small',
    confidence_smetabase_core: 0.98,
    smoothed_fit_position: -0.6,
    raw_fit_position: -0.75,
    llm_summary:
      'Customers frequently mention a tighter fit through the hips and waist.',
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

describe('SizeRecommender widget', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders fit position, confidence, and customer summary', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(recommendationResponse())),
    );

    document.body.innerHTML = '<div id="mount"></div>';
    init({
      target: '#mount',
      accountId: 1619650,
      articleName: "Men's Iver Pants (tailored fit)",
    });

    const host = document.querySelector<HTMLElement>('#mount');

    await vi.waitFor(() => {
      expect(host?.textContent).toContain('How It Fits');
      expect(host?.textContent).toContain('Likely to run small');
      expect(host?.textContent).toContain(
        '98% confident based on real customer feedback',
      );
      expect(host?.textContent).toContain('Consider sizing up');
      expect(host?.textContent).toContain(
        'Customers frequently mention a tighter fit through the hips and waist.',
      );
    });

    const root = host?.querySelector<HTMLElement>('.pl-size-recommender');
    const marker = host?.querySelector<HTMLElement>(
      '.pl-size-recommender__marker',
    );

    expect(root?.classList.contains('pl-size-recommender--neutral')).toBe(true);
    expect(root?.classList.contains('pl-size-recommender--density-compact')).toBe(
      true,
    );
    expect(marker?.style.left).toBe('20%');
    expect(
      host?.querySelector('.pl-size-recommender__recommendation-icon svg'),
    ).not.toBeNull();
    expect(
      host?.querySelector('.pl-size-recommender__recommendation-meta')
        ?.textContent,
    ).toContain('98% confident based on real customer feedback');
  });

  it('renders no data mode on 404 when configured', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 404)));

    document.body.innerHTML = '<div id="mount"></div>';
    init({
      target: '#mount',
      accountId: 1619650,
      articleName: 'Unknown article',
      notFoundMode: 'empty',
    });

    const host = document.querySelector<HTMLElement>('#mount');

    await vi.waitFor(() => {
      expect(host?.textContent).toContain('No data available');
      expect(host?.textContent).not.toContain('Runs Small');
    });
  });

  it('renders likely true-to-size fallback on 404 when configured', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 404)));

    document.body.innerHTML = '<div id="mount"></div>';
    init({
      target: '#mount',
      accountId: 1619650,
      articleName: 'Unknown article',
      notFoundMode: 'true-to-size',
    });

    const host = document.querySelector<HTMLElement>('#mount');

    await vi.waitFor(() => {
      expect(host?.textContent).toContain('Likely true to size');
      expect(host?.textContent).toContain('Should fit as expected');
      expect(
        host?.querySelector('.pl-size-recommender__recommendation-meta'),
      ).toBeNull();
    });
  });

  it('auto-inits from data attributes and merges localized overrides', async () => {
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

    document.body.innerHTML = `
      <div
        id="auto"
        data-size-recommender
        data-account-id="1619650"
        data-article-name="Auto-init article"
        data-messages='{"title":"Sizing guidance"}'
      ></div>
    `;

    autoInit();

    const host = document.querySelector<HTMLElement>('#auto');

    await vi.waitFor(() => {
      expect(host?.textContent).toContain('Sizing guidance');
      expect(host?.textContent).toContain('Should fit as expected');
    });
  });

  it('ignores stale responses after update()', async () => {
    let resolveFirst: ((value: Response) => void) | undefined;

    const fetchMock = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          recommendationResponse({
            article_name: 'Second article',
            size_fit_category: 'Likely to run large',
            smoothed_fit_position: 0.5,
            llm_summary: 'The second article typically fits larger.',
          }),
        ),
      );

    vi.stubGlobal('fetch', fetchMock);

    document.body.innerHTML = '<div id="mount"></div>';
    const widget = init({
      target: '#mount',
      accountId: 1619650,
      articleName: 'First article',
    });

    await widget.update({ articleName: 'Second article' });
    resolveFirst?.(
      jsonResponse(
        recommendationResponse({
          article_name: 'First article',
          llm_summary: 'The first article should not win.',
        }),
      ),
    );

    const host = document.querySelector<HTMLElement>('#mount');

    await vi.waitFor(() => {
      expect(host?.textContent).toContain('The second article typically fits larger.');
      expect(host?.textContent).not.toContain('The first article should not win.');
    });
  });

  it('supports appearance, density, surface, theme, and className overrides', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          recommendationResponse({
            size_fit_category: 'Likely to run large',
            smoothed_fit_position: 0.45,
          }),
        ),
      ),
    );

    document.body.innerHTML = '<div id="mount"></div>';
    init({
      target: '#mount',
      accountId: 1619650,
      articleName: 'Styled article',
      appearance: 'colored',
      density: 'comfortable',
      surface: 'plain',
      className: 'merchant-fit-box',
      theme: {
        backgroundColor: '#fafafa',
        borderColor: '#cccccc',
        textColor: '#1a1a1a',
        mutedTextColor: '#555555',
        radius: '18px',
      },
    });

    const root = document.querySelector<HTMLElement>('.pl-size-recommender');

    await vi.waitFor(() => {
      expect(root?.classList.contains('pl-size-recommender--colored')).toBe(true);
      expect(
        root?.classList.contains('pl-size-recommender--density-comfortable'),
      ).toBe(true);
      expect(root?.classList.contains('pl-size-recommender--surface-plain')).toBe(
        true,
      );
      expect(root?.classList.contains('merchant-fit-box')).toBe(true);
      expect(root?.style.getPropertyValue('--plsr-background')).toBe('#fafafa');
      expect(root?.style.getPropertyValue('--plsr-radius')).toBe('18px');
    });
  });
});
