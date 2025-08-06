# 我的第一个Chrome插件

这是一个简单的Chrome浏览器插件示例，展示了浏览器插件的基本结构和功能。

## 功能特点
- 点击插件图标显示弹出窗口
- 点击弹出窗口中的按钮可以获取当前页面标题
- 右键菜单中添加了插件功能入口
- 支持显示通知

## 文件结构
```
/Applications/project/java/testJS/
├── manifest.json       # 插件配置文件
├── popup.html          # 弹出窗口HTML
├── popup.js            # 弹出窗口JavaScript
├── content.js          # 内容脚本，注入到网页中
├── background.js       # 后台服务工作线程
├── images/             # 图标目录
│   ├── icon16.svg      # 16x16图标
│   ├── icon48.svg      # 48x48图标
│   └── icon128.svg     # 128x128图标
└── README.md           # 说明文档
```

## 安装方法
1. 打开Chrome浏览器，输入`chrome://extensions/`进入扩展管理页面
2. 开启右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择插件所在的文件夹`/Applications/project/java/testJS`
5. 插件成功安装后会显示在浏览器工具栏中

## 使用方法
1. 点击浏览器工具栏中的插件图标，打开弹出窗口
2. 点击"点击我"按钮，插件会获取当前页面的标题并显示
3. 也可以在网页中右键点击，选择"使用我的插件打招呼"，插件会通过通知显示页面标题

## 开发说明
- 本插件使用Chrome扩展Manifest V3开发
- 主要使用了HTML、CSS和JavaScript
- 图标使用SVG格式，支持缩放而不失真