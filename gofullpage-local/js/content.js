// Content script - 在网页中执行截图逻辑
(function() {
  'use strict';

  let isCapturing = false;

  // 监听来自background的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startCapture') {
      if (isCapturing) {
        sendResponse({ success: false, error: 'Capture already in progress' });
        return;
      }
      
      startCapture(request.canvasId, sendResponse);
      return true; // 保持消息通道开放
    }
    return false;
  });

  async function startCapture(canvasId, sendResponse) {
    isCapturing = true;
    
    try {
      // 检查页面是否可访问
      if (!canAccessPage()) {
        sendResponse({ 
          success: false, 
          error: 'Cannot capture this page',
          invalidPage: true 
        });
        isCapturing = false;
        return;
      }

      // 初始化截图
      const result = await captureFullPage(canvasId);
      
      // 发送完成消息
      chrome.runtime.sendMessage({
        action: 'captureComplete',
        canvasId: canvasId,
        dataUrl: result.dataUrl,
        width: result.width,
        height: result.height,
        url: window.location.href,
        timestamp: Date.now()
      });

      sendResponse({ success: true, canvasId });
    } catch (error) {
      console.error('Capture error:', error);
      chrome.runtime.sendMessage({
        action: 'captureError',
        canvasId: canvasId,
        error: error.message
      });
      sendResponse({ success: false, error: error.message });
    } finally {
      isCapturing = false;
    }
  }

  function canAccessPage() {
    const url = window.location.href;
    // 检查是否是受限页面
    if (url.startsWith('chrome://') || 
        url.startsWith('chrome-extension://') ||
        url.startsWith('edge://') ||
        url.startsWith('about:')) {
      return false;
    }
    return true;
  }

  async function captureFullPage(canvasId) {
    return new Promise((resolve, reject) => {
      try {
        // 保存原始滚动位置
        const originalScrollX = window.scrollX;
        const originalScrollY = window.scrollY;

        // 获取页面尺寸
        const body = document.body;
        const html = document.documentElement;
        
        const pageWidth = Math.max(
          body.scrollWidth, body.offsetWidth,
          html.clientWidth, html.scrollWidth, html.offsetWidth
        );
        
        const pageHeight = Math.max(
          body.scrollHeight, body.offsetHeight,
          html.clientHeight, html.scrollHeight, html.offsetHeight
        );

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // 计算需要截图的区域数量
        const cols = Math.ceil(pageWidth / viewportWidth);
        const rows = Math.ceil(pageHeight / viewportHeight);

        // 创建canvas
        const canvas = document.createElement('canvas');
        canvas.width = pageWidth;
        canvas.height = pageHeight;
        const ctx = canvas.getContext('2d');

        // 设置背景色
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageWidth, pageHeight);

        // 通过滚动页面分段截图
        captureByScrolling(pageWidth, pageHeight, cols, rows, viewportWidth, viewportHeight, canvas, ctx, originalScrollX, originalScrollY)
          .then(() => {
            // 恢复原始滚动位置
            window.scrollTo(originalScrollX, originalScrollY);
            
            // 转换为data URL
            const dataUrl = canvas.toDataURL('image/png');
            resolve({
              dataUrl: dataUrl,
              width: pageWidth,
              height: pageHeight
            });
          })
          .catch(reject);

      } catch (error) {
        reject(error);
      }
    });
  }

  async function captureByScrolling(pageWidth, pageHeight, cols, rows, viewportWidth, viewportHeight, canvas, ctx, origX, origY) {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * viewportWidth;
        const y = row * viewportHeight;
        
        // 滚动到位置
        window.scrollTo(x, y);
        
        // 等待滚动和渲染完成
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 请求background截图当前可见区域
        const screenshot = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({
            action: 'captureCurrentViewport',
            x: x,
            y: y
          }, (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          });
        });
        
        if (screenshot && screenshot.dataUrl) {
          const img = await loadImage(screenshot.dataUrl);
          const drawX = x;
          const drawY = y;
          const drawWidth = Math.min(viewportWidth, pageWidth - x);
          const drawHeight = Math.min(viewportHeight, pageHeight - y);
          
          ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        }
      }
    }
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
})();

