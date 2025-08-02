// content.js - Script chạy trên mọi trang web

class AutoF5Content {
  constructor() {
    this.isPageRefreshing = false;
    this.statusChecker = null;
    this.initializeContentScript();
  }
  initializeContentScript() {
    // Kiểm tra URL trước khi khởi tạo
    if (!this.isTargetURL()) {
      console.log("Tự Động Check Passed FPT: Trang này không được hỗ trợ");
      return;
    }

    // Lắng nghe messages từ background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });

    // Thêm visual indicator khi timer đang chạy
    this.createTimerIndicator();

    // Thêm popup ở góc phải dưới
    this.createBottomRightPopup();

    // Load thống kê ban đầu
    this.loadInitialStats();

    // Bắt đầu kiểm tra trạng thái trang
    this.startStatusChecking();

    console.log(
      "Tự Động Check Passed FPT Content Script loaded on:",
      window.location.href
    );
  }
  handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case "timerUpdate":
        this.updateTimerIndicator(message.timeLeft, message.isRunning);
        this.updateBottomRightPopup(message.timeLeft, message.isRunning);
        // Cập nhật thống kê nếu có
        if (
          message.refreshCount !== undefined &&
          message.totalTime !== undefined
        ) {
          this.updatePopupStats(message.refreshCount, message.totalTime);
          this.updateIndicatorStats(message.refreshCount);
        }
        break;

      case "pageRefresh":
        this.handlePageRefresh();
        break;
      case "refreshHappened":
        this.updateIndicatorStats(message.refreshCount);
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
    // Tạo indicator hiển thị ở góc màn hình
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

    indicator.innerHTML = "🔄 FPT Check: 30s";

    // Thêm click handler để toggle visibility
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
      indicator.innerHTML = `🔄 FPT Check: ${timeLeft}s`;

      // Thay đổi màu khi gần hết thời gian
      if (timeLeft <= 5) {
        indicator.style.background =
          "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)";
        indicator.style.animation = "pulse 1s infinite";
      } else {
        indicator.style.background =
          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
        indicator.style.animation = "none";
      }

