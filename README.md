# Dashboard Quản Lý Lắp Đặt Tủ Đổi Pin & Tiến Độ Điện Lực (EVN)

Hệ thống Dashboard WebApp hiện đại giúp theo dõi và quản lý tiến độ lắp đặt **74+ tủ đổi pin** (Đợt 1: 46 trạm, Đợt 2: 28 trạm), thống kê tiến độ đấu nối cấp điện 3 pha từ **Điện lực (EVN)** và theo dõi chi tiết **các điểm vướng mắc, trở ngại**.

---

## 🌟 Tính Năng Nổi Bật

1. **Tab 1: Tổng Quan (Overview)**:
   - Thống kê các chỉ số KPI: Tổng số trạm, số lượng tủ (6-12 ngăn), tỷ lệ đóng điện 3P EVN, số trạm vướng mắc.
   - Biểu đồ phân tích tiến độ theo từng **Tổ Hạ Tầng** (Tân Lạc, Tam Đảo, Thanh Ba, Vĩnh Yên, Hòa Bình, Lương Sơn, Thanh Sơn, Việt Trì...).
   - Biểu đồ tròn tỷ lệ hoàn thành cấp điện EVN.

2. **Tab 2: Tiến Độ Lắp Tủ Đổi Pin (Installation Progress)**:
   - Danh sách bảng trạm đầy đủ thông tin: Mã trạm, địa chỉ, tổ trưởng phụ trách, SĐT, số tủ, loại tủ, phương án điện.
   - Tìm kiếm nhanh thông minh & bộ lọc theo Đợt (Đợt 1 / Đợt 2), theo Tổ Hạ Tầng.
   - Xuất dữ liệu báo cáo dạng **File CSV**.

3. **Tab 3: Thống Kê Tiến Độ Lắp Điện Điện Lực (EVN Grid Progress)**:
   - Thống kê các giai đoạn đấu nối: *Đã đóng điện 3P, Chờ khảo sát/HĐ EVN, Chờ hồ sơ VGREEN, Vướng mắc thủ tục*.
   - Thanh tiến độ (Progress Bar) trực quan theo từng Tổ Hạ Tầng.

4. **Tab 4: Báo Cáo Vướng Mắc & Trở Ngại (Bottlenecks & Issues Tracking)**:
   - Tập trung làm rõ câu hỏi **"Vướng mắc ở đâu?"**.
   - Phân loại vướng mắc theo nhóm nguyên nhân (*Chờ VGREEN phản hồi, Chờ EVN khảo sát/soạn HĐ, Vướng thi công/cắt tường/mặt bằng, Chờ vật tư...*).
   - Cho phép chỉnh sửa & cập nhật trực tiếp nội dung vướng mắc từ WebApp đồng bộ lên Google Sheet.

5. **Tab 5: Bản Đồ Trạm (Interactive Map)**:
   - Bản đồ Leaflet vị trí địa lý của các trạm với ghim màu phân loại trạng thái (*Xanh = Đã xong, Vàng = Chờ EVN, Đỏ = Có vướng mắc*).
   - Thẻ thông tin Popup chi tiết cho từng ghim trạm.

6. **Tích Hợp Google Apps Script API**:
   - Tự động tải & cập nhật dữ liệu trực tiếp từ file Google Sheet gốc ([Google Sheet Link](https://docs.google.com/spreadsheets/d/1lYCGrd20SgUCSy5U3au_sZx2ci9WewiYzfl9OJMg3rM/edit#gid=996207661)).
   - Có chế độ Offline Data fallback sẵn từ file Excel khi chưa cấu hình API URL.

---

## 📁 Cấu Trúc Dự Án

```
6tudoipin/
├── index.html                   # HTML entry point với Tailwind & Leaflet
├── src/
│   ├── main.jsx                 # React root render
│   ├── App.jsx                  # Main dashboard layout & state
│   ├── index.css                # Glassmorphic & Custom CSS styling
│   ├── components/
│   │   ├── Navbar.jsx           # Thanh điều hướng & badge trạng thái API
│   │   ├── StatCard.jsx         # Card chỉ số KPI
│   │   ├── OverviewTab.jsx      # Tab Tổng quan & biểu đồ
│   │   ├── InstallationTab.jsx  # Tab Bảng danh sách lắp tủ
│   │   ├── PowerGridTab.jsx     # Tab Thống kê điện lực EVN
│   │   ├── BottlenecksTab.jsx   # Tab Báo cáo điểm vướng mắc
│   │   ├── MapTab.jsx           # Tab Bản đồ vị trí trạm Leaflet
│   │   ├── StationDetailModal.jsx # Popup chi tiết & cập nhật ghi chú
│   │   └── SettingsModal.jsx    # Modal cấu hình Web App URL
│   └── services/
│       └── api.js               # Service gọi Google Apps Script API
├── google_apps_script/
│   ├── Code.gs                  # Backend script dán vào Apps Script Google Sheet
│   └── README_GAS.md            # Hướng dẫn chi tiết triển khai Apps Script
├── public/
│   └── initial_data.json        # Dữ liệu 74 trạm trích xuất từ Excel
├── vercel.json                  # Cấu hình deploy Vercel SPA
└── package.json
```

---

## 🚀 Hướng Dẫn Đẩy Lên GitHub & Deploy Vercel

### 1. Đẩy Mã Nguồn Lên GitHub
Chạy các lệnh sau trong Terminal (CMD / PowerShell):

```bash
git init
git add .
git commit -m "Initial commit: Battery Swap Station Dashboard & Apps Script Integration"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/tudoipin-dashboard.git
git push -u origin main
```

### 2. Deploy Lên Vercel
1. Truy cập [vercel.com](https://vercel.com) và đăng nhập bằng tài khoản GitHub.
2. Chọn **Add New...** -> **Project**.
3. Chọn Repository `tudoipin-dashboard` vừa đẩy lên.
4. Giữ nguyên mặc định (Framework Preset: **Vite**) và bấm **Deploy**.
5. Vercel sẽ tự động build và cung cấp đường dẫn Live WebApp dạng `https://tudoipin-dashboard.vercel.app`.

---

## 🔗 Kết Nối Google Sheet Dữ Liệu Sống
1. Mở Google Sheet gốc.
2. Chọn **Extensions** -> **Apps Script**.
3. Dán mã từ `google_apps_script/Code.gs` và chọn **Deploy** -> **New Deployment** -> **Web App** (Quyền truy cập: **Anyone**).
4. Sao chép Web App URL và dán vào nút ⚙️ **Cấu hình API** trên WebApp Dashboard.
