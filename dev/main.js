const DEFAULT_ARTICLE_NAME = "Men's Iver Pants (tailored fit)";
const DEFAULT_ACCOUNT_ID = '1619650';

const articleNameInput = document.querySelector('#article-name');
const accountIdInput = document.querySelector('#account-id');
const notFoundModeSelect = document.querySelector('#not-found-mode');
const appearanceSelect = document.querySelector('#appearance');
const densitySelect = document.querySelector('#density');
const surfaceSelect = document.querySelector('#surface');
const renderButton = document.querySelector('#render-widget');
const simulateMissingButton = document.querySelector('#simulate-missing');
const mount = document.querySelector('#size-recommender-demo');

let widget;

function currentConfig() {
  return {
    target: mount,
    accountId: accountIdInput.value || DEFAULT_ACCOUNT_ID,
    articleName: articleNameInput.value || DEFAULT_ARTICLE_NAME,
    notFoundMode: notFoundModeSelect.value,
    appearance: appearanceSelect.value,
    density: densitySelect.value,
    surface: surfaceSelect.value,
  };
}

async function renderWidget(overrides = {}) {
  const config = {
    ...currentConfig(),
    ...overrides,
  };

  articleNameInput.value = config.articleName;

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
    articleName: 'This article does not exist',
  });
});

void renderWidget();