      // Hiệu ứng flash khi refresh
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
    // Hiển thị thông báo trước khi refresh
    this.showRefreshNotification();

    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  showRefreshNotification() {
    // Tạo notification toast
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

    toast.innerHTML = "🔄 FPT Check: Đang refresh trang...";

    document.body.appendChild(toast);

    // Xóa toast sau 2 giây
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 2000);
  }
  updateIndicatorStats(refreshCount) {
    const indicator = document.getElementById("autoF5Indicator");
    if (!indicator) return;

    // Hiển thị số lần F5 trong indicator
    if (refreshCount > 0) {
      const currentText = indicator.innerHTML;
      if (currentText.includes("F5:")) {
        // Thêm badge số lần F5
        indicator.innerHTML = currentText.replace("🔄", `🔄(${refreshCount})`);
      }
    }
  }

  createBottomRightPopup() {
    // Tạo popup ở góc phải dưới màn hình
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
      <div class="popup-content">        <div class="timer-section" style="text-align: center; margin-bottom: 10px;">
          <div id="popupTimer" style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">30</div>
          <div id="popupStatus" style="font-size: 11px; opacity: 0.8;">Click 'Bắt đầu' để check tự động</div>
        </div><div class="stats-section" style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 10px;">
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

    // Thêm event listeners
    const closeBtn = popup.querySelector("#popupCloseBtn");
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.hideBottomRightPopup();
    });

    // Click popup để toggle minimize
    popup.addEventListener("click", () => {
      this.togglePopupSize();
    });

    // Hover effects
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
      // Giữ popup hiển thị nhưng thay đổi trạng thái
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
      // Tạo context âm thanh
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();

      // Tạo chuỗi âm thanh thành công (3 tiếng beep ngắn)
      const frequencies = [800, 1000, 1200]; // Tần số tăng dần
      const duration = 0.2; // Độ dài mỗi tiếng beep
      const gap = 0.1; // Khoảng cách giữa các tiếng beep

      frequencies.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = "sine";

        // Thiết lập volume và fade
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
      // Fallback: sử dụng beep đơn giản
      this.playFallbackSound();
    }
  }
  playFallbackSound() {
    try {
      // Sử dụng Audio API đơn giản với data URL
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 1000; // 1kHz
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

      // Tạo context âm thanh
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();

      // Âm thanh sẽ phát liên tục trong khoảng thời gian được chỉ định
      const frequencies = [800, 1000, 1200]; // 3 tần số khác nhau
      const beepDuration = 0.3; // Độ dài mỗi tiếng beep
      const gap = 0.2; // Khoảng cách giữa các tiếng beep
      const cycleTime = (beepDuration + gap) * frequencies.length; // Thời gian 1 chu kỳ

      const numberOfCycles = Math.ceil(duration / cycleTime); // Số chu kỳ cần phát

      // Phát âm thanh theo chu kỳ
      for (let cycle = 0; cycle < numberOfCycles; cycle++) {
        const cycleStartTime = cycle * cycleTime;

        // Dừng nếu vượt quá thời gian yêu cầu
        if (cycleStartTime >= duration) break;

        frequencies.forEach((frequency, index) => {
          const startTime =
            audioContext.currentTime +
            cycleStartTime +
            index * (beepDuration + gap);
          const endTime = startTime + beepDuration;

          // Dừng nếu vượt quá thời gian yêu cầu
          if (startTime >= audioContext.currentTime + duration) return;

          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.value = frequency;
          oscillator.type = "sine";

          // Thiết lập volume và fade
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

      // Hiển thị countdown âm thanh
      this.showSoundCountdown(duration);

      console.log(`🔊 Đã lập lịch phát âm thanh trong ${duration} giây`);
    } catch (error) {
      console.error("Lỗi khi phát âm thanh tùy chỉnh:", error);
      // Fallback: phát âm thanh ngắn
      this.playSuccessSound();
    }
  }

  showSoundCountdown(duration) {
    // Tạo element hiển thị countdown âm thanh
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

    // Cập nhật countdown mỗi giây
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

    // Tự động xóa sau thời gian duration + 1 giây
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
        this.updateIndicatorStats(response.refreshCount);

        // Hiển thị popup nếu timer đang chạy
        if (response.isRunning) {
          this.updateBottomRightPopup(response.timeLeft, response.isRunning);
        }
      }
    } catch (error) {
      console.log("Không thể load thống kê ban đầu:", error);
    }
  }

  startStatusChecking() {
    // Kiểm tra trạng thái mỗi 2 giây
    this.statusChecker = setInterval(() => {
      this.checkPageStatus();
    }, 2000);
  }
  checkPageStatus() {
    // Tìm kiếm trạng thái "Passed" và "Not Passed" bằng JavaScript thuần
    const passedElement = this.findStatusElement("Passed", "Green");
    const notPassedElement = this.findStatusElement("Not Passed", "Red");

    if (passedElement) {
      console.log("🎉 Phát hiện trạng thái PASSED - Dừng check tự động!");
      this.handlePassedStatus();
    } else if (notPassedElement) {
      console.log(
        "❌ Phát hiện trạng thái NOT PASSED - Tiếp tục check tự động!"
      );
      this.handleNotPassedStatus();
    }
  }

  findStatusElement(statusText, color) {
    // Tìm kiếm chính xác theo cấu trúc HTML được cung cấp
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
      // Gửi thông báo đến background về việc phát hiện PASSED
      // Background sẽ xử lý việc dừng timer và phát âm thanh
      await chrome.runtime.sendMessage({ type: "passedDetected" });

      // Hiển thị thông báo
      this.showStatusNotification(
        "🎉 PASSED! Check tự động đã dừng",
        "success"
      );

      // Cập nhật popup
      this.updatePopupStatus("🎉 PASSED - Đã dừng!");

      // Dừng kiểm tra trạng thái
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
      // Chỉ cập nhật trạng thái popup, KHÔNG hiển thị thông báo
      this.updatePopupStatus("❌ Not Passed - Tiếp Tục Chạy");
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

    // Xóa toast sau 5 giây
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

      // Thay đổi màu theo trạng thái
      if (statusText.includes("PASSED")) {
        pageStatusEl.style.color = "#4CAF50";
      } else if (statusText.includes("Not Passed")) {
        pageStatusEl.style.color = "#ff6b6b";
      } else {
        pageStatusEl.style.color = "#fff";
      }
    }
  }

  isTargetURL() {
    // Chỉ hoạt động trên trang FPT Grade
    const targetURL = "https://fap.fpt.edu.vn/Grade/StudentGrade.aspx";
    return window.location.href.startsWith(targetURL);
  }
}

// Thêm CSS cho animation pulse và popup
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

// Khởi tạo content script
const autoF5Content = new AutoF5Content();
