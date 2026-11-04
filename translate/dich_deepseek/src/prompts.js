var TRANSLATION_PROMPT_TABLE = "translation_prompts";
var TRANSLATION_PROMPT_SCOPE = "";
var TRANSLATION_PROMPT_VERSION_KEY = "dich_deepseek_translation_prompt_version";
var TRANSLATION_PROMPT_VERSION = "4";

function translationNormalizeStyle(style) {
    var selected = String(style || "").trim();
    return selected || "trung-tinh";
}

function translationBookPromptConfigKey(bookId) {
    var value = String(bookId || "");
    if (!value) return "";

    var suffix = "";
    for (var i = 0; i < value.length; i++) {
        var hex = value.charCodeAt(i).toString(16);
        while (hex.length < 4) hex = "0" + hex;
        suffix += hex;
    }
    return "custom_instruction_book_" + suffix;
}

function translationDefaultPrompts() {
    var prompts = {};
    var definitions = translationDefaultStyleDefinitions();
    for (var i = 0; i < definitions.length; i++) {
        prompts[definitions[i].id] = translationBuildPrompt(definitions[i].rule);
    }
    return prompts;
}

function translationDefaultStyleDefinitions() {
    return [
        {
            id: "trung-tinh",
            name: "Trung tính",
            description: "Văn phong tự nhiên, phù hợp nhiều thể loại; không áp đặt sắc thái riêng",
            rule: "Trung tính: Dùng tiếng Việt tự nhiên, rõ nghĩa và trung thành với nguyên tác; giữ sắc thái, mức độ trang trọng, nhịp kể và giọng riêng thể hiện trong đoạn. Không mặc định bối cảnh cổ trang, hiện đại, tiên hiệp hay bất kỳ thể loại nào khi văn bản chưa xác nhận. Giữ nhất quán tên gọi và thuật ngữ đã được xác nhận; không tự đoán giới tính, tuổi tác, quan hệ, động cơ hoặc thêm tình tiết. Ưu tiên diễn đạt sáng rõ, không cường điệu, không Hán Việt hóa lời kể thông thường và không làm phẳng sắc thái của nguyên tác."
        },
        {
            id: "huyen-huyen",
            name: "Huyền huyễn",
            description: "Tiên hiệp, tu chân, huyền huyễn và cổ phong Trung Quốc",
            rule: "Huyền huyễn / tiên hiệp: Tạo sắc thái kỳ ảo, cổ phong vừa đủ nhưng dùng tiếng Việt sáng rõ. Phân biệt tu vi, cảnh giới, công pháp, pháp bảo, huyết mạch, thể chất và thân phận; không nhập các khái niệm hoặc biến mô tả thành tên riêng. Dùng Hán Việt quen thuộc cho thuật ngữ, không Hán Việt hóa lời kể thông thường. Xưng hô theo bằng chứng về tuổi, giới tính, sư môn và vai vế; không suy tuổi từ tu vi."
        },
        {
            id: "kiem-hiep",
            name: "Kiếm hiệp",
            description: "Võ lâm, giang hồ, môn phái và võ công",
            rule: "Kiếm hiệp / võ lâm: Giữ chất giang hồ, cổ phong tiết chế và dễ đọc. Dùng thuật ngữ võ học Hán Việt quen thuộc; phân biệt nội lực, chân khí, chiêu thức và tâm pháp, không tự chuyển thành tu tiên. Trong giao đấu, giữ đúng người ra chiêu, mục tiêu, thế đánh, binh khí và kết quả. Xưng hô theo môn phái, vai vế và quan hệ; võ công cao không đồng nghĩa với lớn tuổi."
        },
        {
            id: "khoa-huyen",
            name: "Khoa huyễn",
            description: "Khoa học viễn tưởng, cơ giáp, tinh tế và mạt thế công nghệ",
            rule: "Khoa huyễn: Dùng tiếng Việt hiện đại, chính xác; không áp giọng tiên hiệp nếu truyện không pha trộn thể loại. Giữ riêng AI, hệ thống, robot, cơ giáp, chiến hạm và các khái niệm khoa học. Bảo toàn số liệu, đơn vị, tọa độ, thời gian, mã hiệu và cấp bậc. Cảnh chiến đấu/du hành phải rõ phương tiện, vị trí, trình tự và nguyên nhân-kết quả."
        },
        {
            id: "do-thi",
            name: "Đô thị",
            description: "Đời sống hiện đại, công sở, gia đình và xã hội",
            rule: "Đô thị hiện đại: Viết tự nhiên như hội thoại và lời kể tiếng Việt hiện nay; không dùng xưng hô cổ trang nếu nguyên tác không có. Chọn cách gọi theo quan hệ, khoảng cách và hoàn cảnh công khai/riêng tư, giữ đúng thời điểm thay đổi. Bảo toàn nghề nghiệp, chức vụ, bối cảnh Trung Quốc, tiền tệ và chi tiết xã hội; không tự thêm tình tiết hoặc cảm xúc."
        },
        {
            id: "fantasy",
            name: "Fantasy",
            description: "Kỳ ảo phương Tây, ma pháp, chủng tộc và phiêu lưu",
            rule: "Fantasy phương Tây: Giữ đúng sắc thái đời thường, trung cổ, quý tộc hay sử thi của thế giới; không biến thành tiên hiệp. Nhất quán tên, chủng tộc, chức danh, ma pháp, kỹ năng và hệ thống sức mạnh. Giữ cách viết/phiên âm tên đã được bộ nhớ xác nhận. Cảnh phép thuật phải rõ người thi triển, mục tiêu, hiệu ứng và giới hạn; không tự thêm luật hay năng lực."
        },
        {
            id: "light-novel",
            name: "Light Novel",
            description: "Light Novel Nhật, học đường, isekai và đời thường",
            rule: "Light Novel Nhật: Giữ nhịp trẻ, nhẹ và tự nhiên; phân biệt giọng hài, nghiêm túc, ngượng ngùng và nội tâm, không lạm dụng tiếng lóng. Giữ đúng họ/tên/biệt danh và thời điểm đổi cách gọi. Chỉ giữ kính ngữ Nhật khi có ý nghĩa quan hệ, tránh dịch lặp. Bảo toàn bối cảnh Nhật, thuật ngữ và sắc thái nguyên tác; không tự thêm romance hay phản ứng cường điệu."
        },
        {
            id: "ngon-tinh-hien-dai",
            name: "Ngôn tình hiện đại",
            description: "Tình cảm hiện đại, học đường, công sở và hào môn",
            rule: "Ngôn tình hiện đại: Văn phong mềm và giàu cảm xúc vừa đủ, không sến hóa. Giữ chính xác mức độ tình cảm và từng giai đoạn quan hệ; không biến thiện cảm thành tình yêu, quan tâm thành chiếm hữu hay xung đột thành ghen tuông nếu văn bản không nói vậy. Chọn xưng hô hiện đại theo khoảng cách và thời điểm. Không tự thêm thân mật, lời tán tỉnh hoặc suy nghĩ."
        },
        {
            id: "ngon-tinh-co-dai",
            name: "Ngôn tình cổ đại",
            description: "Cổ phong, cung đấu, gia đấu và tình cảm cổ đại",
            rule: "Ngôn tình cổ đại: Dùng cổ phong thanh nhã, dễ hiểu, không thành văn ngôn hoặc hoa mỹ quá mức. Xưng hô theo thân phận, phẩm cấp, quan hệ và hoàn cảnh; chỉ dùng trẫm/thần/ai gia... đúng vai. Giữ lễ nghi, chức tước, thân phận và thời điểm đổi cách gọi. Với xuyên không/trọng sinh, tách giọng nội tâm hiện đại khỏi lời nói cổ đại; không tự đẩy nhanh tình cảm."
        },
        {
            id: "lich-su-quan-su",
            name: "Lịch sử - Quân sự",
            description: "Lịch sử, chiến tranh, triều chính và tranh quyền",
            rule: "Lịch sử / quân sự / triều chính: Bảo toàn thiết chế, chức tước, niên hiệu, quân hàm, đơn vị và lễ nghi theo văn bản; không hiện đại hóa khái niệm. Phân biệt chiếu chỉ, tấu trình, mệnh lệnh và hội thoại riêng. Cảnh chiến trận phải giữ đúng phe, quân số, địa hình, đội hình, mệnh lệnh và trình tự; không sửa chiến thuật hay thêm kiến thức lịch sử ngoài đoạn."
        },
        {
            id: "trinh-tham-kinh-di",
            name: "Trinh thám - Kinh dị",
            description: "Phá án, tâm lý, huyền nghi và kinh dị",
            rule: "Trinh thám / huyền nghi / kinh dị: Giữ nguyên manh mối, mốc thời gian, vật chứng, điểm nhìn và điều mỗi nhân vật biết; không giải thích hộ hay hé lộ đáp án. Phân biệt sự kiện, suy luận, giả thuyết, lời nói dối và ảo giác; giữ đúng mức độ chắc chắn. Dùng thuật ngữ chuyên môn nhất quán, giữ hàm ý trong thẩm vấn và không tự thêm yếu tố kinh dị."
        },
        {
            id: "vo-han-luu",
            name: "Vô hạn lưu - Sinh tồn",
            description: "Phó bản, quy tắc, luân hồi và sinh tồn",
            rule: "Vô hạn lưu / sinh tồn: Bảo toàn luật chơi, điều kiện, nhiệm vụ, thời hạn, tài nguyên, điểm số và hình phạt; không tự suy diễn luật ẩn. Phân biệt hiện thực, phó bản, mô phỏng và ảo giác; theo dõi vị trí, thời gian và tài nguyên của nhân vật. Giữ nguyên cấu trúc bảng trạng thái/thông báo, số liệu và ký hiệu; không bỏ manh mối."
        },
        {
            id: "game-he-thong",
            name: "Game - Hệ thống",
            description: "Game online, eSports, hệ thống và số liệu",
            rule: "Game / eSports / hệ thống: Phân biệt lời kể, chat, giao diện, thông báo, nhiệm vụ và bình luận trận đấu. Bảo toàn tên game, nickname, chỉ số, phím tắt, mã vật phẩm và cơ chế. Dùng thuật ngữ game nhất quán, chỉ giữ tiếng Anh khi tự nhiên. Cảnh thi đấu phải rõ thao tác, chiến thuật, thời điểm và kết quả; không rút gọn làm sai logic."
        },
        {
            id: "dien-van-chua-lanh",
            name: "Điền văn - Chữa lành",
            description: "Đời thường, gia đình, ẩm thực và trưởng thành",
            rule: "Điền văn / chữa lành: Giọng ấm, bình dị và tiết chế; giữ ý nghĩa của sinh hoạt thường ngày mà không sến hóa hay biến thành lời giáo huấn. Xưng hô gia đình phải đúng thế hệ và vai vế. Giữ chính xác nguyên liệu, thao tác, số lượng và kết quả trong cảnh nấu ăn/lao động; không tự thêm kiến thức, kịch tính hoặc tình cảm."
        },
        {
            id: "ta-dao",
            name: "Tà thư",
            description: "Kỳ dị, u tối, kinh dị hoặc châm biếm đen",
            rule: "Tà thư / kỳ dị u tối: Giữ sắc thái bất an, phi lý hoặc châm biếm đen đúng mức; không làm nhẹ, tô đẹp hay tự tăng độ ghê rợn. Phân biệt sự kiện, lời nói dối, ký ức và ảo giác. Bảo toàn nghi thức, biểu tượng, điều cấm và manh mối mà không giải nghĩa làm lộ bí mật. Giữ giọng lạnh/gãy khi cần nhưng vẫn rõ nghĩa."
        },
        {
            id: "mat-the",
            name: "Mạt thế - Tận thế",
            description: "Sinh tồn, thảm họa, zombie và tái thiết xã hội",
            rule: "Mạt thế / tận thế: Giữ rõ mốc thời gian, địa điểm, tài nguyên, tình trạng sức khỏe, mức nguy hiểm và năng lực của từng nhân vật. Phân biệt zombie, người nhiễm bệnh, người sống sót và các phe; không tự đặt luật cho thảm họa. Cảnh hành động phải rõ vị trí, lựa chọn và hậu quả. Không biến sinh tồn thành anh hùng ca nếu nguyên tác không có."
        },
        {
            id: "trong-sinh",
            name: "Trọng sinh",
            description: "Sống lại, làm lại cuộc đời và thay đổi số phận",
            rule: "Trọng sinh: Phân biệt chính xác kiếp trước, thời điểm sống lại và hiện tại; giữ đúng điều nhân vật đã biết ở từng mốc. Không để nhân vật phản ứng với thông tin họ chưa thể biết, không tiết lộ sớm bí mật hoặc làm lẫn ký ức với sự kiện hiện tại. Giữ nguyên nhân-quả của các lựa chọn và tốc độ thay đổi quan hệ."
        },
        {
            id: "xuyen-khong",
            name: "Xuyên không",
            description: "Đến thế giới, thời đại hoặc thân phận khác",
            rule: "Xuyên không: Tách bạch thế giới/thời đại cũ và mới, thân phận hiện tại, ký ức và hiểu biết của nhân vật. Giữ đúng giới hạn kiến thức; không biến hiểu biết hiện đại thành năng lực mà nguyên tác chưa thể hiện. Phân biệt lời nghĩ với lời nói theo bối cảnh, giữ nguyên phong tục và quy tắc của thế giới truyện."
        },
        {
            id: "xuyen-sach",
            name: "Xuyên sách",
            description: "Bước vào tiểu thuyết, kịch bản hoặc thế giới có cốt truyện",
            rule: "Xuyên sách: Phân biệt cốt truyện gốc mà nhân vật nhớ với sự kiện đang thực sự diễn ra; không coi dự đoán là sự thật đã xảy ra. Giữ đúng vai nguyên tác, thân phận mới, mục tiêu và mức độ hiểu biết của nhân vật. Không tự làm lệch cốt truyện hoặc biến nhân vật phụ thành nhân vật chính nếu văn bản chưa xác nhận."
        },
        {
            id: "xuyen-nhanh",
            name: "Xuyên nhanh",
            description: "Nhiều thế giới, nhiệm vụ và thân phận luân phiên",
            rule: "Xuyên nhanh: Theo dõi ranh giới từng thế giới/nhiệm vụ, thân phận nhập vai, mục tiêu, thời hạn và dữ liệu hệ thống. Không trộn tên, ký ức, quan hệ hoặc quy tắc giữa các thế giới. Phân biệt tính cách của nhân vật chính với vai diễn hiện tại; giữ nguyên điều kiện hoàn thành và hậu quả của nhiệm vụ."
        },
        {
            id: "dam-my",
            name: "Đam mỹ",
            description: "Tình cảm nam - nam, hiện đại hoặc cổ đại",
            rule: "Đam mỹ: Giữ nguyên giới tính, đại từ, cách gọi tên và sắc thái tình cảm của từng nhân vật; không tự kiểm duyệt, đổi cặp đôi hoặc làm mờ quan hệ đồng giới. Diễn biến tình cảm phải đúng mức độ và bằng chứng trong văn bản, không biến thân thiết thành yêu hoặc ghen tuông nếu chưa có căn cứ. Chọn giọng hiện đại/cổ đại theo bối cảnh, không tự thêm thân mật."
        },
        {
            id: "bach-hop",
            name: "Bách hợp",
            description: "Tình cảm nữ - nữ, hiện đại hoặc cổ đại",
            rule: "Bách hợp: Giữ nguyên giới tính, đại từ, cách gọi và sắc thái tình cảm giữa các nhân vật nữ; không đổi quan hệ thành tình bạn hay nam-nữ. Không suy diễn tình yêu, ghen tuông hoặc thân mật vượt quá văn bản. Giữ đúng tiến triển cảm xúc, bối cảnh và giọng riêng của từng nhân vật."
        },
        {
            id: "dong-nhan",
            name: "Đồng nhân",
            description: "Tác phẩm phái sinh từ thế giới hoặc nhân vật có sẵn",
            rule: "Đồng nhân: Phân biệt chi tiết đã có trong nguyên tác nền với tình tiết riêng của truyện này; chỉ dùng tên, thuật ngữ và quan hệ quen thuộc khi văn bản xác nhận đúng phiên bản. Giữ nguyên cách gọi và đặc điểm nhân vật theo đoạn được cung cấp; không tự bổ sung kiến thức ngoài truyện hoặc sửa khác biệt có chủ ý."
        },
        {
            id: "am-thuc",
            name: "Ẩm thực",
            description: "Nấu ăn, món ăn, nguyên liệu và nghề bếp",
            rule: "Ẩm thực: Dùng tên món và nguyên liệu dễ hiểu, nhất quán; giữ nguyên lượng, đơn vị, thứ tự sơ chế, thao tác, thời gian, nhiệt độ và kết quả. Không thay nguyên liệu bằng món Việt gần giống nếu làm đổi văn hóa hoặc hương vị. Chỉ giữ lời miêu tả hấp dẫn khi nguyên tác có, không tự thêm công thức hay đánh giá."
        },
        {
            id: "nong-thon",
            name: "Nông thôn - Làm ruộng",
            description: "Nông nghiệp, làng quê, chăn nuôi và đời sống thôn dã",
            rule: "Nông thôn / nông nghiệp: Giữ đúng mùa vụ, cây trồng, vật nuôi, công cụ, quy trình, sản lượng, tiền bạc và quan hệ làng xóm theo văn bản. Dùng từ phổ thông, tránh hiện đại hóa tập quán hoặc thay sản vật địa phương bằng thứ khác. Không bỏ các bước lao động, nhưng cũng không thêm kiến thức nông nghiệp ngoài nguồn."
        },
        {
            id: "do-thi-di-nang",
            name: "Đô thị dị năng",
            description: "Đời sống hiện đại, siêu năng lực và tổ chức bí mật",
            rule: "Đô thị dị năng: Giữ tách biệt đời sống hiện đại với năng lực, tổ chức và quy tắc siêu nhiên. Theo dõi chính xác giới hạn, điều kiện kích hoạt, tác dụng và cái giá của năng lực; không nâng cấp hoặc thêm kỹ năng. Dùng giọng hiện đại, giữ đúng bí mật nhân thân và mức độ hiểu biết của từng nhân vật."
        },
        {
            id: "tong-nghe",
            name: "Giới giải trí",
            description: "Showbiz, diễn viên, thần tượng và sản xuất nội dung",
            rule: "Giới giải trí: Phân biệt vai diễn với con người thật, tin đồn với sự thật, hình tượng công chúng với suy nghĩ riêng. Giữ chính xác tên tác phẩm, chức danh đoàn phim, lịch trình, thứ hạng, hợp đồng và quan hệ trong ngành. Hội thoại mạng xã hội, truyền thông và hậu trường cần đúng giọng; không tự tạo scandal, danh tiếng hoặc tình cảm."
        },
        {
            id: "hai-huoc",
            name: "Hài hước",
            description: "Hài tình huống, đối thoại và châm biếm",
            rule: "Hài hước: Giữ đúng đối tượng gây cười, nhịp thiết lập-kết thúc, mỉa mai và phản ứng của nhân vật. Chuyển chơi chữ sang cách diễn đạt Việt tự nhiên khi có thể; nếu không, ưu tiên giữ ý và sắc thái, không giải thích câu đùa. Không thêm tiếng lóng, cường điệu hoặc biến nhân vật thành trò cười ngoài ý tác giả."
        }
    ];
}

function translationDefaultPrompt(style) {
    var selected = translationNormalizeStyle(style);
    var definitions = translationDefaultStyleDefinitions();
    for (var i = 0; i < definitions.length; i++) {
        if (definitions[i].id === selected) return translationBuildPrompt(definitions[i].rule);
    }
    return "";
}

function translationBuildPrompt(styleRule) {
    return "PHONG CÁCH VÀ THỂ LOẠI RIÊNG:\n" +
        styleRule.trim() + "\n\n" +
        "Dùng các quy tắc trên để chọn giọng kể, nhịp câu, từ vựng và mức độ trang trọng; không để phong cách làm thay đổi sự kiện, sắc thái hoặc thông tin của nguyên tác. Chỉ áp dụng quy tắc phù hợp với đoạn truyện, không ép mọi đặc điểm thể loại vào từng câu.";
}
