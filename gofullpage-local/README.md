# 全页截图 - 本地版

一个完全本地化的Chrome浏览器扩展，用于捕获整个网页的截图。所有功能都在本地完成，无需网络连接。

## 功能特性

- 📸 **全页截图** - 捕获整个网页，包括需要滚动才能看到的内容
- ✏️ **图片编辑** - 裁剪、绘制、添加文字和标注
- 💾 **本地存储** - 所有截图都保存在本地，保护您的隐私
- 🌐 **完全离线** - 无需网络连接，所有功能本地运行
- 🇨🇳 **简体中文支持** - 完整的中文界面

## 安装方法

1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `gofullpage-local` 文件夹

## 使用方法

1. 点击浏览器工具栏中的扩展图标
2. 点击"开始截图"按钮
3. 等待截图完成
4. 在结果页面可以：
   - 下载图片（PNG/JPEG/WebP）
   - 下载PDF
   - 编辑图片
   - 查看历史记录

## 项目结构

```
gofullpage-local/
├── manifest.json          # 扩展配置文件
├── popup.html            # 弹出窗口
├── capture.html          # 截图结果页面
├── editor.html           # 图片编辑器
├── options.html          # 选项页面
├── history.html          # 历史记录页面
├── welcome.html          # 欢迎页面
├── js/
│   ├── background.js     # 后台服务
│   ├── content.js        # 内容脚本
│   ├── popup.js          # 弹出窗口脚本
│   ├── capture.js        # 截图页面脚本
│   ├── editor.js         # 编辑器脚本
│   ├── options.js        # 选项页面脚本
│   ├── history.js         # 历史记录脚本
│   └── i18n.js           # 国际化脚本
├── css/
│   ├── popup.css
│   ├── capture.css
│   ├── editor.css
│   ├── options.css
│   ├── history.css
│   └── welcome.css
├── _locales/
│   ├── zh_CN/           # 简体中文
│   │   └── messages.json
│   └── en/              # 英文
│       └── messages.json
└── images/              # 图标文件
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 技术说明

- **Manifest V3** - 使用最新的Chrome扩展API
- **本地存储** - 使用chrome.storage.local API
- **Canvas API** - 用于图片处理和编辑
- **完全离线** - 不依赖任何远程API或服务

## 注意事项

1. 某些受限制的页面（如chrome://页面）无法使用此扩展
2. 截图质量取决于页面内容和浏览器性能
3. 大型网页可能需要较长时间完成截图

## 开发

这是一个完全本地化的项目，不包含任何构建步骤。可以直接在Chrome中加载使用。

## 许可证

MIT License


