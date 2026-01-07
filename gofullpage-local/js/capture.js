// Capture page script
document.addEventListener('DOMContentLoaded', async () => {
  // 初始化i18n
  if (typeof i18n !== 'undefined') {
    i18n.init();
  }

  const urlParams = new URLSearchParams(window.location.search);
  const canvasId = urlParams.get('id');
  
  if (!canvasId) {
    showError('No canvas ID provided');
    return;
  }

  // 从存储中获取截图数据
  const result = await chrome.storage.local.get(canvasId);
  
  if (result[canvasId]) {
    displayScreenshot(result[canvasId]);
  } else {
    // 等待截图完成
    waitForScreenshot(canvasId);
  }

  // 设置按钮事件
  setupButtons(canvasId);
});

function displayScreenshot(data) {
  const loading = document.getElementById('loading');
  const imageContainer = document.getElementById('image-container');
  const image = document.getElementById('screenshot-image');

  loading.style.display = 'none';
  imageContainer.style.display = 'block';
  
  image.src = data.dataUrl;
  image.style.maxWidth = '100%';
  image.style.height = 'auto';

  // 保存到全局变量以便下载
  window.screenshotData = data;
}

function waitForScreenshot(canvasId) {
  chrome.runtime.onMessage.addListener(function listener(message) {
    if (message.action === 'captureComplete' && message.canvasId === canvasId) {
      chrome.runtime.onMessage.removeListener(listener);
      
      // 保存到存储
      const data = {
        dataUrl: message.dataUrl,
        width: message.width,
        height: message.height,
        url: message.url,
        timestamp: message.timestamp
      };
      
      chrome.storage.local.set({ [canvasId]: data });
      displayScreenshot(data);
    } else if (message.action === 'captureError' && message.canvasId === canvasId) {
      chrome.runtime.onMessage.removeListener(listener);
      showError(message.error || 'Capture failed');
    }
  });
}

function setupButtons(canvasId) {
  const downloadBtn = document.getElementById('download-btn');
  const downloadPdfBtn = document.getElementById('download-pdf-btn');
  const editBtn = document.getElementById('edit-btn');
  const deleteBtn = document.getElementById('delete-btn');
  const closeErrorBtn = document.getElementById('close-error');

  downloadBtn.addEventListener('click', async () => {
    if (window.screenshotData) {
      await downloadImage(window.screenshotData.dataUrl, 'png');
    }
  });

  downloadPdfBtn.addEventListener('click', async () => {
    if (window.screenshotData) {
      await downloadAsPDF(window.screenshotData);
    }
  });

  editBtn.addEventListener('click', () => {
    window.location.href = `editor.html?id=${canvasId}`;
  });

  deleteBtn.addEventListener('click', async () => {
    if (confirm('确定要删除这张截图吗？')) {
      await chrome.storage.local.remove(canvasId);
      window.location.href = 'history.html';
    }
  });

  closeErrorBtn.addEventListener('click', () => {
    document.getElementById('error').style.display = 'none';
  });
}

async function downloadImage(dataUrl, format = 'png') {
  const response = await chrome.runtime.sendMessage({
    action: 'download',
    dataUrl: dataUrl,
    filename: `screenshot_${Date.now()}.${format}`,
    format: format
  });

  if (response && response.success) {
    console.log('Download started');
  } else {
    alert('下载失败: ' + (response?.error || 'Unknown error'));
  }
}

async function downloadAsPDF(data) {
  // 简化版PDF下载（实际下载为PNG格式）
  // 如需真正的PDF，需要集成jsPDF库
  try {
    const img = new Image();
    img.src = data.dataUrl;
    
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    // 直接下载为PNG（PDF功能需要额外库支持）
    await downloadImage(data.dataUrl, 'png');
    alert('当前版本暂不支持PDF格式，已下载为PNG格式。');
  } catch (error) {
    console.error('Download error:', error);
    alert('下载失败');
  }
}

function showError(message) {
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  const errorMessage = document.getElementById('error-message');

  loading.style.display = 'none';
  error.style.display = 'block';
  errorMessage.textContent = message;
}

