// Editor script
document.addEventListener('DOMContentLoaded', async () => {
  // 初始化i18n
  if (typeof i18n !== 'undefined') {
    i18n.init();
  }

  const urlParams = new URLSearchParams(window.location.search);
  const canvasId = urlParams.get('id');
  
  if (!canvasId) {
    alert('No canvas ID provided');
    window.location.href = 'history.html';
    return;
  }

  // 从存储中获取截图数据
  const result = await chrome.storage.local.get(canvasId);
  
  if (!result[canvasId]) {
    alert('Screenshot not found');
    window.location.href = 'history.html';
    return;
  }

  const screenshotData = result[canvasId];
  initEditor(screenshotData);

  // 设置按钮事件
  setupButtons(canvasId);
});

function initEditor(data) {
  const canvas = document.getElementById('editor-canvas');
  const ctx = canvas.getContext('2d');
  
  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    // 保存原始图像
    window.originalImage = img;
    window.canvas = canvas;
    window.ctx = ctx;
    
    // 初始化编辑器状态
    window.editorState = {
      tool: null,
      isDrawing: false,
      startX: 0,
      startY: 0,
      history: [],
      historyIndex: -1
    };
    
    // 保存初始状态
    saveState();
  };
  img.src = data.dataUrl;
}

function setupButtons(canvasId) {
  const saveBtn = document.getElementById('save-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const cropBtn = document.getElementById('crop-btn');
  const drawBtn = document.getElementById('draw-btn');
  const textBtn = document.getElementById('text-btn');
  const arrowBtn = document.getElementById('arrow-btn');
  const rectBtn = document.getElementById('rect-btn');
  const undoBtn = document.getElementById('undo-btn');
  const redoBtn = document.getElementById('redo-btn');
  const clearBtn = document.getElementById('clear-btn');

  // 工具按钮
  cropBtn.addEventListener('click', () => setTool('crop'));
  drawBtn.addEventListener('click', () => setTool('draw'));
  textBtn.addEventListener('click', () => setTool('text'));
  arrowBtn.addEventListener('click', () => setTool('arrow'));
  rectBtn.addEventListener('click', () => setTool('rect'));

  // 编辑按钮
  undoBtn.addEventListener('click', undo);
  redoBtn.addEventListener('click', redo);
  clearBtn.addEventListener('click', clearCanvas);

  // 保存和取消
  saveBtn.addEventListener('click', async () => {
    await saveChanges(canvasId);
  });

  cancelBtn.addEventListener('click', () => {
    if (confirm('确定要取消编辑吗？未保存的更改将丢失。')) {
      window.location.href = `capture.html?id=${canvasId}`;
    }
  });

  // 设置画布事件
  setupCanvasEvents();
}

function setTool(tool) {
  window.editorState.tool = tool;
  
  // 更新按钮状态
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const toolMap = {
    'crop': 'crop-btn',
    'draw': 'draw-btn',
    'text': 'text-btn',
    'arrow': 'arrow-btn',
    'rect': 'rect-btn'
  };
  
  const btn = document.getElementById(toolMap[tool]);
  if (btn) {
    btn.classList.add('active');
  }
}

function setupCanvasEvents() {
  const canvas = window.canvas;
  const ctx = window.ctx;
  const state = window.editorState;

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    state.startX = e.clientX - rect.left;
    state.startY = e.clientY - rect.top;
    state.isDrawing = true;
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!state.isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    switch (state.tool) {
      case 'draw':
        drawLine(ctx, state.startX, state.startY, currentX, currentY);
        state.startX = currentX;
        state.startY = currentY;
        break;
      case 'rect':
        redrawCanvas();
        drawRect(ctx, state.startX, state.startY, currentX, currentY);
        break;
      case 'arrow':
        redrawCanvas();
        drawArrow(ctx, state.startX, state.startY, currentX, currentY);
        break;
    }
  });

  canvas.addEventListener('mouseup', () => {
    if (state.isDrawing) {
      state.isDrawing = false;
      saveState();
    }
  });
}

function drawLine(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawRect(ctx, x1, y1, x2, y2) {
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 2;
  ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
}

function drawArrow(ctx, x1, y1, x2, y2) {
  const headlen = 15;
  const angle = Math.atan2(y2 - y1, x2 - x1);

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function redrawCanvas() {
  const ctx = window.ctx;
  const img = window.originalImage;
  
  ctx.clearRect(0, 0, window.canvas.width, window.canvas.height);
  ctx.drawImage(img, 0, 0);
  
  // 重绘历史记录
  const state = window.editorState;
  if (state.history.length > 0 && state.historyIndex >= 0) {
    const historyData = state.history[state.historyIndex];
    if (historyData) {
      const historyImg = new Image();
      historyImg.src = historyData;
      historyImg.onload = () => {
        ctx.drawImage(historyImg, 0, 0);
      };
    }
  }
}

function saveState() {
  const state = window.editorState;
  const dataUrl = window.canvas.toDataURL();
  
  // 移除当前索引之后的历史
  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push(dataUrl);
  state.historyIndex = state.history.length - 1;
  
  // 限制历史记录数量
  if (state.history.length > 50) {
    state.history.shift();
    state.historyIndex--;
  }
}

function undo() {
  const state = window.editorState;
  if (state.historyIndex > 0) {
    state.historyIndex--;
    redrawCanvas();
  }
}

function redo() {
  const state = window.editorState;
  if (state.historyIndex < state.history.length - 1) {
    state.historyIndex++;
    redrawCanvas();
  }
}

function clearCanvas() {
  if (confirm('确定要清除所有编辑吗？')) {
    const ctx = window.ctx;
    const img = window.originalImage;
    
    ctx.clearRect(0, 0, window.canvas.width, window.canvas.height);
    ctx.drawImage(img, 0, 0);
    
    saveState();
  }
}

async function saveChanges(canvasId) {
  const dataUrl = window.canvas.toDataURL('image/png');
  
  // 更新存储中的数据
  const result = await chrome.storage.local.get(canvasId);
  if (result[canvasId]) {
    result[canvasId].dataUrl = dataUrl;
    result[canvasId].timestamp = Date.now();
    await chrome.storage.local.set({ [canvasId]: result[canvasId] });
  }
  
  // 返回查看页面
  window.location.href = `capture.html?id=${canvasId}`;
}


