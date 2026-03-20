const SAMPLE_REQUESTS = {
  pants: {
    productId: "Men's Iver Pants (tailored fit)",
    accountId: '1617954',
  },
  shirt: {
    productId: '6792154579016',
    accountId: '1619013',
  },
};

const DEFAULT_SAMPLE = SAMPLE_REQUESTS.pants;
const DEFAULT_PRODUCT_ID = DEFAULT_SAMPLE.productId;
const DEFAULT_ACCOUNT_ID = DEFAULT_SAMPLE.accountId;

const productIdInput = document.querySelector('#product-id');
const accountIdInput = document.querySelector('#account-id');
const notFoundModeSelect = document.querySelector('#not-found-mode');
const appearanceSelect = document.querySelector('#appearance');
const densitySelect = document.querySelector('#density');
const surfaceSelect = document.querySelector('#surface');
const renderButton = document.querySelector('#render-widget');
const simulateMissingButton = document.querySelector('#simulate-missing');
const sampleButtons = document.querySelectorAll('[data-sample]');
const embedModeButtons = document.querySelectorAll('[data-embed-mode]');
const mount = document.querySelector('#size-recommender-demo');
const embedCode = document.querySelector('#embed-code');
const copyCodeButton = document.querySelector('#copy-code');

let widget;
let embedMode = 'html';
let copyCodeTimeoutId;

function currentConfig() {
  return {
    target: mount,
    accountId: accountIdInput.value || DEFAULT_ACCOUNT_ID,
    productId: productIdInput.value || DEFAULT_PRODUCT_ID,
    notFoundMode: notFoundModeSelect.value,
    appearance: appearanceSelect.value,
    density: densitySelect.value,
    surface: surfaceSelect.value,
  };
}

function escapeAttribute(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function embedBundleUrl() {
  return new URL('./dist/size-recommender.iife.js', window.location.href).toString();
}

function scriptAttributes() {
  return `src="${embedBundleUrl()}" defer`;
}

function htmlEmbedSnippet(config) {
  return `<div
  data-size-recommender
  data-account-id="${escapeAttribute(config.accountId)}"
  data-product-id="${escapeAttribute(config.productId)}"
  data-not-found-mode="${escapeAttribute(config.notFoundMode)}"
  data-appearance="${escapeAttribute(config.appearance)}"
  data-density="${escapeAttribute(config.density)}"
  data-surface="${escapeAttribute(config.surface)}"
></div>
<script ${scriptAttributes()}></script>`;
}

function jsEmbedSnippet(config) {
  return `<div id="size-recommender"></div>
<script src="${embedBundleUrl()}"></script>
<script>
  window.SizeRecommender.init({
    target: '#size-recommender',
    accountId: ${JSON.stringify(config.accountId)},
    productId: ${JSON.stringify(config.productId)},
    notFoundMode: ${JSON.stringify(config.notFoundMode)},
    appearance: ${JSON.stringify(config.appearance)},
    density: ${JSON.stringify(config.density)},
    surface: ${JSON.stringify(config.surface)}
  });
</script>`;
}

function updateEmbedModeButtons() {
  embedModeButtons.forEach((button) => {
    const isActive = button.dataset.embedMode === embedMode;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function updateEmbedCodePreview(overrides = {}) {
  if (!embedCode) {
    return;
  }

  const config = {
    ...currentConfig(),
    ...overrides,
  };
  const snippet =
    embedMode === 'js' ? jsEmbedSnippet(config) : htmlEmbedSnippet(config);

  embedCode.textContent = snippet;
}

async function copyEmbedCode() {
  if (!embedCode || !copyCodeButton) {
    return;
  }

  const text = embedCode.textContent ?? '';

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
  } catch (error) {
    console.error('Failed to copy embed code.', error);
    return;
  }

  copyCodeButton.dataset.copied = 'true';
  copyCodeButton.setAttribute('title', 'Copied');
  copyCodeButton.setAttribute('aria-label', 'Embed code copied');

  window.clearTimeout(copyCodeTimeoutId);
  copyCodeTimeoutId = window.setTimeout(() => {
    copyCodeButton.dataset.copied = 'false';
    copyCodeButton.setAttribute('title', 'Copy embed code');
    copyCodeButton.setAttribute('aria-label', 'Copy embed code');
  }, 1200);
}

async function renderWidget(overrides = {}) {
  const config = {
    ...currentConfig(),
    ...overrides,
  };

  productIdInput.value = config.productId;
  accountIdInput.value = config.accountId;
  notFoundModeSelect.value = config.notFoundMode;
  appearanceSelect.value = config.appearance;
  densitySelect.value = config.density;
  surfaceSelect.value = config.surface;
  updateEmbedCodePreview(config);

  if (!widget) {
    widget = window.SizeRecommender.init(config);
    return;
  }

  await widget.update(config);
}

renderButton.addEventListener('click', () => {
  void renderWidget();
});

simulateMissingButton.addEventListener('click', () => {
  void renderWidget({
    productId: 'This product does not exist',
  });
});

sampleButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const sample = SAMPLE_REQUESTS[button.dataset.sample];

    if (!sample) {
      return;
    }

    void renderWidget(sample);
  });
});

embedModeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    embedMode = button.dataset.embedMode === 'js' ? 'js' : 'html';
    updateEmbedModeButtons();
    updateEmbedCodePreview();
  });
});

copyCodeButton?.addEventListener('click', () => {
  void copyEmbedCode();
});

[productIdInput, accountIdInput, notFoundModeSelect, appearanceSelect, densitySelect, surfaceSelect]
  .filter(Boolean)
  .forEach((element) => {
    element.addEventListener('input', () => {
      updateEmbedCodePreview();
    });
    element.addEventListener('change', () => {
      updateEmbedCodePreview();
    });
  });

updateEmbedModeButtons();
updateEmbedCodePreview();
void renderWidget();
