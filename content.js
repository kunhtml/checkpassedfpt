// content.js - Script chạy trên mọi trang web

class AutoF5Content {
  constructor() {
    this.isPageRefreshing = false;
    this.statusChecker = null;
    this.lastStatus = null; // Thêm biến cờ để kiểm soát thông báo
    this.initializeContentScript();
  }

  initializeContentScript() {
    if (!this.isTargetURL()) {
      console.log("Tự Động Check Passed FPT: Trang này không được hỗ trợ");
      return;
    }

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });

    this.createBottomRightPopup();
    this.loadInitialStats();
    this.startStatusChecking();

    console.log(
      "Tự Động Check Passed FPT Content Script loaded on:",
      window.location.href
    );
  }

  handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case "timerUpdate":
        this.updateBottomRightPopup(message.timeLeft, message.isRunning);
        if (
          message.refreshCount !== undefined &&
          message.totalTime !== undefined
        ) {
          this.updatePopupStats(message.refreshCount, message.totalTime);
        }
        break;
      case "pageRefresh":
        this.handlePageRefresh();
        break;
      case "refreshHappened":
        this.updatePopupStats(message.refreshCount, message.totalTime);
        break;
      case "playPassedSound":
        this.playPassedSoundWithDuration(message.duration);
        break;
      default:
        break;
    }
  }

  createTimerIndicator() {
    const indicator = document.createElement("div");
    indicator.id = "autoF5Indicator";
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 999999;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 8px 12px;
      border-radius: 20px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      font-weight: bold;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      display: none;
      transition: all 0.3s ease;
      cursor: pointer;
      user-select: none;
    `;

    indicator.addEventListener("click", () => {
      indicator.style.opacity = indicator.style.opacity === "0.3" ? "1" : "0.3";
    });

    document.body.appendChild(indicator);
  }

  updateTimerIndicator(timeLeft, isRunning) {
    const indicator = document.getElementById("autoF5Indicator");
    if (!indicator) return;

    if (isRunning) {
      indicator.style.display = "block";
      if (timeLeft <= 5) {
        indicator.style.background =
          "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)";
        indicator.style.animation = "pulse 1s infinite";
      } else {
        indicator.style.background =
          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
        indicator.style.animation = "none";
      }
      if (timeLeft === 0) {
        indicator.innerHTML = "🔄 Refreshing...";
        indicator.style.background =
          "linear-gradient(135deg, #4CAF50 0%, #45a049 100%)";
      }
    } else {
      indicator.style.display = "none";
    }
  }

  handlePageRefresh() {
    if (this.statusChecker) {
      clearInterval(this.statusChecker);
      this.statusChecker = null;
    }
    this.showRefreshNotification();
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  showRefreshNotification() {
    const toast = document.createElement("div");
    toast.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 9999999;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 20px 30px;
      border-radius: 10px;
      font-family: Arial, sans-serif;
      font-size: 16px;
      font-weight: bold;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 2000);
  }

  createBottomRightPopup() {
    const popup = document.createElement("div");
    popup.id = "autoF5BottomPopup";
    popup.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999998;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 20px;
      border-radius: 15px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 13px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      display: none;
      transition: all 0.4s ease;
      cursor: pointer;
      user-select: none;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      min-width: 200px;
      max-width: 280px;
    `;

    popup.innerHTML = `
      <div class="popup-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <span style="font-weight: bold; font-size: 14px;">✔️ Tự Động Check Passed FPT</span>
        <span id="popupCloseBtn" style="cursor: pointer; font-size: 16px; opacity: 0.7; transition: opacity 0.3s;">×</span>
      </div>
      <div class="popup-content">
        <div class="timer-section" style="text-align: center; margin-bottom: 10px;">
          <div id="popupTimer" style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">30</div>
          <div id="popupStatus" style="font-size: 11px; opacity: 0.8;">Click 'Bắt đầu' để check tự động</div>
        </div>
        <div class="stats-section" style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 10px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span style="opacity: 0.8;">Số lần F5:</span>
            <span id="popupRefreshCount" style="font-weight: bold;">0</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span style="opacity: 0.8;">cook tool by max stewie</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="opacity: 0.8;">Trạng thái:</span>
            <span id="popupPageStatus" style="font-weight: bold; font-size: 11px;">Đang kiểm tra...</span>
          </div>
          <div style="text-align: center; font-size: 10px; opacity: 0.6; font-style: italic; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
          </div>
        </div>
      </div>
    `;

    const closeBtn = popup.querySelector("#popupCloseBtn");
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.hideBottomRightPopup();
    });

    popup.addEventListener("click", () => {
      this.togglePopupSize();
    });

    closeBtn.addEventListener("mouseenter", () => {
      closeBtn.style.opacity = "1";
      closeBtn.style.transform = "scale(1.2)";
    });

    closeBtn.addEventListener("mouseleave", () => {
      closeBtn.style.opacity = "0.7";
      closeBtn.style.transform = "scale(1)";
    });

    document.body.appendChild(popup);
  }

  updateBottomRightPopup(timeLeft, isRunning) {
    const popup = document.getElementById("autoF5BottomPopup");
    if (!popup) return;

    const timerEl = popup.querySelector("#popupTimer");
    const statusEl = popup.querySelector("#popupStatus");

    if (isRunning) {
      popup.style.display = "block";
      timerEl.textContent = timeLeft;

      if (timeLeft <= 5) {
        popup.style.background =
          "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)";
        popup.style.animation = "popupPulse 1s infinite";
      } else {
        popup.style.background =
          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
        popup.style.animation = "none";
      }

      if (timeLeft === 0) {
        statusEl.textContent = "🔄 Đang refresh...";
        popup.style.background =
          "linear-gradient(135deg, #4CAF50 0%, #45a049 100%)";
      } else {
        statusEl.textContent = `⏰ Còn lại ${timeLeft} giây`;
      }
    } else {
      statusEl.textContent = "⏸️ Đã dừng";
      popup.style.animation = "none";
      popup.style.background =
        "linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)";
    }
  }

  updatePopupStats(refreshCount, totalTime) {
    const popup = document.getElementById("autoF5BottomPopup");
    if (!popup) return;

    const refreshCountEl = popup.querySelector("#popupRefreshCount");
    const totalTimeEl = popup.querySelector("#popupTotalTime");

    if (refreshCountEl) refreshCountEl.textContent = refreshCount;
    if (totalTimeEl) totalTimeEl.textContent = this.formatTime(totalTime);
  }

  hideBottomRightPopup() {
    const popup = document.getElementById("autoF5BottomPopup");
    if (popup) {
      popup.style.transform = "translateX(100%)";
      setTimeout(() => {
        popup.style.display = "none";
        popup.style.transform = "translateX(0)";
      }, 400);
    }
  }

  togglePopupSize() {
    const popup = document.getElementById("autoF5BottomPopup");
    if (!popup) return;

    const content = popup.querySelector(".popup-content");
    const isMinimized = content.style.display === "none";

    if (isMinimized) {
      content.style.display = "block";
      popup.style.animation = "popupExpand 0.3s ease";
    } else {
      content.style.display = "none";
      popup.style.animation = "popupShrink 0.3s ease";
    }
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

  playSuccessSound() {
    try {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const frequencies = [800, 1000, 1200];
      const duration = 0.2;
      const gap = 0.1;

      frequencies.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = "sine";

        const startTime = audioContext.currentTime + index * (duration + gap);
        const endTime = startTime + duration;

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, endTime);

        oscillator.start(startTime);
        oscillator.stop(endTime);
      });

      console.log("🔊 Đã phát âm thanh thông báo PASSED!");
    } catch (error) {
      console.error("Lỗi khi phát âm thanh:", error);
      this.playFallbackSound();
    }
  }

  playFallbackSound() {
    try {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 1000;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error("Lỗi fallback âm thanh:", error);
    }
  }

  playPassedSoundWithDuration(duration) {
    try {
      console.log("🔊 Bắt đầu phát âm thanh PASSED trong", duration, "giây");
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const frequencies = [800, 1000, 1200];
      const beepDuration = 0.3;
      const gap = 0.2;
      const cycleTime = (beepDuration + gap) * frequencies.length;
      const numberOfCycles = Math.ceil(duration / cycleTime);

      for (let cycle = 0; cycle < numberOfCycles; cycle++) {
        const cycleStartTime = cycle * cycleTime;
        if (cycleStartTime >= duration) break;

        frequencies.forEach((frequency, index) => {
          const startTime =
            audioContext.currentTime +
            cycleStartTime +
            index * (beepDuration + gap);
          const endTime = startTime + beepDuration;
          if (startTime >= audioContext.currentTime + duration) return;

          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.value = frequency;
          oscillator.type = "sine";

          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            Math.min(endTime, audioContext.currentTime + duration)
          );

          oscillator.start(startTime);
          oscillator.stop(
            Math.min(endTime, audioContext.currentTime + duration)
          );
        });
      }

      this.showSoundCountdown(duration);

      console.log(`🔊 Đã lập lịch phát âm thanh trong ${duration} giây`);
    } catch (error) {
      console.error("Lỗi khi phát âm thanh tùy chỉnh:", error);
      this.playSuccessSound();
    }
  }

  showSoundCountdown(duration) {
    const countdownElement = document.createElement("div");
    countdownElement.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(76, 175, 80, 0.95);
      color: white;
      padding: 20px 30px;
      border-radius: 10px;
      font-size: 18px;
      font-weight: bold;
      z-index: 10001;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      border: 2px solid #4CAF50;
      text-align: center;
      font-family: 'Arial', sans-serif;
    `;

    let timeLeft = duration;
    countdownElement.innerHTML = `
      🎉 PASSED! 🎉<br>
      🔊 Âm thanh: ${timeLeft}s
    `;

    document.body.appendChild(countdownElement);

    const countdownInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
        countdownElement.remove();
      } else {
        countdownElement.innerHTML = `
          🎉 PASSED! 🎉<br>
          🔊 Âm thanh: ${timeLeft}s
        `;
      }
    }, 1000);

    setTimeout(() => {
      if (countdownElement.parentNode) {
        countdownElement.remove();
      }
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    }, (duration + 1) * 1000);
  }

  async loadInitialStats() {
    try {
      const response = await chrome.runtime.sendMessage({ type: "getStatus" });
      if (response && response.refreshCount !== undefined) {
        this.updatePopupStats(response.refreshCount, response.totalTime);
        if (response.isRunning) {
          this.updateBottomRightPopup(response.timeLeft, response.isRunning);
        }
      }
    } catch (error) {
      console.log("Không thể load thống kê ban đầu:", error);
    }
  }

  startStatusChecking() {
    this.statusChecker = setInterval(() => {
      this.checkPageStatus();
    }, 2000);
  }

  isExtensionContextValid() {
    return !!chrome.runtime?.id;
  }

  async checkPageStatus() {
    try {
      if (!this.isExtensionContextValid()) {
        console.warn("Extension context invalidated - Bỏ qua check trạng thái");
        if (this.statusChecker) {
          clearInterval(this.statusChecker);
          this.statusChecker = null;
        }
        return;
      }

      const response = await chrome.runtime.sendMessage({ type: "getStatus" });
      if (!response || !response.isRunning) {
        return;
      }

      const passedElement = this.findStatusElement("Passed", "Green");
      const notPassedElement = this.findStatusElement("Not Passed", "Red");

      if (passedElement) {
        if (this.lastStatus !== "PASSED") {
          this.handlePassedStatus();
          this.lastStatus = "PASSED";
        }
      } else if (notPassedElement) {
        if (this.lastStatus !== "NOT_PASSED") {
          this.updatePopupStatus("❌ Not Passed - Đang F5...");
          this.handleNotPassedStatus();
          this.lastStatus = "NOT_PASSED";
        }
      } else {
        this.lastStatus = null;
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra trạng thái trang:", error);
      if (error.message.includes("context invalidated")) {
        if (this.statusChecker) {
          clearInterval(this.statusChecker);
          this.statusChecker = null;
        }
      }
    }
  }

  findStatusElement(statusText, color) {
    const rows = document.querySelectorAll("tr");
    for (const row of rows) {
      const cells = row.querySelectorAll("td");
      if (cells.length >= 2) {
        const firstCell = cells[0];
        const statusCell = cells[1];
        if (firstCell.textContent.trim() === "Status") {
          const font = statusCell.querySelector(`font[color="${color}"]`);
          if (font && font.textContent.trim() === statusText) {
            return font;
          }
        }
      }
    }
    return null;
  }

  async handlePassedStatus() {
    try {
      if (!this.isExtensionContextValid()) {
        console.warn("Context invalidated - Bỏ qua handlePassedStatus");
        return;
      }
      await chrome.runtime.sendMessage({ type: "passedDetected" });
      this.showStatusNotification(
        "🎉 PASSED! Check tự động đã dừng",
        "success"
      );
      this.updatePopupStatus("🎉 PASSED - Đã dừng!");
      if (this.statusChecker) {
        clearInterval(this.statusChecker);
        this.statusChecker = null;
      }
    } catch (error) {
      console.error("Lỗi khi xử lý trạng thái Passed:", error);
    }
  }

  async handleNotPassedStatus() {
    try {
      if (!this.isExtensionContextValid()) {
        console.warn("Context invalidated - Bỏ qua handleNotPassedStatus");
        return;
      }
      await chrome.runtime.sendMessage({ type: "notPassedDetected" });
      this.showStatusNotification(
        "❌ NOT PASSED! Tiếp tục check...",
        "warning"
      );
      this.updatePopupStatus("❌ Not Passed - Đang F5...");
    } catch (error) {
      console.error("Lỗi khi xử lý trạng thái Not Passed:", error);
    }
  }

  showStatusNotification(message, type = "info") {
    const toast = document.createElement("div");
    const bgColor =
      type === "success"
        ? "rgba(76, 175, 80, 0.9)"
        : type === "warning"
        ? "rgba(255, 152, 0, 0.9)"
        : "rgba(33, 150, 243, 0.9)";

    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999999;
      background: ${bgColor};
      color: white;
      padding: 15px 25px;
      border-radius: 10px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      font-weight: bold;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      border: 2px solid rgba(255,255,255,0.3);
    `;

    toast.innerHTML = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 5000);
  }

  updatePopupStatus(statusText) {
    const popup = document.getElementById("autoF5BottomPopup");
    if (!popup) return;

    const pageStatusEl = popup.querySelector("#popupPageStatus");
    if (pageStatusEl) {
      pageStatusEl.textContent = statusText;
      if (statusText.includes("PASSED")) {
        pageStatusEl.style.color = "#4CAF50";
      } else if (statusText.includes("Not Passed")) {
        pageStatusEl.style.color = "#fff";
      } else {
        pageStatusEl.style.color = "#fff";
      }
    }
  }

  isTargetURL() {
    const targetURL = "https://fap.fpt.edu.vn/Grade/StudentGrade.aspx";
    return window.location.href.startsWith(targetURL);
  }
}

const style = document.createElement("style");
style.textContent = `
  @keyframes pulse {
    0% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.7;
      transform: scale(1.05);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
  @keyframes popupPulse {
    0% {
      transform: scale(1);
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    }
    50% {
      transform: scale(1.02);
      box-shadow: 0 12px 40px rgba(255,107,107,0.4);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    }
  }
  @keyframes popupExpand {
    from {
      transform: scaleY(0.3);
      opacity: 0;
    }
    to {
      transform: scaleY(1);
      opacity: 1;
    }
  }
  @keyframes popupShrink {
    from {
      transform: scaleY(1);
      opacity: 1;
    }
    to {
      transform: scaleY(0.3);
      opacity: 0;
    }
  }
  #autoF5BottomPopup:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0,0,0,0.4) !important;
  }
`;
document.head.appendChild(style);

const autoF5Content = new AutoF5Content();
