// popup.js - Xử lý giao diện popup của Chrome extension

class AutoF5Popup {
  constructor() {
    this.timerDisplay = document.getElementById("timerDisplay");
    this.status = document.getElementById("status");
    this.startBtn = document.getElementById("startBtn");
    this.stopBtn = document.getElementById("stopBtn");
    this.resetBtn = document.getElementById("resetBtn");
    this.resetStatsBtn = document.getElementById("resetStatsBtn");
    this.timeInput = document.getElementById("timeInput");
    this.setTimeBtn = document.getElementById("setTimeBtn");
    this.soundDurationInput = document.getElementById("soundDurationInput");
    this.setSoundBtn = document.getElementById("setSoundBtn");
    this.refreshCount = document.getElementById("refreshCount");
    this.totalTime = document.getElementById("totalTime");

    this.currentTime = 30;
    this.soundDuration = 30; // Thời gian phát âm thanh mặc định
    this.isRunning = false;
    this.refreshCountValue = 0;
    this.totalTimeValue = 0;

    this.initializeEventListeners();
    this.checkCurrentURL();
    this.loadSettings();
    this.updateDisplay();
  }
  initializeEventListeners() {
    this.startBtn.addEventListener("click", () => this.startTimer());
    this.stopBtn.addEventListener("click", () => this.stopTimer());
    this.resetBtn.addEventListener("click", () => this.resetTimer());
    this.resetStatsBtn.addEventListener("click", () => this.resetStats());
    this.setTimeBtn.addEventListener("click", () => this.setTime());
    this.setSoundBtn.addEventListener("click", () => this.setSoundDuration());

    // Lắng nghe thay đổi từ background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "timerUpdate") {
        this.updateTimerDisplay(message.timeLeft, message.isRunning);
      }
      if (message.type === "refreshHappened") {
        this.updateStats(message.refreshCount, message.totalTime);
      }
    });
  }
  async loadSettings() {
    try {
      const result = await chrome.storage.local.get([
        "countdownTime",
        "isRunning",
        "timeLeft",
        "refreshCount",
        "totalTime",
        "soundDuration", // Load sound duration
      ]);

      if (result.countdownTime) {
        this.currentTime = result.countdownTime;
        this.timeInput.value = result.countdownTime;
      }

      if (result.soundDuration) {
        this.soundDuration = result.soundDuration;
        this.soundDurationInput.value = result.soundDuration;
      }

      if (result.isRunning !== undefined) {
        this.isRunning = result.isRunning;
        this.updateButtonStates();
      }
      if (result.timeLeft !== undefined) {
        this.timerDisplay.textContent = result.timeLeft;
      }

      // Load statistics
      this.refreshCountValue = result.refreshCount || 0;
      this.totalTimeValue = result.totalTime || 0;
      this.updateStatsDisplay();

      this.updateDisplay();
    } catch (error) {
      console.error("Lỗi khi load settings:", error);
    }
  }

  async startTimer() {
    try {
      await chrome.runtime.sendMessage({ type: "startTimer" });
      this.isRunning = true;
      this.updateButtonStates();
      this.updateStatus("active", "⏰ Đang đếm ngược...");
    } catch (error) {
      console.error("Lỗi khi bắt đầu timer:", error);
    }
  }

  async stopTimer() {
    try {
      await chrome.runtime.sendMessage({ type: "stopTimer" });
      this.isRunning = false;
      this.updateButtonStates();
      this.updateStatus("inactive", "⏸️ Đã dừng");
    } catch (error) {
      console.error("Lỗi khi dừng timer:", error);
    }
  }

  async resetTimer() {
    try {
      await chrome.runtime.sendMessage({ type: "resetTimer" });
      this.isRunning = false;
      this.updateButtonStates();
      this.timerDisplay.textContent = this.currentTime;
      this.updateStatus("", "🔄 Đã reset");
    } catch (error) {
      console.error("Lỗi khi reset timer:", error);
    }
  }
  async setTime() {
    const newTime = parseInt(this.timeInput.value);

    if (isNaN(newTime) || newTime < 5 || newTime > 3600) {
      alert("Vui lòng nhập thời gian từ 5 đến 3600 giây!");
      return;
    }

    try {
      this.currentTime = newTime;
      await chrome.storage.local.set({ countdownTime: newTime });
      await chrome.runtime.sendMessage({ type: "setTime", time: newTime });

      if (!this.isRunning) {
        this.timerDisplay.textContent = newTime;
      }

      this.updateStatus("", `⚙️ Đã cài đặt: ${newTime} giây`);
    } catch (error) {
      console.error("Lỗi khi cài đặt thời gian:", error);
    }
  }

  async setSoundDuration() {
    const newDuration = parseInt(this.soundDurationInput.value);

    if (isNaN(newDuration) || newDuration < 5 || newDuration > 300) {
      alert("Vui lòng nhập thời gian âm thanh từ 5 đến 300 giây!");
      return;
    }

    try {
      this.soundDuration = newDuration;
      await chrome.storage.local.set({ soundDuration: newDuration });
      await chrome.runtime.sendMessage({
        type: "setSoundDuration",
        duration: newDuration,
      });

      this.updateStatus("", `🔊 Đã cài đặt âm thanh: ${newDuration} giây`);
    } catch (error) {
      console.error("Lỗi khi cài đặt âm thanh:", error);
    }
  }

  updateTimerDisplay(timeLeft, isRunning) {
    this.timerDisplay.textContent = timeLeft;
    this.isRunning = isRunning;
    this.updateButtonStates();

    if (timeLeft === 0) {
      this.updateStatus("active", "🔄 Đã refresh trang!");
      setTimeout(() => {
        this.updateStatus("", "Chờ chu kỳ tiếp theo...");
      }, 2000);
    } else if (isRunning) {
      this.updateStatus("active", `⏰ Còn lại ${timeLeft} giây`);
    }
  }

  updateButtonStates() {
    this.startBtn.disabled = this.isRunning;
    this.stopBtn.disabled = !this.isRunning;
  }

  updateStatus(className, text) {
    this.status.className = className;
    this.status.textContent = text;
  }
  updateDisplay() {
    this.timerDisplay.textContent = this.currentTime;
    this.updateButtonStates();
    this.updateStatsDisplay();    if (!this.isRunning) {
      this.updateStatus("inactive", "Nhấn 'Bắt đầu' để check tự động");
    }
  }

  async resetStats() {
    try {
      await chrome.runtime.sendMessage({ type: "resetStats" });
      this.refreshCountValue = 0;
      this.totalTimeValue = 0;
      this.updateStatsDisplay();
      this.updateStatus("", "📊 Đã reset thống kê");
    } catch (error) {
      console.error("Lỗi khi reset stats:", error);
    }
  }

  updateStats(refreshCount, totalTime) {
    this.refreshCountValue = refreshCount;
    this.totalTimeValue = totalTime;
    this.updateStatsDisplay();
  }

  updateStatsDisplay() {
    this.refreshCount.textContent = this.refreshCountValue;
    this.totalTime.textContent = this.formatTime(this.totalTimeValue);
  }

  formatTime(seconds) {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }

  async checkCurrentURL() {
    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tabs.length > 0) {
        const currentURL = tabs[0].url;
        const targetURL = "https://fap.fpt.edu.vn/Grade/StudentGrade.aspx";

        if (!currentURL.startsWith(targetURL)) {
          this.updateStatus(
            "inactive",
            "⚠️ Chỉ hoạt động trên trang FPT Grade!"
          );
          this.startBtn.disabled = true;
          this.startBtn.title = "Extension chỉ hoạt động trên trang FPT Grade";
        } else {
          this.startBtn.disabled = false;
          this.startBtn.title = "";
        }
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra URL:", error);
    }
  }
}

// Khởi tạo popup khi DOM đã load
document.addEventListener("DOMContentLoaded", () => {
  new AutoF5Popup();
});
