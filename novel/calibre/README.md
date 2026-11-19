# Calibre Content Server

Trong cấu hình extension, nhập địa chỉ Content Server và, nếu server yêu cầu,
tên đăng nhập cùng mật khẩu. Nên dùng tài khoản chỉ đọc. Ô mật khẩu là văn bản
thông thường, không được bảo đảm che hoặc lưu trữ an toàn.

Địa chỉ `localhost` hiển thị dưới tên extension là nhãn cố định, không tự đổi
theo cấu hình. Trên điện thoại, localhost là chính điện thoại; nếu Calibre chạy
trên máy khác, nhập địa chỉ mạng của máy đó trong cấu hình extension.

HTTP Digest không mã hóa nội dung, thông tin sách hoặc bảo vệ mật khẩu yếu
trước việc dò đoán. Chỉ dùng HTTP trên mạng tin cậy; ưu tiên HTTPS và mật khẩu
mạnh.

Trang chủ chia sách theo thư viện; tìm kiếm duyệt lần lượt các thư viện.
Thể loại dùng trường Tags của Calibre.

EPUB, AZW3, MOBI và TXT được yêu cầu Calibre chuyển sang HTML để đọc; việc
chuyển đổi phụ thuộc vào định dạng và cấu hình trên server. Mục lục được chia
theo các phần nội dung của Calibre, nên nhiều mục gốc có thể nằm trong cùng
một phần. Bìa, giới thiệu và các mục thông tin được nhận diện sẽ không hiện
trong mục lục; các phần không xác định vẫn được giữ để tránh mất chương.
Kiểu chữ và bố cục CSS gốc không được giữ nguyên. Ảnh nhúng JPEG,
PNG, GIF và WebP được tải qua extension. Ảnh khác hoặc ảnh ngoài sách sẽ báo
lỗi thay vì bị bỏ qua.

PDF, CBZ và các định dạng khác hiện chưa được hỗ trợ; extension báo lỗi khi
sách không có định dạng được hỗ trợ. Không sửa sách hoặc đồng bộ vị trí đọc
về Calibre.
