// 当DOM加载完成后执行

// 日历提醒应用 - 优化版本
class CalendarReminderApp {
  constructor() {
    // DOM 元素引用
    this.resultDiv = document.getElementById('result');
    this.calendarDays = document.getElementById('calendar-days');
    this.currentMonthEl = document.getElementById('current-month');
    this.prevMonthBtn = document.getElementById('prev-month');
    this.nextMonthBtn = document.getElementById('next-month');
    this.remindersList = document.getElementById('reminders-list');

    // 已移除旧的输入框引用，提醒功能现在通过弹窗实现

    // 弹窗元素引用
    this.reminderDetailModal = document.getElementById('reminderDetailModal');
    this.detailModalTitle = document.getElementById('detailModalTitle');
    this.reminderDetails = document.getElementById('reminderDetails');
    this.closeDetailModal = document.getElementById('closeDetailModal');
    this.closeDetailModalBtn = document.getElementById('closeDetailModalBtn');

    this.addReminderModal = document.getElementById('addReminderModal');
    this.modalReminderInput = document.getElementById('modal-reminder-input');
    this.modalReminderTime = document.getElementById('modal-reminder-time');
    this.modalDateDisplay = document.getElementById('modal-date-display');
    this.closeAddModal = document.getElementById('closeAddModal');
    this.cancelAddReminder = document.getElementById('cancelAddReminder');
    this.confirmAddReminder = document.getElementById('confirmAddReminder');
    this.openAddReminderModalBtn = document.getElementById('openAddReminderModal');

    // 状态变量
    this.currentDate = new Date();
    this.selectedDate = null;
    this.reminders = {};

    // 绑定方法到实例
    this.renderCalendar = this.renderCalendar.bind(this);
    this.prevMonth = this.prevMonth.bind(this);
    this.nextMonth = this.nextMonth.bind(this);
    this.refreshCalendarReminders = this.refreshCalendarReminders.bind(this);
    this.loadReminders = this.loadReminders.bind(this);
    this.saveReminders = this.saveReminders.bind(this);
    this.addReminder = this.addReminder.bind(this);
    this.deleteReminder = this.deleteReminder.bind(this);
    this.displayReminders = this.displayReminders.bind(this);
    this.showNotification = this.showNotification.bind(this);
    this.handleDayClick = this.handleDayClick.bind(this);
    this.setupEventListeners = this.setupEventListeners.bind(this);

    // 初始化应用
    this.init();
  }

