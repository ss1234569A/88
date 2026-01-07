// i18n helper
const i18n = {
  init() {
    // 替换所有带有data-i18n属性的元素
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const message = chrome.i18n.getMessage(key);
      if (message) {
        if (element.tagName === 'INPUT' && element.type === 'button') {
          element.value = message;
        } else {
          element.textContent = message;
        }
      }
    });

    // 替换所有带有data-i18n-html属性的元素（支持HTML）
    document.querySelectorAll('[data-i18n-html]').forEach(element => {
      const key = element.getAttribute('data-i18n-html');
      const message = chrome.i18n.getMessage(key);
      if (message) {
        element.innerHTML = message;
      }
    });
  },

  getMessage(key) {
    return chrome.i18n.getMessage(key) || key;
  }
};


