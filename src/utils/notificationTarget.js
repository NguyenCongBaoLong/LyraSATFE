// Dùng chung cho NotificationBell (dropdown) và trang /notifications
// để mọi chỗ bấm thông báo đều đi tới đúng màn hình nghiệp vụ.

export const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const utcStr = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : `${dateStr}Z`;
    const date = new Date(utcStr);
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 0) return 'vừa xong';
    if (diffSec < 60) return 'vừa xong';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 30) return `${diffDay} ngày trước`;
    return date.toLocaleDateString('vi-VN');
};

export const iconForNotificationType = (type) => {
    switch (type) {
        case 'test_submission': return '📝';
        case 'test_assigned': return '📚';
        case 'comment_reply': return '↩️';
        case 'question_comment': return '💬';
        default: return '🔔';
    }
};

// Ghép URL đích theo vai trò + loại thông báo.
// Trả về chuỗi route (có query param) để trang đích tự mở đúng bài / đúng câu hỏi.
export const buildNotificationTarget = (notif, userRole) => {
    if (!notif) return null;

    if (userRole === 'Teacher') {
        const params = new URLSearchParams();
        if (notif.testId) params.set('testId', notif.testId);
        // Chỉ thông báo nộp bài mới biết chính xác học sinh nào đã nộp.
        if (notif.type === 'test_submission' && notif.actorId) {
            params.set('studentId', notif.actorId);
        }
        if (notif.questionId) params.set('questionId', notif.questionId);
        if (notif.commentId) params.set('commentId', notif.commentId);
        if (notif.type === 'test_assigned' && notif.testId) {
            return `/teacher/overview?${params.toString()}`;
        }
        const qs = params.toString();
        return `/teacher/overview${qs ? `?${qs}` : ''}`;
    }

    // Học sinh (và mặc định cho mọi role khác): đề mới mở thẳng trang làm bài.
    if (notif.type === 'test_assigned' && notif.testId) {
        return `/test/${notif.testId}`;
    }

    const params = new URLSearchParams();
    if (notif.testId) params.set('testId', notif.testId);
    if (notif.questionId) params.set('questionId', notif.questionId);
    if (notif.commentId) params.set('commentId', notif.commentId);
    const qs = params.toString();

    // Admin không có bài nộp của riêng mình -> về bảng điều khiển.
    if (userRole === 'Admin') {
        return '/admin/dashboard';
    }

    return `/score${qs ? `?${qs}` : ''}`;
};
