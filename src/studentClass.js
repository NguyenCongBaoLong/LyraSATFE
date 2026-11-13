const STORAGE_KEY = 'student_selected_class';
const EVENT_NAME = 'student-class-changed';

/** Danh sách mã lớp học sinh thực sự thuộc về (bảng StudentClasses từ API đăng nhập). */
export function getStudentClassCodes(user) {
    const fromClasses = Array.isArray(user?.classes)
        ? user.classes
            .map((item) => item?.classCode || item?.ClassCode)
            .filter(Boolean)
        : [];

    if (fromClasses.length > 0) {
        return [...new Set(fromClasses)];
    }

    // Hồ sơ cũ chưa có danh sách lớp thì dùng lớp chính.
    return user?.classCode ? [user.classCode] : [];
}

function sameCode(a, b) {
    return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

/**
 * Lớp đang chọn của học sinh. Ưu tiên lớp đã chọn lần trước, nếu không còn hợp lệ
 * thì lấy lớp chính trên hồ sơ, cuối cùng là lớp đầu tiên.
 */
export function getSelectedStudentClass(user) {
    const classes = getStudentClassCodes(user);
    if (classes.length === 0) return '';

    const saved = localStorage.getItem(STORAGE_KEY);
    const savedMatch = saved ? classes.find((code) => sameCode(code, saved)) : null;
    if (savedMatch) return savedMatch;

    const primaryMatch = user?.classCode
        ? classes.find((code) => sameCode(code, user.classCode))
        : null;
    const chosen = primaryMatch || classes[0];

    localStorage.setItem(STORAGE_KEY, chosen);
    return chosen;
}

/** Đổi lớp đang học; các trang đang mở sẽ tự tải lại dữ liệu của lớp mới. */
export function setSelectedStudentClass(classCode) {
    if (!classCode) return;
    localStorage.setItem(STORAGE_KEY, classCode);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: classCode }));
}

export function clearSelectedStudentClass() {
    localStorage.removeItem(STORAGE_KEY);
}

/** Đăng ký nghe sự kiện đổi lớp. Trả về hàm huỷ đăng ký. */
export function onStudentClassChange(handler) {
    const listener = (event) => handler(event.detail);
    window.addEventListener(EVENT_NAME, listener);
    return () => window.removeEventListener(EVENT_NAME, listener);
}