  // 初始化应用
  init() {
    this.setupEventListeners();
    this.loadReminders();
    this.renderCalendar();

    // 监听存储变化
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync' && changes.reminders) {
        this.refreshCalendarReminders();
      }
    });
  }

  // 设置事件监听器
  setupEventListeners() {
    this.prevMonthBtn.addEventListener('click', this.prevMonth);
    this.nextMonthBtn.addEventListener('click', this.nextMonth);
    // 弹窗事件监听器
    this.closeDetailModal.addEventListener('click', () => {
      this.hideReminderDetailModal();
    });

    this.closeDetailModalBtn.addEventListener('click', () => {
      this.hideReminderDetailModal();
    });

    this.closeAddModal.addEventListener('click', () => {
      this.hideAddReminderModal();
    });

    this.cancelAddReminder.addEventListener('click', () => {
      this.hideAddReminderModal();
    });

    this.confirmAddReminder.addEventListener('click', () => {
      this.addReminderFromModal();
    });

    this.openAddReminderModalBtn.addEventListener('click', () => {
      this.openAddReminderModal();
    });

    // 允许在弹窗中按Enter键添加提醒
    this.modalReminderInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addReminderFromModal();
      }
    });
  }

  // 上个月按钮处理
  prevMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.renderCalendar();
  }

  // 下个月按钮处理
  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.renderCalendar();
  }

  // 从弹窗添加提醒
  addReminderFromModal() {
    if (!this.selectedDate) {
      this.showNotification('请先选择日期', 'error');
      this.hideAddReminderModal();
      return;
    }

    const reminderText = this.modalReminderInput.value.trim();
    const time = this.modalReminderTime.value;
    if (reminderText === '') {
      this.showNotification('提醒事项不能为空', 'error');
      return;
    }

    this.addReminder(this.selectedDate, reminderText, time);
    this.modalReminderInput.value = '';
    this.hideAddReminderModal();
    this.showNotification('提醒事项已添加', 'success');
  }

  // 显示提醒详情弹窗
  showReminderDetailModal(date) {
    // 格式化日期
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    this.detailModalTitle.textContent = `${year}年${month}月${day}日提醒`;

    // 清空提醒详情
    this.reminderDetails.innerHTML = '';

    // 格式化日期作为键
    const dateKey = date.toISOString().split('T')[0];

    // 检查是否有该日期的提醒事项
    if (this.reminders[dateKey] && this.reminders[dateKey].length > 0) {
      // 按创建时间排序提醒事项
      const sortedReminders = [...this.reminders[dateKey]].sort((a, b) => {
        return new Date(a.createdAt) - new Date(b.createdAt);
      });

      sortedReminders.forEach((reminder) => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('reminder-detail-item');

        const textSpan = document.createElement('span');
        textSpan.textContent = reminder.text + (reminder.time ? ` (${reminder.time})` : '');

        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-reminder');
        deleteBtn.textContent = '删除';

        // 添加删除事件
        deleteBtn.addEventListener('click', () => {
          // 添加删除动画
          itemDiv.style.height = itemDiv.offsetHeight + 'px';
          itemDiv.style.overflow = 'hidden';
          itemDiv.style.transition = 'height 0.3s ease, opacity 0.3s ease';
          itemDiv.style.opacity = '0';

          setTimeout(() => {
            this.deleteReminder(date, reminder.id);
            // 更新弹窗内容
            this.showReminderDetailModal(date);
          }, 300);
        });

        itemDiv.appendChild(textSpan);
        itemDiv.appendChild(deleteBtn);
        this.reminderDetails.appendChild(itemDiv);
      });
    } else {
      // 如果没有提醒事项，显示提示
      const emptyMsg = document.createElement('div');
      emptyMsg.classList.add('empty-reminder-modal');
      emptyMsg.textContent = '没有提醒事项';
      this.reminderDetails.appendChild(emptyMsg);
    }

    // 显示弹窗
    this.reminderDetailModal.style.display = 'flex';
  }

  // 隐藏提醒详情弹窗
  hideReminderDetailModal() {
    this.reminderDetailModal.style.display = 'none';
  }

  // 打开添加提醒弹窗
  openAddReminderModal() {
    if (!this.selectedDate) {
      this.showNotification('请先选择日期', 'error');
      return;
    }

    // 显示选中的日期
    const year = this.selectedDate.getFullYear();
    const month = this.selectedDate.getMonth() + 1;
    const day = this.selectedDate.getDate();
    this.modalDateDisplay.textContent = `所选日期: ${year}年${month}月${day}日`;

    // 清空输入框
    this.modalReminderInput.value = '';
    this.modalReminderTime.value = '09:00';

    // 显示弹窗
    this.addReminderModal.style.display = 'flex';
  }

  // 隐藏添加提醒弹窗
  hideAddReminderModal() {
    this.addReminderModal.style.display = 'none';
  }

  // 渲染日历
  renderCalendar() {
    // 获取当前年月
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    // 更新月份显示
    this.currentMonthEl.textContent = `${year}年 ${month + 1}月`;

    // 清空日历
    this.calendarDays.innerHTML = '';

    // 获取当月第一天是星期几
    const firstDay = new Date(year, month, 1).getDay();

    // 获取当月天数
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 添加上个月的占位天数
    for (let i = 0; i < firstDay; i++) {
      const dayEl = document.createElement('div');
      dayEl.classList.add('empty-day');
      this.calendarDays.appendChild(dayEl);
    }

    // 添加当月天数
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const dayEl = this.createDayElement(year, month, i, today);
      this.calendarDays.appendChild(dayEl);
    }
  }

  // 创建日期元素
  createDayElement(year, month, day, today) {
    const dayEl = document.createElement('div');
    dayEl.textContent = day;
    dayEl.dataset.day = day;

    // 检查是否是今天
    if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
      dayEl.classList.add('today');
    }

    // 检查是否是选中的日期
    if (this.selectedDate && day === this.selectedDate.getDate() && month === this.selectedDate.getMonth() && year === this.selectedDate.getFullYear()) {
      dayEl.classList.add('selected');
    }

    // 检查是否有提醒事项
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (this.reminders && this.reminders[dateKey] && this.reminders[dateKey].length > 0) {
      this.addReminderMarker(dayEl, dateKey);
    }

    // 添加点击事件
    dayEl.addEventListener('click', () => this.handleDayClick(year, month, day));

    return dayEl;
  }

  // 添加提醒标记
  addReminderMarker(dayEl, dateKey) {
    // 添加提醒标记
    const reminderMarker = document.createElement('div');
    reminderMarker.classList.add('reminder-marker');
    dayEl.appendChild(reminderMarker);

    // 创建提醒事项容器
    const remindersContainer = document.createElement('div');
    remindersContainer.classList.add('day-reminders-container');

    // 最多显示3条提醒
    const displayReminders = this.reminders[dateKey].slice(0, 3);
    displayReminders.forEach(reminder => {
      const reminderEl = document.createElement('div');
      reminderEl.classList.add('day-reminder-item');
      reminderEl.textContent = reminder.text;
      remindersContainer.appendChild(reminderEl);
    });

    // 如果有更多提醒，显示'更多...'
    if (this.reminders[dateKey].length > 3) {
      const moreEl = document.createElement('div');
      moreEl.classList.add('day-reminder-more');
      moreEl.textContent = '更多...';
      remindersContainer.appendChild(moreEl);
    }

    dayEl.appendChild(remindersContainer);
  }

  // 处理日期点击 - 现在显示提醒详情弹窗
  handleDayClick(year, month, day) {
    // 移除之前选中的日期样式
    const prevSelected = document.querySelector('.selected');
    if (prevSelected) {
      prevSelected.classList.remove('selected');
    }

    // 添加选中样式到当前点击的日期
    const dayElements = this.calendarDays.querySelectorAll('div');
    for (const el of dayElements) {
      if (parseInt(el.dataset.day) === day) {
        el.classList.add('selected');
        break;
      }
    }

    // 更新选中的日期
    this.selectedDate = new Date(year, month, day);

    // 在结果区域显示选中的日期
    this.resultDiv.textContent = `选定的日期: ${year}年${month + 1}月${day}日`;

    // 显示该日期的提醒事项弹窗
    this.showReminderDetailModal(this.selectedDate);
  }

  // 从本地存储加载提醒事项
  loadReminders() {
    chrome.storage.sync.get(['reminders'], (result) => {
      if (result.reminders) {
        this.reminders = result.reminders;
      }
      // 如果有选中的日期，显示该日期的提醒事项
      if (this.selectedDate) {
        this.displayReminders(this.selectedDate);
      }
    });
  }

  // 保存提醒事项到本地存储
  saveReminders() {
    chrome.storage.sync.set({ reminders: this.reminders }, () => {
      console.log('提醒事项已保存');
    });
  }

  // 添加提醒事项
  addReminder(date, text, time) {
    const dateKey = date.toISOString().split('T')[0];

    // 从存储中获取现有提醒
    chrome.storage.sync.get(['reminders'], (result) => {
      const reminders = result.reminders || {};

      // 如果该日期没有提醒，创建一个空数组
      if (!reminders[dateKey]) {
        reminders[dateKey] = [];
      }

      // 添加新提醒
      const reminderId = Date.now();
      reminders[dateKey].push({
        id: reminderId,
        text: text,
        time: time,
        createdAt: new Date().toISOString()
      });

      // 保存到存储
      chrome.storage.sync.set({ reminders: reminders }, () => {
        // 更新本地缓存
        this.reminders = reminders;

        // 更新UI
        if (this.selectedDate && this.selectedDate.toISOString().split('T')[0] === dateKey) {
          this.displayReminders(this.selectedDate);
        }

        // 重新渲染日历以更新提醒标记
        this.renderCalendar();

        // 设置提醒闹钟
        chrome.runtime.sendMessage({
          action: 'scheduleReminder',
          dateKey: dateKey,
          reminder: text,
          time: time
        }, (response) => {
          if (response && response.success) {
            console.log('提醒已设置:', response.alarmName);
          }
        });
      });
    });
  }

  // 删除提醒事项
  deleteReminder(date, reminderId) {
    const dateKey = date.toISOString().split('T')[0];

    // 从存储中获取现有提醒和闹钟信息
    chrome.storage.sync.get(['reminders', 'alarmInfo'], (result) => {
      const reminders = result.reminders || {};
      const alarmInfo = result.alarmInfo || {};

      // 如果该日期有提醒，过滤掉要删除的提醒
      if (reminders[dateKey]) {
        // 找到要删除的提醒
        const reminderToDelete = reminders[dateKey].find(reminder => reminder.id === reminderId);

        // 过滤掉要删除的提醒
        reminders[dateKey] = reminders[dateKey].filter(reminder => reminder.id !== reminderId);

        // 如果没有提醒了，删除该日期的键
        if (reminders[dateKey].length === 0) {
          delete reminders[dateKey];
        }

        // 保存到存储
        chrome.storage.sync.set({ reminders: reminders }, () => {
          // 更新本地缓存
          this.reminders = reminders;

          // 更新UI
          if (this.selectedDate && this.selectedDate.toISOString().split('T')[0] === dateKey) {
            this.displayReminders(this.selectedDate);
          }

          // 重新渲染日历以更新提醒标记
          this.renderCalendar();
        });
      }

      // 取消相关的闹钟
      if (reminderToDelete) {
        // 查找并取消相关的闹钟
        for (const [alarmName, info] of Object.entries(alarmInfo)) {
          if (info.dateKey === dateKey && info.reminder === reminderToDelete.text && info.time === reminderToDelete.time) {
            chrome.runtime.sendMessage({
              action: 'cancelReminder',
              alarmName: alarmName
            }, (response) => {
              if (response && response.success) {
                console.log('提醒已取消:', alarmName);
              }
            });
            break;
          }
        }
      }
    });
  }

  // 显示特定日期的提醒事项（现在仅在弹窗中显示，此方法可能不再需要，但保留以防万一）
  displayReminders(date) {
    // 清空提醒事项列表
    this.remindersList.innerHTML = '';

    // 添加淡入动画
    this.remindersList.style.opacity = '0';
    this.remindersList.style.transition = 'opacity 0.3s ease';

    // 格式化日期作为键
    const dateKey = date.toISOString().split('T')[0];

    // 检查是否有该日期的提醒事项
    if (this.reminders[dateKey] && this.reminders[dateKey].length > 0) {
      // 创建提醒事项列表
      const ul = document.createElement('ul');

      // 按创建时间排序提醒事项
      const sortedReminders = [...this.reminders[dateKey]].sort((a, b) => {
        return new Date(a.createdAt) - new Date(b.createdAt);
      });

      sortedReminders.forEach((reminder) => {
        const li = document.createElement('li');
        li.classList.add('reminder-item');

        const textSpan = document.createElement('span');
        textSpan.textContent = reminder.text + (reminder.time ? ` (${reminder.time})` : '');

        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-reminder');
        deleteBtn.textContent = '删除';

        // 添加删除事件
        deleteBtn.addEventListener('click', () => {
          // 添加删除动画
          li.style.height = li.offsetHeight + 'px';
          li.style.overflow = 'hidden';
          li.style.transition = 'height 0.3s ease, opacity 0.3s ease';
          li.style.opacity = '0';

          setTimeout(() => {
            this.deleteReminder(date, reminder.id);
          }, 300);
        });

        li.appendChild(textSpan);
        li.appendChild(deleteBtn);
        ul.appendChild(li);
      });

      this.remindersList.appendChild(ul);
    } else {
      // 如果没有提醒事项，显示提示
      const emptyMsg = document.createElement('div');
      emptyMsg.classList.add('empty-reminder-message');
      emptyMsg.textContent = '没有提醒事项';
      this.remindersList.appendChild(emptyMsg);
    }

    // 触发淡入动画
    setTimeout(() => {
      this.remindersList.style.opacity = '1';
    }, 50);
  }

  // 显示通知消息
  showNotification(message, type = 'info') {
    this.resultDiv.textContent = message;
    this.resultDiv.className = 'notification ' + type;
    this.resultDiv.style.display = 'block';

    // 3秒后隐藏通知
    setTimeout(() => {
      this.resultDiv.style.opacity = '0';
      this.resultDiv.style.transition = 'opacity 0.5s ease';
      setTimeout(() => {
        this.resultDiv.style.display = 'none';
        this.resultDiv.style.opacity = '1';
      }, 500);
    }, 3000);
  }

  // 重新加载提醒事项并更新日历标记
  refreshCalendarReminders() {
    this.loadReminders();
    this.renderCalendar();
  }
}

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
  const app = new CalendarReminderApp();
});
