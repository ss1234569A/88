// Background service worker
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // 首次安装时打开欢迎页面
    chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
  }
});

// 处理来自content script和popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'capture') {
    // 开始截图流程
    handleCapture(request, sender, sendResponse);
    return true; // 保持消息通道开放
  } else if (request.action === 'captureCurrentViewport') {
    // 截图当前可见区域
    captureCurrentViewport(sender.tab.id, request, sendResponse);
    return true;
  } else if (request.action === 'download') {
    // 处理下载
    handleDownload(request, sendResponse);
    return true;
  }
  return false;
});

async function handleCapture(request, sender, sendResponse) {
  try {
    const tab = sender.tab;
    if (!tab) {
      sendResponse({ success: false, error: 'No tab found' });
      return;
    }

    // 注入content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['js/content.js']
    });

    // 发送开始截图消息
    chrome.tabs.sendMessage(tab.id, {
      action: 'startCapture',
      canvasId: request.canvasId || Date.now().toString()
    }, (response) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse(response);
      }
    });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function captureCurrentViewport(tabId, request, sendResponse) {
  try {
    // 使用chrome.tabs.captureVisibleTab API截图
    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: 'png',
      quality: 100
    });
    
    sendResponse({ success: true, dataUrl: dataUrl });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleDownload(request, sendResponse) {
  try {
    const { dataUrl, filename, format } = request;
    
    // 将data URL转换为blob（本地操作，不是网络请求）
    const base64Data = dataUrl.split(',')[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: `image/${format || 'png'}` });
    
    // 创建下载
    const url = URL.createObjectURL(blob);
    const downloadId = await chrome.downloads.download({
      url: url,
      filename: filename || `screenshot_${Date.now()}.${format || 'png'}`,
      saveAs: false
    });

    sendResponse({ success: true, downloadId });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}


