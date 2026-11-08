function execute() {
    var actions = {
        clear_book_chapter_cache: {
            name: "Xóa bản dịch của truyện hiện tại",
            description: "Xóa các đoạn dịch đã lưu của truyện đang mở; không xóa cache truyện khác hoặc bộ nhớ dịch",
            script: "clear-book-chapter-cache.js"
        },
        clear_chapter_cache: {
            name: "Xóa bản dịch của tất cả truyện",
            description: "Xóa toàn bộ cache chương trên thiết bị; dùng sau khi sửa bộ nhớ dịch hoặc muốn dịch lại",
            script: "clear-chapter-cache.js"
        },
        restore_defaults: {
            name: "Khôi phục cài đặt gốc",
            description: "Đặt lại cấu hình và prompt về mặc định; không xóa bộ nhớ dịch theo truyện",
            script: "reset-defaults.js"
        },
        analyze_translation_memory: {
            name: "Phân tích tên và quan hệ",
            description: "Phân tích các chương đã lưu của truyện hiện tại để cập nhật tên, biệt danh và quan hệ trong bộ nhớ dịch",
            script: "analyze-memory.js"
        },
        analyze_genre_style: {
            name: "Phân tích thể loại và tạo prompt dịch",
            description: "Dùng model và chế độ suy nghĩ đã chọn để phân tích tối đa 4 mẫu chương, rồi lưu prompt phong cách ngắn",
            script: "analyze-genre.js"
        }
    };
    return Response.success(actions);
}
