function execute() {
    var actions = {
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
