const SAMPLE_REQUESTS = {
  'iver-pants': {
    productId: "Men's Iver Pants (tailored fit)",
    accountId: '1617954',
  },
  'numeric-id': {
    productId: '6792154579016',
    accountId: '1619013',
  },
};

const DEFAULT_SAMPLE = SAMPLE_REQUESTS['iver-pants'];
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
const mount = document.querySelector('#size-recommender-demo');
const embedCode = document.querySelector('#embed-code');

let widget;

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

function updateEmbedCodePreview(overrides = {}) {
  if (!embedCode) {
    return;
  }

  const config = {
    ...currentConfig(),
    ...overrides,
  };
  const snippet = `<div
  data-size-recommender
  data-account-id="${escapeAttribute(config.accountId)}"
  data-product-id="${escapeAttribute(config.productId)}"
  data-not-found-mode="${escapeAttribute(config.notFoundMode)}"
  data-appearance="${escapeAttribute(config.appearance)}"
  data-density="${escapeAttribute(config.density)}"
  data-surface="${escapeAttribute(config.surface)}"
></div>
<script src="${embedBundleUrl()}" defer></script>`;

  embedCode.textContent = snippet;
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

updateEmbedCodePreview();
void renderWidget();
