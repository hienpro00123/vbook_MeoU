load('chapter-cache.js');

function execute() {
    try {
        var book = localBook.getInfo();
        if (!book || !book.id) {
            return Response.error("Hãy chạy action này từ trang cài đặt của một truyện");
        }

        var entries = chapterCacheRead();
        var remaining = [];
        var removed = 0;
        for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];
            if (!entry || typeof entry.key !== "string") {
                throw new Error("Dữ liệu cache chương không hợp lệ");
            }
            var key = JSON.parse(entry.key);
            if (!Array.isArray(key) || typeof key[0] !== "string") {
                throw new Error("Khóa cache chương không hợp lệ");
            }
            if (key[0] === String(book.id)) removed++;
            else remaining.push(entry);
        }

        if (removed > 0) localStorage.setItem(CHAPTER_CACHE_KEY, JSON.stringify(remaining));
        return Response.success("Đã xóa " + removed + " đoạn dịch đã lưu của truyện hiện tại.");
    } catch (e) {
        return Response.error("Không thể xóa bản dịch đã lưu của truyện: " + String(e));
    }
}
