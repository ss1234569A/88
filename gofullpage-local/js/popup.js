// Popup script
document.addEventListener('DOMContentLoaded', async () => {
  // 初始化i18n
  if (typeof i18n !== 'undefined') {
    i18n.init();
  }

  const captureBtn = document.getElementById('capture-btn');
  const optionsLink = document.getElementById('options-link');
  const historyLink = document.getElementById('history-link');
  const mainView = document.getElementById('main-view');
  const capturingView = document.getElementById('capturing-view');
  const errorView = document.getElementById('error-view');
  const errorMessage = document.getElementById('error-message');
  const closeErrorBtn = document.getElementById('close-error');

  // 获取当前标签页
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // 检查是否可以在此页面使用
  if (!canUseOnPage(tab.url)) {
    showError(getMessage('invalidPage'));
    return;
  }

  // 截图按钮点击
  captureBtn.addEventListener('click', async () => {
    await startCapture(tab);
  });

  // 选项链接
  optionsLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  // 历史记录链接
  historyLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL('history.html') });
  });

  // 关闭错误
  closeErrorBtn.addEventListener('click', () => {
    errorView.style.display = 'none';
    mainView.style.display = 'block';
  });

  async function startCapture(tab) {
    try {
      // 显示捕获中视图
      mainView.style.display = 'none';
      capturingView.style.display = 'block';
      errorView.style.display = 'none';

      const canvasId = `canvas_${Date.now()}`;

      // 发送截图请求
      const response = await chrome.runtime.sendMessage({
        action: 'capture',
        canvasId: canvasId,
        tabId: tab.id
      });

      if (response && response.success) {
        // 等待截图完成
        waitForCaptureComplete(canvasId);
      } else {
        throw new Error(response?.error || 'Failed to start capture');
      }
    } catch (error) {
      console.error('Capture error:', error);
      showError(error.message || getMessage('captureError'));
    }
  }

  function waitForCaptureComplete(canvasId) {
    // 监听来自background的消息
    chrome.runtime.onMessage.addListener(function listener(message) {
      if (message.action === 'captureComplete' && message.canvasId === canvasId) {
        chrome.runtime.onMessage.removeListener(listener);
        
        // 打开结果页面
        chrome.tabs.create({
          url: chrome.runtime.getURL(`capture.html?id=${canvasId}`)
        });
        
        // 关闭popup
        window.close();
      } else if (message.action === 'captureError' && message.canvasId === canvasId) {
        chrome.runtime.onMessage.removeListener(listener);
        showError(message.error || getMessage('captureError'));
      }
    });

    // 超时处理
    setTimeout(() => {
      chrome.runtime.onMessage.removeListener(listener);
      showError('Capture timeout');
    }, 60000); // 60秒超时
  }

  function canUseOnPage(url) {
    if (!url) return false;
    
    const restricted = [
      'chrome://',
      'chrome-extension://',
      'edge://',
      'about:',
      'chrome-search://'
    ];
    
    return !restricted.some(prefix => url.startsWith(prefix));
  }

  function showError(message) {
    errorMessage.textContent = message;
    mainView.style.display = 'none';
    capturingView.style.display = 'none';
    errorView.style.display = 'block';
  }

  function getMessage(key) {
    if (typeof chrome !== 'undefined' && chrome.i18n) {
      return chrome.i18n.getMessage(key) || key;
    }
    return key;
  }
});


