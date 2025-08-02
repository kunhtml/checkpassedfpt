# Tự Động Check Passed FPT Chrome Extension - FPT Grade Checker

Extension Chrome chuyên dụng để tự động kiểm tra trạng thái "Passed" trên trang điểm FPT Education.
<img width="1920" height="920" alt="1l" src="https://github.com/user-attachments/assets/31857811-2890-41ad-8289-0608924c5f23" />

![my-11134231-7rase-mcxnagyb2jt1e7](https://github.com/user-attachments/assets/edd00a0a-5a54-46c2-8e2f-c68bcde94be7)

## 🎯 **Mục đích sử dụng**

Extension này được thiết kế đặc biệt cho sinh viên FPT để:

- Tự động refresh trang điểm FPT Education (https://fap.fpt.edu.vn/Grade/StudentGrade.aspx)
- Phát hiện tự động khi điểm chuyển từ "Not Passed" thành "Passed"
- Dừng auto refresh ngay lập tức khi phát hiện "Passed"
- Chỉ hoạt động trên domain FPT Education để tránh can thiệp các trang khác

## 🌟 Tính năng

- ⏰ **Đếm ngược tùy chỉnh**: Cài đặt thời gian từ 5 giây đến 1 giờ
- 🔄 **Tự động refresh thông minh**: Chỉ refresh khi cần thiết
- 🎯 **Chỉ hoạt động trên FPT**: Extension chỉ chạy trên trang điểm FPT Education
- 🤖 **Phát hiện trạng thái thông minh**:
  - ✅ Tự động phát hiện "Passed" (màu xanh) và dừng ngay lập tức
  - ❌ Tự động phát hiện "Not Passed" (màu đỏ) và tiếp tục kiểm tra
  - 🔍 Kiểm tra liên tục mỗi 2 giây kể cả khi không refresh
- 📊 **Thống kê chi tiết**:
  - Đếm số lần đã F5
  - Tổng thời gian đã chạy
  - Reset thống kê độc lập
- 👁️ **Hiển thị trực quan**:
  - Badge hiển thị thời gian còn lại trên icon extension
  - Indicator góc màn hình khi timer đang chạy
  - Popup góc phải dưới với thông tin chi tiết
- 🔔 **Thông báo**: Notification khi refresh trang và phát hiện trạng thái
- 💾 **Lưu cài đặt**: Ghi nhớ thời gian và thống kê

## 🚀 Cài đặt

### Cách 1: Cài đặt từ source code

1. **Tải source code**:

   ```bash
   git clone [repo-url]
   cd tu-dong-check-passed-fpt
   ```

2. **Mở Chrome Extensions**:

   - Vào `chrome://extensions/`
   - Bật chế độ "Developer mode" ở góc trên bên phải

3. **Load extension**:
   - Click "Load unpacked"
   - Chọn thư mục chứa extension này

### Cách 2: Tạo icon (tuỳ chọn)

Bạn cần tạo các file icon PNG với kích thước:

- `icons/icon16.png` (16x16px)
- `icons/icon32.png` (32x32px)
- `icons/icon48.png` (48x48px)
- `icons/icon128.png` (128x128px)

Hoặc có thể sử dụng icon emoji tạm thời.

## 📱 Cách sử dụng

### Giao diện chính

1. **Click vào icon extension** trên thanh công cụ Chrome
2. **Cài đặt thời gian**:

   - Nhập số giây trong ô "Thời gian đếm ngược"
   - Click "⚙️ Cài đặt thời gian"

3. **Điều khiển timer**:
   - **▶️ Bắt đầu**: Khởi động đếm ngược
   - **⏸️ Dừng**: Tạm dừng timer
   - **🔄 Reset**: Đặt lại về thời gian ban đầu
   - **📊 Reset Stats**: Đặt lại thống kê về 0

### Các chức năng

- **Badge counter**: Số đếm ngược hiển thị trên icon extension
- **Visual indicator**: Hiển thị ở góc phải trên màn hình khi timer chạy (kèm số lần F5)
- **🆕 Popup thống kê**: Popup chi tiết ở góc phải dưới màn hình
  - Hiển thị đếm ngược lớn và trạng thái
  - Thống kê thời gian thực (số lần F5, tổng thời gian)
  - Click để thu gọn/mở rộng
  - Nút đóng (X) để ẩn popup
  - Hiệu ứng đẹp mắt với gradient và animation
- **Auto refresh**: Tự động F5 khi đếm về 0
- **Notification**: Thông báo khi refresh thành công (hiển thị số lần)
- **📊 Thống kê**:
  - Đếm số lần đã F5
  - Tổng thời gian đã chạy (định dạng thông minh)
  - Hiển thị trong popup extension và popup trang web
- **🤖 Tự động phát hiện trạng thái**:
  - Tự động phát hiện `<font color="Green">Passed</font>` → Dừng F5
  - Tự động phát hiện `<font color="Red">Not Passed</font>` → Tiếp tục F5
  - Kiểm tra mỗi 2 giây, thông báo real-time trong popup

## ⚙️ Cài đặt

- **Thời gian tối thiểu**: 5 giây
- **Thời gian tối đa**: 3600 giây (1 giờ)
- **Thời gian mặc định**: 30 giây

## 🔧 Cấu trúc dự án

```
tu-dong-check-passed-fpt/
├── manifest.json       # Chrome extension manifest
├── popup.html         # Giao diện popup
├── popup.js          # Logic giao diện
├── background.js     # Service worker chính
├── content.js        # Script inject vào trang web
├── icons/           # Thư mục chứa icon
└── README.md        # File hướng dẫn này
```

## 🛠️ Phát triển

### Yêu cầu

- Chrome Browser phiên bản mới nhất
- Manifest V3 support

### Debug

1. Mở `chrome://extensions/`
2. Tìm extension "Tự Động Check Passed FPT"
3. Click "Details" → "Inspect views: background page" để debug background script
4. F12 trên popup để debug giao diện

### Các API sử dụng

- `chrome.storage.local`: Lưu trữ cài đặt
- `chrome.tabs`: Quản lý tab và refresh
- `chrome.notifications`: Hiển thị thông báo
- `chrome.action`: Badge và popup
- `chrome.runtime`: Message passing

## 🐛 Troubleshooting

### Extension không hoạt động

1. Kiểm tra đã bật "Developer mode"
2. Kiểm tra console có lỗi không
3. Reload extension từ `chrome://extensions/`

### Timer không chính xác

- Timer có thể bị ảnh hưởng khi tab không active
- Chrome có thể throttle timer khi tab ở background

### Không refresh được trang

- Kiểm tra trang có chặn reload không
- Một số trang có thể có policy ngăn auto refresh

## 📄 License

MIT License - Sử dụng tự do cho mục đích cá nhân và thương mại.

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Hãy tạo issue hoặc pull request.

## 📞 Hỗ trợ

Nếu gặp vấn đề, hãy tạo issue trên GitHub hoặc liên hệ trực tiếp.

---

⭐ **Đừng quên star nếu thấy hữu ích!** ⭐

