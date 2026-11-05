import { API_ORIGIN } from '../api';

/**
 * Nhận diện nguồn video chữa bài và trả về cách phát phù hợp.
 *
 * - Video giáo viên tải thẳng lên server: file mp4/webm/mov -> dùng thẻ <video>.
 * - Link Google Drive -> dùng iframe /preview.
 * - Link YouTube -> iframe embed như cũ.
 * - Link khác -> iframe.
 *
 * Trả về { kind: 'youtube' | 'drive' | 'file' | 'iframe', src } hoặc null nếu rỗng.
 */
export function resolveVideoSource(rawUrl) {
    if (!rawUrl) return null;
    const url = String(rawUrl).trim();
    if (!url) return null;

    // Đường dẫn nội bộ do backend trả về (/uploads/...) phải trỏ sang API server,
    // không phải domain của frontend.
    const absolute = url.startsWith('/') ? `${API_ORIGIN}${url}` : url;

    // File video tải trực tiếp lên server
    if (/\.(mp4|m4v|webm|mov|ogv)(\?.*)?$/i.test(absolute) || absolute.includes('/uploads/tests/')) {
        return { kind: 'file', src: absolute };
    }

    // Google Drive: /file/d/<id>/view -> /file/d/<id>/preview
    const driveMatch = absolute.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([\w-]{10,})/i);
    if (driveMatch && driveMatch[1]) {
        return { kind: 'drive', src: `https://drive.google.com/file/d/${driveMatch[1]}/preview` };
    }

    // Link tài liệu Google (Docs/Slides/Sheets) hoặc thư mục Drive: Google chặn iframe,
    // nhúng vào sẽ ra khung đen. Báo rõ cho người xem thay vì hiện khung hỏng.
    if (/docs\.google\.com|slides\.google\.com|sheets\.google\.com|drive\.google\.com\/drive\//i.test(absolute)) {
        return { kind: 'blocked', src: absolute };
    }

    if (/youtu\.?be/i.test(absolute)) {
        const idMatch = absolute.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i);
        return { kind: 'youtube', src: idMatch ? `https://www.youtube.com/embed/${idMatch[1]}` : absolute };
    }

    return { kind: 'iframe', src: absolute };
}
