// background.js - Service Worker cho Chrome Extension Tự Động Check Passed FPT

class AutoF5Background {
  constructor() {
    this.timerId = null;
    this.countdownTime = 30;
    this.timeLeft = 30;
    this.isRunning = false;
    this.tabId = null;
    this.activeTabId = null;
    this.refreshCount = 0;
    this.totalTime = 0;
    this.sessionStartTime = null;
    this.soundDuration = 30;

    this.initializeExtension();
  }
  initializeExtension() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });

    this.loadSettings();
    this.updateBadge();
  }
  async loadSettings() {
    try {
      const result = await chrome.storage.local.get([
        "countdownTime",
        "isRunning",
        "timeLeft",
        "refreshCount",
        "totalTime",
        "activeTabId",
        "tabId",
        "soundDuration",
      ]);

      if (result.countdownTime) {
        this.countdownTime = result.countdownTime;
        this.timeLeft = result.timeLeft || result.countdownTime;
      }
      this.refreshCount = result.refreshCount || 0;
      this.totalTime = result.totalTime || 0;
      this.activeTabId = result.activeTabId || null;
      if (result.tabId) this.tabId = result.tabId;
      if (result.soundDuration) this.soundDuration = result.soundDuration;

      // KHÔNG reset isRunning về false!
      if (typeof result.isRunning === "boolean") {
        this.isRunning = result.isRunning;
      }

      // Nếu isRunning true, tự động start lại interval
      if (this.isRunning && !this.timerId) {
        this.timerId = setInterval(() => {
          this.tick();
        }, 1000);
      }

      await this.saveState();
    } catch (error) {
      console.error("Lỗi khi load settings:", error);
    }
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case "startTimer":
          await this.startTimer();
          sendResponse({ success: true });
          break;
        case "stopTimer":
          await this.stopTimer();
          sendResponse({ success: true });
          break;
        case "resetTimer":
          await this.resetTimer();
          sendResponse({ success: true });
          break;
        case "setTime":
          await this.setTime(message.time);
          sendResponse({ success: true });
          break;
        case "setSoundDuration":
          await this.setSoundDuration(message.duration);
          sendResponse({ success: true });
          break;
        case "getStatus":
          sendResponse({
            isRunning: this.isRunning,
            timeLeft: this.timeLeft,
            countdownTime: this.countdownTime,
            refreshCount: this.refreshCount,
            totalTime: this.totalTime,
          });
          break;
        case "resetStats":
          await this.resetStats();
          sendResponse({ success: true });
          break;
        case "passedDetected":
          await this.handlePassedDetected();
          sendResponse({ success: true });
          break;
        default:
          sendResponse({ success: false, error: "Unknown message type" });
      }
    } catch (error) {
      console.error("Lỗi khi xử lý message:", error);
      sendResponse({ success: false, error: error.message });
    }
  }
  async startTimer() {
    if (this.isRunning) return;

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0) {
      if (!this.isValidURL(tabs[0].url)) {
        console.log("Extension chỉ hoạt động trên trang FPT Grade!");
        return;
      }
      this.tabId = tabs[0].id;
      console.log(
        "Đã lưu tab FPT Grade với ID:",
        this.tabId,
        "URL:",
        tabs[0].url
      );
    } else {
      console.error("Không tìm thấy tab hiện tại");
      return;
    }

    this.isRunning = true;
    this.timeLeft = this.countdownTime;
    this.sessionStartTime = Date.now();

    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      this.tick();
    }, 1000);

    await this.saveState();
    this.notifyPopup();
    this.updateBadge();

    console.log("Timer bắt đầu cho tab FPT Grade:", this.countdownTime, "giây");
  }
  async stopTimer() {
    if (!this.isRunning) return;

    if (this.sessionStartTime) {
      const sessionDuration = Math.floor(
        (Date.now() - this.sessionStartTime) / 1000
      );
      this.totalTime += sessionDuration;
      this.sessionStartTime = null;
    }

    this.isRunning = false;

    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    await this.saveState();
    this.notifyPopup();
    this.updateBadge();

    console.log("Timer đã dừng");
  }

  async resetTimer() {
    await this.stopTimer();
    this.timeLeft = this.countdownTime;

    await this.saveState();
    this.notifyPopup();
    this.updateBadge();

    console.log("Timer đã reset");
  }
  async setTime(newTime) {
    this.countdownTime = newTime;

    if (!this.isRunning) {
      this.timeLeft = newTime;
    }

    await this.saveState();
    console.log("Thời gian đã được cài đặt:", newTime, "giây");
  }

  async setSoundDuration(newDuration) {
    this.soundDuration = newDuration;
    await this.saveState();
    console.log("Thời gian âm thanh đã được cài đặt:", newDuration, "giây");
  }

  async tick() {
    this.timeLeft--;

    if (this.timeLeft <= 0) {
      await this.refreshPage();
      this.timeLeft = this.countdownTime;
    }

    await this.saveState();
    this.notifyPopup();
    this.updateBadge();
  }
  async refreshPage() {
    try {
      if (this.tabId) {
        try {
          const tab = await chrome.tabs.get(this.tabId);
          if (!this.isValidURL(tab.url)) {
            console.log("Tab không phải FPT Grade, dừng auto refresh");
            await this.stopTimer();
            return;
          }
          await chrome.tabs.reload(this.tabId);
          this.refreshCount++;
          await this.saveState();
          console.log(
            "Đã refresh trang FPT Grade, tab ID:",
            this.tabId,
            "- Lần thứ:",
            this.refreshCount
          );
          await this.showNotification();
          this.notifyRefresh();
        } catch (tabError) {
          console.error(
            "Tab không còn tồn tại hoặc không thể truy cập:",
            tabError
          );
          console.log("Dừng timer vì tab đã bị đóng");
          await this.stopTimer();
        }
      } else {
        console.error("Không tìm thấy tab để refresh");
        await this.stopTimer();
      }
    } catch (error) {
      console.error("Lỗi khi refresh trang:", error);
    }
  }
  async showNotification() {
    try {
      await chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "Tự Động Check Passed FPT",
        message: `Trang đã được refresh tự động! (Lần ${this.refreshCount})`,
      });
    } catch (error) {
      console.error("Lỗi khi hiển thị notification:", error);
    }
  }
  async showPassedNotification() {
    try {
      await chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "🎉 PASSED - Tự Động Check Passed FPT",
        message: "Chúc mừng! Điểm đã PASSED. Timer đã tự động dừng.",
        requireInteraction: true,
      });
    } catch (error) {
      console.error("Lỗi khi hiển thị notification PASSED:", error);
    }
  }
  async handlePassedDetected() {
    try {
      await this.stopTimer();
      await this.showPassedNotification();
      if (this.tabId) {
        try {
          await chrome.tabs.sendMessage(this.tabId, {
            type: "playPassedSound",
            duration: this.soundDuration,
          });
        } catch (error) {
          console.error("Lỗi khi gửi message phát âm thanh:", error);
        }
      }
      console.log(
        "🎉 PASSED detected! Timer đã dừng và notification đã được gửi."
      );
    } catch (error) {
      console.error("Lỗi khi xử lý PASSED detection:", error);
    }
  }
  async saveState() {
    try {
      await chrome.storage.local.set({
        countdownTime: this.countdownTime,
        timeLeft: this.timeLeft,
        isRunning: this.isRunning,
        refreshCount: this.refreshCount,
        totalTime: this.totalTime,
        tabId: this.tabId,
        soundDuration: this.soundDuration,
      });
    } catch (error) {
      console.error("Lỗi khi lưu state:", error);
    }
  }
  notifyPopup() {
    chrome.runtime
      .sendMessage({
        type: "timerUpdate",
        timeLeft: this.timeLeft,
        isRunning: this.isRunning,
        countdownTime: this.countdownTime,
      })
      .catch(() => {});
    this.notifyContentScript();
  }
  async notifyContentScript() {
    try {
      if (this.tabId) {
        await chrome.tabs.sendMessage(this.tabId, {
          type: "timerUpdate",
          timeLeft: this.timeLeft,
          isRunning: this.isRunning,
          countdownTime: this.countdownTime,
          refreshCount: this.refreshCount,
          totalTime: this.totalTime,
        });
      }
    } catch (error) {}
  }
  async resetStats() {
    this.refreshCount = 0;
    this.totalTime = 0;
    await this.saveState();
    chrome.runtime
      .sendMessage({
        type: "refreshHappened",
        refreshCount: this.refreshCount,
        totalTime: this.totalTime,
      })
      .catch(() => {});
    this.notifyContentScriptStats();
    console.log("Đã reset thống kê");
  }
  notifyRefresh() {
    chrome.runtime
      .sendMessage({
        type: "refreshHappened",
        refreshCount: this.refreshCount,
        totalTime: this.totalTime,
      })
      .catch(() => {});
    this.notifyContentScriptStats();
  }
  async notifyContentScriptStats() {
    try {
      if (this.tabId) {
        await chrome.tabs.sendMessage(this.tabId, {
          type: "refreshHappened",
          refreshCount: this.refreshCount,
          totalTime: this.totalTime,
        });
      }
    } catch (error) {}
  }
  updateBadge() {
    const badgeText = this.isRunning ? this.timeLeft.toString() : "";
    const badgeColor = this.isRunning ? "#4CAF50" : "#f44336";
    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: badgeColor });
  }
  isValidURL(url) {
    const targetURL = "https://fap.fpt.edu.vn/Grade/StudentGrade.aspx";
    return url && url.startsWith(targetURL);
  }
}

const autoF5 = new AutoF5Background();
