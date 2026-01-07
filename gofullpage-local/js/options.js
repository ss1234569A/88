// Options page script
document.addEventListener('DOMContentLoaded', async () => {
  // 初始化i18n
  if (typeof i18n !== 'undefined') {
    i18n.init();
  }

  // 加载保存的设置
  await loadSettings();

  // 设置事件监听
  setupEventListeners();
});

async function loadSettings() {
  const result = await chrome.storage.local.get(['settings']);
  const settings = result.settings || {
    format: 'png',
    quality: 0.9,
    autoDownload: false
  };

  // 设置格式
  document.querySelector(`input[name="format"][value="${settings.format}"]`).checked = true;

  // 设置质量
  const qualitySlider = document.getElementById('quality');
  qualitySlider.value = settings.quality;
  updateQualityValue(settings.quality);

  // 设置自动下载
  document.getElementById('auto-download').checked = settings.autoDownload;
}

function setupEventListeners() {
  const saveBtn = document.getElementById('save-btn');
  const resetBtn = document.getElementById('reset-btn');
  const qualitySlider = document.getElementById('quality');

  saveBtn.addEventListener('click', saveSettings);
  resetBtn.addEventListener('click', resetSettings);
  
  qualitySlider.addEventListener('input', (e) => {
    updateQualityValue(e.target.value);
  });
}

function updateQualityValue(value) {
  const percentage = Math.round(value * 100);
  document.getElementById('quality-value').textContent = `${percentage}%`;
}

async function saveSettings() {
  const format = document.querySelector('input[name="format"]:checked').value;
  const quality = parseFloat(document.getElementById('quality').value);
  const autoDownload = document.getElementById('auto-download').checked;

  const settings = {
    format,
    quality,
    autoDownload
  };

  await chrome.storage.local.set({ settings });
  
  // 显示保存成功消息
  const saveBtn = document.getElementById('save-btn');
  const originalText = saveBtn.textContent;
  saveBtn.textContent = '已保存！';
  saveBtn.style.background = '#4caf50';
  
  setTimeout(() => {
    saveBtn.textContent = originalText;
    saveBtn.style.background = '';
  }, 2000);
}

async function resetSettings() {
  if (confirm('确定要重置所有设置吗？')) {
    const defaultSettings = {
      format: 'png',
      quality: 0.9,
      autoDownload: false
    };

    await chrome.storage.local.set({ settings: defaultSettings });
    await loadSettings();
  }
}


