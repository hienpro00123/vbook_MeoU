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
| OTruyen | [otruyen.cc](https://otruyen.cc) | v7 | Comic | vi_VN |
| TruyenDex | [truyendex.cc](https://truyendex.cc/nettrom) | v9 | Comic | vi_VN |
| Wattpad | [wattpad.com](https://www.wattpad.com) | v2 | Novel | vi |

## Tính năng

### OTruyen
- **Trang chủ**: Đang phát hành, Hoàn thành, Truyện cập nhật, Sắp ra mắt
- **Thể loại**: Danh sách thể loại đầy đủ
- **Tìm kiếm**: Tìm kiếm theo từ khóa có phân trang
- **Chi tiết**: Thông tin truyện, tác giả, mô tả (strip HTML), thể loại
- **Truyện cùng thể loại**: Gợi ý truyện liên quan
- **Truyện cùng tác giả**: Gợi ý truyện cùng tác giả
- **Mục lục**: Danh sách chương, hỗ trợ đa server
- **Đọc truyện**: Hiển thị ảnh chương truyện

### TruyenDex (MangaDex Tiếng Việt)
- **Trang chủ**: Mới cập nhật, Đánh giá cao, Theo dõi nhiều
- **Thể loại**: Tag MangaDex đầy đủ, có sắp xếp
- **Tìm kiếm**: Tìm kiếm có phân trang offset
- **Chi tiết**: Thông tin truyện, mô tả (strip BBCode), tên khác, năm
- **Truyện cùng thể loại**: Gợi ý theo tag đầu tiên
- **Truyện cùng tác giả**: Gợi ý truyện cùng tác giả
- **Mục lục**: Hỗ trợ truyện 500+ chương, dedup tự động
- **Đọc truyện**: Ảnh trực tiếp từ MangaDex at-home CDN (không qua proxy, tải nhanh trên 5G)

### Wattpad (Tiếng Việt)
- **Trang chủ**: Nổi bật, Mới cập nhật, Mới nhất, Hoàn thành
- **Thể loại**: 47 thể loại tiếng Việt
- **Tìm kiếm**: Tìm kiếm tiếng Việt (`language=19`)
- **Chi tiết**: Thông tin truyện, tác giả, mô tả, tag
- **Truyện cùng thể loại**: Gợi ý theo tag đầu tiên
- **Truyện cùng tác giả**: Gợi ý toàn bộ truyện của tác giả
- **Mục lục**: Danh sách chương
- **Đọc truyện**: Nội dung chương dạng văn bản

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
    ├── suggest.js      # Truyện cùng thể loại / cùng tác giả
    ├── toc.js          # Mục lục
    ├── chap.js         # Nội dung chương
    └── page.js         # Chuyển URL → API URL

truyendex/
├── icon.png, plugin.json, plugin.zip
└── src/
    ├── config.js       # Hằng số + helpers (parseMangaList, proxyImage cho bìa, stripBBCode...)
    ├── home.js         # Trang chủ
    ├── homecontent.js  # Nội dung trang chủ
    ├── genre.js        # Danh sách thể loại (tag MangaDex)
    ├── genrecontent.js # Truyện theo thể loại
    ├── detail.js       # Chi tiết truyện
    ├── search.js       # Tìm kiếm
    ├── suggest.js      # Truyện cùng thể loại / cùng tác giả
    ├── toc.js          # Mục lục
    ├── chap.js         # Nội dung chương (Data Saver)
    └── page.js         # Chuyển URL → API URL

wattpad/
├── icon.png, plugin.json, plugin.zip
└── src/
    ├── config.js       # Hằng số + parseStories helper
    ├── home.js         # Trang chủ (4 tab: Nổi bật, Mới cập nhật, Mới nhất, Hoàn thành)
    ├── homecontent.js  # Nội dung trang chủ
    ├── genre.js        # 47 thể loại tiếng Việt
    ├── genrecontent.js # Truyện theo thể loại
    ├── detail.js       # Chi tiết truyện
    ├── search.js       # Tìm kiếm tiếng Việt
    ├── suggest.js      # Truyện cùng thể loại / cùng tác giả
    ├── toc.js          # Mục lục
    └── chap.js         # Nội dung chương
```
