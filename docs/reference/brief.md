# Source brief: Fullstack Developer take-home test

> Original requirement text from the recruiter (Vietnamese), received 2026-10-29. Kept verbatim as
> the source for `_bmad-output/specs/spec-office-template-library/`. Greeting and candidate details
> removed.

I. GIỚI THIỆU BÀI TOÁN

Bài kiểm tra tập trung vào việc xây dựng thư viện mẫu tài liệu tích hợp trong ứng dụng văn phòng. Người dùng có thể tìm kiếm, xem trước, lựa chọn mẫu và tạo tài liệu mới để chỉnh sửa.

Ứng viên sẽ thực hiện hai sản phẩm thử nghiệm sau:

II. SẢN PHẨM 1: THƯ VIỆN MẪU VĂN BẢN

1. Mục tiêu

Xây dựng chức năng thư viện mẫu văn bản có thể chạy thử thực tế, cho phép người dùng tìm kiếm, xem trước và sử dụng mẫu để tạo tài liệu mới.

2. Yêu cầu chức năng

A. Giao diện thư viện

- Hiển thị danh sách mẫu dưới dạng lưới hoặc danh sách có hình xem trước.
- Mỗi mẫu có tên, ảnh thumbnail, mô tả ngắn và danh mục.
- Có chức năng tìm kiếm và lọc theo danh mục.
- Có trang hoặc cửa sổ xem trước mẫu.
- Có nút sử dụng mẫu để tạo tài liệu mới.

B. Luồng sử dụng mẫu

- Người dùng chọn một template.
- Hệ thống tạo tài liệu mới dựa trên mẫu đó.
- Người dùng có thể thay đổi nội dung trong phạm vi trình soạn thảo được tích hợp.
- Có thể lưu hoặc tải xuống tài liệu kết quả theo định dạng được hỗ trợ.
- Việc tạo tài liệu mới không được làm thay đổi file template gốc.

C. Dữ liệu và quản lý mẫu

- Thiết kế cấu trúc dữ liệu cho template, bao gồm ID, tên, danh mục, mô tả, đường dẫn file và ảnh xem trước.
- Có ít nhất 5 mẫu dữ liệu thử nghiệm.
- Có thể bổ sung mẫu mới mà không cần viết lại giao diện thư viện.

D. Xử lý kỹ thuật

- Có xử lý trạng thái tải dữ liệu, lỗi và trường hợp không tìm thấy mẫu.
- Giao diện dễ sử dụng, có khả năng mở rộng.
- Nếu hỗ trợ DOCX, cần kiểm tra việc giữ nguyên định dạng cơ bản của tài liệu.

III. SẢN PHẨM 2: THƯ VIỆN MẪU TRÌNH CHIẾU

1. Mục tiêu

Phát triển thư viện mẫu trình chiếu, cho phép người dùng lựa chọn một bộ template PowerPoint và tạo bản trình chiếu mới.

2. Yêu cầu chức năng

A. Giao diện

- Hiển thị các template PowerPoint với thumbnail.
- Có chức năng tìm kiếm và phân loại mẫu.
- Xem trước bộ slide của từng template.
- Có chức năng chọn mẫu để tạo bản trình chiếu mới.

B. Luồng sử dụng

- Người dùng chọn một template.
- Hệ thống tạo bản trình chiếu mới từ template đó.
- Bản trình chiếu mới phải độc lập với template gốc.
- Người dùng có thể mở và chỉnh sửa bản trình chiếu bằng trình soạn thảo được tích hợp hoặc bằng ứng dụng tương thích.
- Có thể tải xuống PPTX nếu giải pháp lựa chọn hỗ trợ.

C. Quản lý dữ liệu

- Có tối thiểu 3 bộ template thử nghiệm.
- Mỗi bộ có tên, mô tả, thumbnail và danh sách slide xem trước.
- Có thể thêm hoặc cập nhật template mà không phải xây dựng lại toàn bộ tính năng.

D. Tính tương thích

Nếu giải pháp chưa có trình chỉnh sửa slide tích hợp, bạn có thể xây dựng luồng chọn mẫu, tạo bản sao và tải xuống PPTX. Hãy nêu rõ giới hạn của giải pháp và hướng mở rộng để tích hợp trình soạn thảo sau này.

IV. YÊU CẦU KỸ THUẬT

Ứng viên được quyền lựa chọn công nghệ phù hợp, nhưng cần trình bày rõ:

- Frontend, backend và cơ sở dữ liệu sử dụng.
- Cấu trúc API và mô hình dữ liệu.
- Cách lưu trữ, quản lý và phân phối template.
- Cách tạo bản sao tài liệu mà không sửa file gốc.
- Cách xử lý lỗi và kiểm thử các luồng quan trọng.
- Các thư viện bên thứ ba sử dụng và giấy phép liên quan.

Ưu tiên giải pháp có kiến trúc rõ ràng, dễ bảo trì và có khả năng mở rộng cho các loại tài liệu văn phòng khác trong tương lai.

Nếu sử dụng thư viện mã nguồn mở hoặc AI hỗ trợ lập trình, vui lòng nêu rõ trong tài liệu bàn giao.

V. SẢN PHẨM BÀN GIAO

- Source code của hai sản phẩm.
- Hướng dẫn cài đặt và chạy thử.
- File README mô tả kiến trúc và công nghệ.
- Tài liệu API hoặc mô tả cấu trúc dữ liệu.
- Bộ dữ liệu và template mẫu để kiểm thử.
- Video quay màn hình ngắn thể hiện các chức năng chính.
- Danh sách những phần đã hoàn thành, chưa hoàn thành và các giới hạn kỹ thuật.

Yêu cầu quan trọng: Sản phẩm cần có khả năng chạy thử thực tế, không chỉ là giao diện tĩnh hoặc bản thiết kế trên Figma.

VI. THỜI GIAN THỰC HIỆN

- Thời gian dự kiến: 6–8 giờ làm việc thực tế.
- Thời hạn nộp bài: trước 15:00 ngày 01/11/2026.
- Nếu không thể hoàn thành toàn bộ yêu cầu, có thể nộp phiên bản MVP chạy được cùng phần mô tả những chức năng chưa hoàn thành.
- Ưu tiên chất lượng triển khai, khả năng chạy thử và tính rõ ràng của giải pháp thay vì cố gắng xây dựng quá nhiều chức năng.

VII. TIÊU CHÍ ĐÁNH GIÁ

- Chức năng thực tế và mức độ hoàn thành: 25%.
- Kiến trúc, chất lượng code và khả năng bảo trì: 20%.
- Xử lý template và dữ liệu: 20%.
- Giao diện và trải nghiệm người dùng: 15%.
- Kiểm thử, xử lý lỗi và bảo mật: 10%.
- Tài liệu bàn giao và khả năng giải thích giải pháp: 10%.

VIII. CÁCH THỨC NỘP BÀI

Phản hồi email kèm đường dẫn GitHub hoặc kho mã nguồn riêng đã cấp quyền truy cập cho người đánh giá, kèm các tài liệu và video theo yêu cầu.

- Phạm vi bài test giới hạn ở hai sản phẩm nêu trên.
- Không đưa mã nguồn, dữ liệu hoặc thông tin bảo mật của công ty hiện tại hay khách hàng khác vào bài làm.
