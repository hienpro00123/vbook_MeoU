# VBook Extensions

Bộ extension VBook đọc truyện tranh tiếng Việt.

## Cài đặt

### Cách 1: Thêm qua GitHub Repository
1. Mở VBook app
2. Vào phần **Extensions** / **Kho tiện ích**
3. Thêm repository bằng URL: `https://raw.githubusercontent.com/hienpro00123/vbook_MeoU/main/plugin.json`
4. Extension sẽ xuất hiện trong danh sách, nhấn cài đặt

### Cách 2: Cài thủ công
1. Tải file `plugin.zip` trong thư mục tương ứng
2. Import vào VBook app

## Extensions

| Tên | Nguồn | Phiên bản | Loại | Ngôn ngữ |
|-----|-------|-----------|------|----------|
| OTruyen | [otruyen.cc](https://otruyen.cc) | v5 | Comic | vi_VN |
| TruyenDex | [truyendex.cc](https://truyendex.cc/nettrom) | v5 | Comic | vi_VN |

## Tính năng

### OTruyen
- **Trang chủ**: Đang phát hành, Hoàn thành, Truyện cập nhật, Sắp ra mắt
- **Thể loại**: Danh sách thể loại đầy đủ
- **Tìm kiếm**: Tìm kiếm theo từ khóa có phân trang
- **Chi tiết**: Thông tin truyện, tác giả, mô tả (strip HTML), thể loại
- **Truyện cùng thể loại**: Gợi ý truyện liên quan
- **Mục lục**: Danh sách chương, hỗ trợ đa server
- **Đọc truyện**: Hiển thị ảnh chương truyện

### TruyenDex (MangaDex Tiếng Việt)
- **Trang chủ**: Mới cập nhật, Đánh giá cao, Theo dõi nhiều
- **Thể loại**: Tag MangaDex đầy đủ, có sắp xếp
- **Tìm kiếm**: Tìm kiếm có phân trang offset
- **Chi tiết**: Thông tin truyện, mô tả (strip BBCode), tên khác, năm
- **Truyện cùng thể loại**: Gợi ý theo tag đầu tiên
- **Mục lục**: Hỗ trợ truyện 500+ chương, dedup tự động
- **Đọc truyện**: Ảnh qua proxy, ưu tiên Data Saver

## Cấu trúc

```
otruyen/
├── icon.png, plugin.json, plugin.zip
└── src/
    ├── config.js       # Hằng số + helpers (extractSlug, parseItems, stripHtml...)
    ├── home.js         # Trang chủ
    ├── homecontent.js  # Nội dung trang chủ
    ├── genre.js        # Danh sách thể loại
    ├── genrecontent.js # Truyện theo thể loại
    ├── detail.js       # Chi tiết truyện
    ├── search.js       # Tìm kiếm
    ├── suggest.js      # Truyện cùng thể loại
    ├── toc.js          # Mục lục
    ├── chap.js         # Nội dung chương
    └── page.js         # Chuyển URL → API URL

truyendex/
├── icon.png, plugin.json, plugin.zip
└── src/
    ├── config.js       # Hằng số + helpers (parseMangaList, proxyImage, stripBBCode...)
    ├── home.js         # Trang chủ
    ├── homecontent.js  # Nội dung trang chủ
    ├── genre.js        # Danh sách thể loại (tag MangaDex)
    ├── genrecontent.js # Truyện theo thể loại
    ├── detail.js       # Chi tiết truyện
    ├── search.js       # Tìm kiếm
    ├── suggest.js      # Truyện cùng thể loại
    ├── toc.js          # Mục lục
    ├── chap.js         # Nội dung chương (Data Saver)
    └── page.js         # Chuyển URL → API URL
```
