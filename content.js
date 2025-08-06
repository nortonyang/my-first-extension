// content.js

// 监听来自popup或background的消息
console.log('content.js已加载');

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('收到消息:', request);
  if (request.action === 'sayHello') {
    // 获取页面标题
    const pageTitle = document.title;
    console.log('当前页面标题:', pageTitle);
    // 发送响应
    sendResponse({
      message: `你好！当前页面标题是: ${pageTitle}`
    });
  }
  // 必须返回true以确保异步响应能被正确处理
  return true;
});