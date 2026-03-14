# VBook Extensions

Extension VBook đọc truyện tranh từ OTruyen.CC

## Cài đặt

### Cách 1: Thêm qua GitHub Repository
1. Mở VBook app
2. Vào phần **Extensions** / **Kho tiện ích**
3. Thêm repository bằng URL: `https://raw.githubusercontent.com/<username>/vbook-otruyen-extension/master/plugin.json`
4. Extension **OTruyen** sẽ xuất hiện trong danh sách, nhấn cài đặt

### Cách 2: Cài thủ công
1. Tải file `otruyen/plugin.zip`
2. Import vào VBook app

## Extensions

| Tên | Nguồn | Loại | Ngôn ngữ |
|-----|-------|------|----------|
| OTruyen | [otruyen.cc](https://otruyen.cc) | Comic | vi_VN |

## Tính năng

- **Trang chủ**: Truyện mới cập nhật, Sắp ra mắt, Đang phát hành, Hoàn thành
- **Thể loại**: 54 thể loại truyện
- **Tìm kiếm**: Tìm kiếm theo từ khóa
- **Chi tiết**: Thông tin truyện, tác giả, mô tả, thể loại
- **Mục lục**: Danh sách chương
- **Đọc truyện**: Hiển thị ảnh chương truyện

## API

Extension sử dụng [OTruyen API](https://docs.otruyenapi.com/) - API miễn phí cung cấp dữ liệu truyện tranh.

## Cấu trúc

```
otruyen/
├── icon.png          # Icon extension
├── plugin.json       # Thông tin extension
├── plugin.zip        # File cài đặt
└── src/
    ├── config.js     # Cấu hình API URL
    ├── home.js       # Trang chủ
    ├── homecontent.js # Nội dung trang chủ
    ├── genre.js      # Danh sách thể loại
    ├── genrecontent.js # Truyện theo thể loại
    ├── detail.js     # Chi tiết truyện
    ├── search.js     # Tìm kiếm
    ├── toc.js        # Mục lục
    ├── chap.js       # Nội dung chương
    ├── page.js       # Phân trang mục lục
    ├── suggest.js    # Truyện liên quan
    └── comment.js    # Bình luận
```
