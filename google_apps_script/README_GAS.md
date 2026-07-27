# Hướng Dẫn Triển Khai Google Apps Script Cho Dashboard Tủ Đổi Pin

Tài liệu này hướng dẫn cách kết nối Google Sheet dữ liệu trạm Tủ Đổi Pin với WebApp Dashboard.

Link Google Sheet gốc: [docs.google.com/spreadsheets/d/1lYCGrd20SgUCSy5U3au_sZx2ci9WewiYzfl9OJMg3rM](https://docs.google.com/spreadsheets/d/1lYCGrd20SgUCSy5U3au_sZx2ci9WewiYzfl9OJMg3rM/edit#gid=996207661)

---

## Các bước thực hiện:

### Bước 1: Mở Trình biên soạn Apps Script
1. Mở Google Sheet trên trình duyệt.
2. Trên thanh menu chính, chọn **Tiện ích mở rộng (Extensions)** -> **Apps Script**.

### Bước 2: Dán Mã Nguồn `Code.gs`
1. Xóa toàn bộ nội dung mặc định trong file `Code.gs`.
2. Sao chép nội dung từ file `google_apps_script/Code.gs` trong thư mục này và dán vào.
3. Nhấn biểu tượng 💾 **Lưu (Save)** (hoặc `Ctrl + S`).

### Bước 3: Triển Khai Dưới Dạng Ứng Dụng Web (Web App)
1. Nhấp nút **Triển khai (Deploy)** ở góc trên bên phải -> chọn **Đợt triển khai mới (New deployment)**.
2. Chọn loại triển khai (bánh răng ⚙️): **Ứng dụng web (Web app)**.
3. Thiết lập thông số:
   - **Mô tả (Description)**: `Dashboard Tủ Đổi Pin API v1`
   - **Thực thi dưới dạng (Execute as)**: `Tôi (Me - email của bạn)`
   - **Ai có quyền truy cập (Who has access)**: `Bất kỳ ai (Anyone)` *(Rất quan trọng để WebApp Dashboard tải được dữ liệu)*.
4. Nhấn **Triển khai (Deploy)**.
5. Cấp quyền truy cập nếu Google yêu cầu (*Nâng cao -> Tiếp tục truy cập dự án*).
6. Sao chép đường dẫn **URL ứng dụng web** (Web app URL) dạng:
   `https://script.google.com/macros/s/AKfycb.../exec`

### Bước 4: Nhập URL Vào WebApp Dashboard
1. Mở WebApp Dashboard đã triển khai trên Vercel.
2. Nhấn biểu tượng ⚙️ **Cấu hình API** góc trên bên phải.
3. Dán URL Apps Script Web App vừa sao chép và bấm **Lưu & Đồng bộ**.
4. Dashboard sẽ lập tức kết nối và tải dữ liệu mới nhất trực tiếp từ Google Sheet!

---
⚡ *Ghi chú: Mỗi khi cập nhật mã nguồn Code.gs, hãy bấm Deploy -> New deployment để cập nhật phiên bản Web App URL mới.*
