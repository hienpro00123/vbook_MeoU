const BASE_URL = "https://www.bilibili.tv";

// Mẫu khởi tạo header, cookie...
function getHeaders() {
    return {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": BASE_URL
    };
}
