// background.js

// 监听安装事件
chrome.runtime.onInstalled.addListener(function() {
  // 存储一些初始设置
  chrome.storage.sync.set({
    'pluginEnabled': true
  }, function() {
    console.log('插件已安装并初始化');
  });

  // 创建一个上下文菜单
  chrome.contextMenus.create({
    id: 'helloWorld',
    title: '查询linux命令',
    contexts: ['all']
  });
});

// 监听上下文菜单点击事件
chrome.contextMenus.onClicked.addListener(function(info, tab) {
  console.log('info',info)
  console.log('tab',tab)
  if (info.menuItemId === 'helloWorld') {
    // 向内容脚本发送消息，添加重试机制    function sendMessageWithRetry(tabId, action, retryCount = 3) {      chrome.tabs.sendMessage(tabId, {action: action}, function(response) {        if (chrome.runtime.lastError) {          console.error(`发送消息失败 (${3 - retryCount + 1}/3):`, chrome.runtime.lastError.message);          if (retryCount > 0) {            console.log(`200ms后重试...`);            setTimeout(() => {              sendMessageWithRetry(tabId, action, retryCount - 1);            }, 200);          }        } else if (response && response.message) {          // 显示通知          chrome.notifications.create({            type: 'basic',            iconUrl: 'images/icon48.svg',            title: '我的插件',            message: response.message          });        }      });    }    sendMessageWithRetry(tab.id, 'sayHello');
  }
});

// 监听来自内容脚本或popup的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getSettings') {
    chrome.storage.sync.get('pluginEnabled', function(data) {
      sendResponse({
        enabled: data.pluginEnabled !== undefined ? data.pluginEnabled : true
      });
    });
    // 必须返回true以确保异步响应能被正确处理
    return true;
  } else if (request.action === 'scheduleReminder') {
    // 设置提醒闹钟
    const { dateKey, reminder, time } = request;
    const [year, month, day] = dateKey.split('-').map(Number);
    
    // 解析时间，如果没有提供时间，默认设置为当天的9:00
    let hours = 9;
    let minutes = 0;
    if (time) {
      const [h, m] = time.split(':').map(Number);
      hours = h;
      minutes = m;
    }
    
    // 创建提醒时间
    const reminderTime = new Date(year, month - 1, day, hours, minutes, 0);
    const now = new Date();

    // 设置提前1分钟提醒
    const notificationTime = new Date(reminderTime);
    notificationTime.setMinutes(notificationTime.getMinutes() - 1);

    // 如果提醒时间已过，设置为明天的同一时间
    if (notificationTime <= now) {
      notificationTime.setDate(notificationTime.getDate() + 1);
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    // 计算距离提醒的时间（以毫秒为单位）
    const delay = notificationTime - now;

    // 设置闹钟
    const alarmName = `reminder_${dateKey}_${Date.now()}`;
    chrome.alarms.create(alarmName, {
      delayInMinutes: delay / 60000, // 转换为分钟
      periodInMinutes: 1440 // 每天重复（可选）
    });
    
    // 保存闹钟信息
    chrome.storage.sync.get(['alarmInfo'], function(result) {
      const alarmInfo = result.alarmInfo || {};
      alarmInfo[alarmName] = {
        dateKey: dateKey,
        reminder: reminder,
        time: `${hours}:${minutes.toString().padStart(2, '0')}`,
        originalTime: `${hours}:${minutes.toString().padStart(2, '0')}`
      };
      chrome.storage.sync.set({alarmInfo: alarmInfo}, function() {
        sendResponse({success: true, alarmName: alarmName});
      });
    });
    
    return true;
  } else if (request.action === 'cancelReminder') {
    // 取消提醒闹钟
    const { alarmName } = request;
    chrome.alarms.clear(alarmName, function(wasCleared) {
      if (wasCleared) {
        // 从存储中删除闹钟信息
        chrome.storage.sync.get(['alarmInfo'], function(result) {
          const alarmInfo = result.alarmInfo || {};
          delete alarmInfo[alarmName];
          chrome.storage.sync.set({alarmInfo: alarmInfo}, function() {
            sendResponse({success: true});
          });
        });
      } else {
        sendResponse({success: false});
      }
    });
    
    return true;
  }
});

// 监听闹钟触发事件
chrome.alarms.onAlarm.addListener(function(alarm) {
  // 获取闹钟信息
  chrome.storage.sync.get(['alarmInfo'], function(result) {
    const alarmInfo = result.alarmInfo || {};
    const info = alarmInfo[alarm.name];

    if (info) {
      // 显示通知
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'images/icon48.svg',
        title: '日历提醒',
        message: `1分钟后提醒: ${info.dateKey} ${info.time} - ${info.reminder}`,
        priority: 2
      });

      // 打开插件弹窗
      chrome.action.openPopup();
    }
  });
});

// 监听存储变化，以便在提醒事项更改时更新闹钟
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'sync' && changes.reminders) {
    // 这里可以实现根据提醒事项的变化更新闹钟的逻辑
    // 为了简化，我们可以在popup.js中处理闹钟的设置和取消
  }
});

// 插件启动时，重新设置所有有效的提醒闹钟
chrome.runtime.onStartup.addListener(function() {
  chrome.storage.sync.get(['alarmInfo'], function(result) {
    const alarmInfo = result.alarmInfo || {};
    const now = new Date();
    
    // 遍历所有闹钟信息
    for (const [alarmName, info] of Object.entries(alarmInfo)) {
      const [year, month, day] = info.dateKey.split('-').map(Number);
      const [hours, minutes] = info.time.split(':').map(Number);
      
      // 创建提醒时间
      let reminderTime = new Date(year, month - 1, day, hours, minutes, 0);
      
      // 如果提醒时间已过，设置为明天的同一时间
      if (reminderTime <= now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
      }
      
      // 计算距离提醒的时间（以毫秒为单位）
      const delay = reminderTime - now;
      
      // 重新设置闹钟
      chrome.alarms.create(alarmName, {
        delayInMinutes: delay / 60000, // 转换为分钟
        periodInMinutes: 1440 // 每天重复（可选）
      });
    }
  });
});