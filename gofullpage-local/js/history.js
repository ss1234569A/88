// History page script
document.addEventListener('DOMContentLoaded', async () => {
  // 初始化i18n
  if (typeof i18n !== 'undefined') {
    i18n.init();
  }

  // 加载历史记录
  await loadHistory();

  // 设置清除全部按钮
  document.getElementById('clear-all-btn').addEventListener('click', clearAll);
});

async function loadHistory() {
  const allData = await chrome.storage.local.get(null);
  const screenshots = [];

  // 筛选出截图数据（以canvas_开头的key）
  for (const [key, value] of Object.entries(allData)) {
    if (key.startsWith('canvas_') && value.dataUrl) {
      screenshots.push({
        id: key,
        ...value
      });
    }
  }

  // 按时间戳排序
  screenshots.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  displayScreenshots(screenshots);
}

function displayScreenshots(screenshots) {
  const list = document.getElementById('screenshots-list');
  const emptyState = document.getElementById('empty-state');

  if (screenshots.length === 0) {
    list.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  list.style.display = 'grid';
  emptyState.style.display = 'none';
  list.innerHTML = '';

  screenshots.forEach(screenshot => {
    const item = createScreenshotItem(screenshot);
    list.appendChild(item);
  });
}

function createScreenshotItem(screenshot) {
  const item = document.createElement('div');
  item.className = 'screenshot-item';

  const img = document.createElement('img');
  img.src = screenshot.dataUrl;
  img.alt = 'Screenshot';
  img.onclick = () => {
    window.location.href = `capture.html?id=${screenshot.id}`;
  };

  const info = document.createElement('div');
  info.className = 'screenshot-info';

  const url = document.createElement('div');
  url.className = 'screenshot-url';
  url.textContent = screenshot.url || 'Unknown URL';
  url.title = screenshot.url || '';

  const time = document.createElement('div');
  time.className = 'screenshot-time';
  time.textContent = formatTime(screenshot.timestamp);

  const actions = document.createElement('div');
  actions.className = 'screenshot-actions';

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn-delete';
  deleteBtn.textContent = '删除';
  deleteBtn.onclick = (e) => {
    e.stopPropagation();
    deleteScreenshot(screenshot.id);
  };

  actions.appendChild(deleteBtn);
  info.appendChild(url);
  info.appendChild(time);
  info.appendChild(actions);

  item.appendChild(img);
  item.appendChild(info);

  return item;
}

function formatTime(timestamp) {
  if (!timestamp) return 'Unknown';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) {
    return '刚刚';
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`;
  } else if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`;
  } else {
    return date.toLocaleDateString('zh-CN');
  }
}

async function deleteScreenshot(id) {
  if (confirm('确定要删除这张截图吗？')) {
    await chrome.storage.local.remove(id);
    await loadHistory();
  }
}

async function clearAll() {
  if (confirm('确定要清除所有截图记录吗？此操作无法撤销。')) {
    const allData = await chrome.storage.local.get(null);
    const keysToRemove = Object.keys(allData).filter(key => key.startsWith('canvas_'));
    
    await chrome.storage.local.remove(keysToRemove);
    await loadHistory();
  }
}


