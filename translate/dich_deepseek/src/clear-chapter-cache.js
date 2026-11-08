load('chapter-cache.js');

function execute() {
    try {
        localStorage.removeItem(CHAPTER_CACHE_KEY);
        return Response.success("Đã xóa bản dịch chương lưu trên thiết bị.");
    } catch (e) {
        return Response.error("Không thể xóa bản dịch chương đã lưu: " + String(e));
    }
}
