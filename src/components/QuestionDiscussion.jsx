import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    MessageSquare, 
    Send, 
    Heart, 
    Reply, 
    Pin, 
    Pencil, 
    Trash2, 
    ShieldAlert, 
    GraduationCap, 
    User, 
    CornerDownRight, 
    Loader2, 
    Check, 
    AlertCircle
} from 'lucide-react';
import api from '../api';

// Format relative time in Vietnamese
const formatRelativeTime = (dateInput) => {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return 'Vừa xong';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} phút trước`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} giờ trước`;
    if (diffSeconds < 86400 * 7) return `${Math.floor(diffSeconds / 86400)} ngày trước`;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
};

// Seed comments to display gracefully if backend endpoint is not yet connected
const getMockComments = (qId) => [
    {
        id: `mock-${qId}-1`,
        questionId: qId,
        userId: 2,
        authorName: 'Cô Thu Hà (Lyra SAT)',
        authorRole: 'Teacher',
        content: 'Với câu hỏi này, các em cần chú ý sự đối lập giữa hai mệnh đề nối bởi liên từ "However". Từ khóa cần điền phải mang nghĩa tương phản với thái độ ban đầu.',
        createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
        isPinned: true,
        isDeleted: false,
        likesCount: 8,
        isLiked: false,
        replies: [
            {
                id: `mock-${qId}-2`,
                questionId: qId,
                userId: 10,
                authorName: 'Minh Hoàng',
                authorRole: 'Student',
                content: 'Em cảm ơn cô ạ! Lúc đầu em phân vân giữa đáp án A và C nhưng đọc phân tích của cô em đã hiểu rõ hơn rồi.',
                createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
                isPinned: false,
                isDeleted: false,
                likesCount: 2,
                isLiked: false,
                parentId: `mock-${qId}-1`,
                replies: []
            }
        ]
    }
];

export default function QuestionDiscussion({
    questionId,
    questionIndex,
    testTitle,
    currentUser: propUser,
    className = ''
}) {
    // Current user resolution
    const currentUser = useMemo(() => {
        if (propUser) return propUser;
        try {
            const saved = localStorage.getItem('user');
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error('Error reading user from localStorage:', e);
        }
        return {
            id: 1,
            fullName: 'Học viên',
            role: 'Student'
        };
    }, [propUser]);

    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Root composer state
    const [newCommentText, setNewCommentText] = useState('');

    // Reply composer state: active comment ID being replied to
    const [replyingToId, setReplyingToId] = useState(null);
    const [replyText, setReplyText] = useState('');

    // Edit state: comment ID being edited
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');

    // Delete confirmation modal state
    const [confirmDeleteModal, setConfirmDeleteModal] = useState({
        isOpen: false,
        commentId: null,
        isReply: false,
        parentCommentId: null
    });

    // Check teacher or admin permissions
    const isTeacherOrAdmin = currentUser?.role === 'Teacher' || currentUser?.role === 'Admin';

    // Critical permission rule: Admin and Teacher can delete ANY comment or reply.
    // Author can delete their own comment.
    // Show "Xóa" (Delete) if: user.id === comment.userId || user.role === 'Teacher' || user.role === 'Admin'
    const canDeleteComment = useCallback((comment) => {
        if (!currentUser) return false;
        const authorId = comment.userId ?? comment.authorId;
        const myId = currentUser.id ?? currentUser.userId;
        return (
            (authorId && String(authorId) === String(myId)) ||
            currentUser.role === 'Teacher' ||
            currentUser.role === 'Admin'
        );
    }, [currentUser]);

    // Check edit permission: only author can edit their own active comment
    const canEditComment = useCallback((comment) => {
        if (!currentUser || comment.isDeleted) return false;
        const authorId = comment.userId ?? comment.authorId;
        const myId = currentUser.id ?? currentUser.userId;
        return Boolean(authorId && String(authorId) === String(myId));
    }, [currentUser]);

    // Track previous questionId for seamless state reset
    const [prevQuestionId, setPrevQuestionId] = useState(questionId);
    if (questionId !== prevQuestionId) {
        setPrevQuestionId(questionId);
        setLoading(true);
        setReplyingToId(null);
        setReplyText('');
        setEditingId(null);
        setEditText('');
        setNewCommentText('');
        setErrorMsg('');
    }

    // Load comments for active question
    useEffect(() => {
        let isCurrent = true;
        if (!questionId) {
            return;
        }

        api.get(`/questions/${questionId}/comments`)
            .then(res => {
                if (!isCurrent) return;
                const data = Array.isArray(res.data) ? res.data : (res.data?.comments || []);
                setComments(data);
                setLoading(false);
            })
            .catch(() => {
                if (!isCurrent) return;
                setComments(getMockComments(questionId));
                setLoading(false);
            });

        return () => {
            isCurrent = false;
        };
    }, [questionId]);

    // Submit new root comment
    const handleAddComment = async (e) => {
        e.preventDefault();
        const content = newCommentText.trim();
        if (!content || submitting) return;

        setSubmitting(true);
        const tempId = `temp-${Date.now()}`;
        const newCommentObj = {
            id: tempId,
            questionId,
            userId: currentUser?.id || 1,
            authorName: currentUser?.fullName || currentUser?.name || 'Học viên',
            authorRole: currentUser?.role || 'Student',
            content,
            createdAt: new Date().toISOString(),
            isPinned: false,
            isDeleted: false,
            likesCount: 0,
            isLiked: false,
            replies: []
        };

        // Optimistic UI update
        setComments(prev => [newCommentObj, ...prev]);
        setNewCommentText('');

        try {
            const res = await api.post(`/questions/${questionId}/comments`, {
                content,
                userId: currentUser?.id
            });
            const savedComment = res.data?.comment || res.data;
            if (savedComment && savedComment.id) {
                setComments(prev => prev.map(c => c.id === tempId ? { ...newCommentObj, ...savedComment } : c));
            }
        } catch (err) {
            console.warn('API post comment failed, kept optimistic entry:', err);
        } finally {
            setSubmitting(false);
        }
    };

    // Submit reply to a root comment
    const handleAddReply = async (parentCommentId) => {
        const content = replyText.trim();
        if (!content || submitting) return;

        setSubmitting(true);
        const tempReplyId = `temp-reply-${Date.now()}`;
        const newReplyObj = {
            id: tempReplyId,
            questionId,
            parentId: parentCommentId,
            userId: currentUser?.id || 1,
            authorName: currentUser?.fullName || currentUser?.name || 'Học viên',
            authorRole: currentUser?.role || 'Student',
            content,
            createdAt: new Date().toISOString(),
            isPinned: false,
            isDeleted: false,
            likesCount: 0,
            isLiked: false,
            replies: []
        };

        // Optimistic UI update
        setComments(prev => prev.map(c => {
            if (c.id === parentCommentId) {
                return {
                    ...c,
                    replies: [...(c.replies || []), newReplyObj]
                };
            }
            return c;
        }));

        setReplyText('');
        setReplyingToId(null);

        try {
            const res = await api.post(`/questions/${questionId}/comments`, {
                content,
                parentId: parentCommentId,
                userId: currentUser?.id
            });
            const savedReply = res.data?.comment || res.data;
            if (savedReply && savedReply.id) {
                setComments(prev => prev.map(c => {
                    if (c.id === parentCommentId) {
                        return {
                            ...c,
                            replies: (c.replies || []).map(r => r.id === tempReplyId ? { ...newReplyObj, ...savedReply } : r)
                        };
                    }
                    return c;
                }));
            }
        } catch (err) {
            console.warn('API post reply failed, kept optimistic entry:', err);
        } finally {
            setSubmitting(false);
        }
    };

    // Toggle Pin state (Teacher & Admin only)
    const handleTogglePin = async (commentId) => {
        if (!isTeacherOrAdmin) return;

        let targetComment = null;
        setComments(prev => prev.map(c => {
            if (c.id === commentId) {
                targetComment = { ...c, isPinned: !c.isPinned };
                return targetComment;
            }
            return c;
        }));

        try {
            await api.post(`/comments/${commentId}/pin`, {
                isPinned: targetComment?.isPinned
            });
        } catch (err) {
            console.warn('API pin toggle failed:', err);
        }
    };

    // Toggle Like reaction with optimistic UI
    const handleToggleLike = async (commentId, isReply = false, parentId = null) => {
        setComments(prev => {
            return prev.map(c => {
                if (!isReply && c.id === commentId) {
                    const nextLiked = !c.isLiked;
                    return {
                        ...c,
                        isLiked: nextLiked,
                        likesCount: nextLiked ? (c.likesCount || 0) + 1 : Math.max(0, (c.likesCount || 1) - 1)
                    };
                }
                if (isReply && c.id === parentId) {
                    return {
                        ...c,
                        replies: (c.replies || []).map(r => {
                            if (r.id === commentId) {
                                const nextLiked = !r.isLiked;
                                return {
                                    ...r,
                                    isLiked: nextLiked,
                                    likesCount: nextLiked ? (r.likesCount || 0) + 1 : Math.max(0, (r.likesCount || 1) - 1)
                                };
                            }
                            return r;
                        })
                    };
                }
                return c;
            });
        });

        try {
            await api.post(`/comments/${commentId}/like`);
        } catch (err) {
            console.warn('API like toggle failed:', err);
        }
    };

    // Save edited comment text
    const handleSaveEdit = async (commentId, isReply = false, parentId = null) => {
        const trimmed = editText.trim();
        if (!trimmed) return;

        setComments(prev => {
            return prev.map(c => {
                if (!isReply && c.id === commentId) {
                    return { ...c, content: trimmed, isEdited: true };
                }
                if (isReply && c.id === parentId) {
                    return {
                        ...c,
                        replies: (c.replies || []).map(r => r.id === commentId ? { ...r, content: trimmed, isEdited: true } : r)
                    };
                }
                return c;
            });
        });

        setEditingId(null);
        setEditText('');

        try {
            await api.put(`/comments/${commentId}`, { content: trimmed });
        } catch (err) {
            console.warn('API edit comment failed:', err);
        }
    };

    // Trigger delete dialog
    const confirmDelete = (commentId, isReply = false, parentCommentId = null) => {
        setConfirmDeleteModal({
            isOpen: true,
            commentId,
            isReply,
            parentCommentId
        });
    };

    // Execute Delete with soft delete rule
    const handleExecuteDelete = async () => {
        const { commentId, isReply, parentCommentId } = confirmDeleteModal;
        if (!commentId) return;

        setConfirmDeleteModal({ isOpen: false, commentId: null, isReply: false, parentCommentId: null });

        setComments(prev => {
            if (!isReply) {
                return prev.flatMap(c => {
                    if (c.id === commentId) {
                        // Soft delete if replies exist: preserve reply tree!
                        if (c.replies && c.replies.length > 0) {
                            return [{
                                ...c,
                                isDeleted: true,
                                content: 'Bình luận này đã bị xóa'
                            }];
                        }
                        // Hard delete from UI if no replies exist
                        return [];
                    }
                    return [c];
                });
            } else {
                return prev.map(c => {
                    if (c.id === parentCommentId) {
                        return {
                            ...c,
                            replies: (c.replies || []).filter(r => r.id !== commentId)
                        };
                    }
                    return c;
                });
            }
        });

        try {
            await api.delete(`/comments/${commentId}`);
        } catch (err) {
            console.warn('API delete comment failed:', err);
        }
    };

    // Render Role Badge
    const renderRoleBadge = (role) => {
        if (role === 'Admin') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                    <ShieldAlert className="w-2.5 h-2.5 text-purple-600" />
                    Quản trị viên
                </span>
            );
        }
        if (role === 'Teacher') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                    <GraduationCap className="w-2.5 h-2.5 text-rose-600" />
                    Giáo viên
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                <User className="w-2.5 h-2.5 text-slate-400" />
                Học viên
            </span>
        );
    };

    // Sorted root comments: Pinned comments first, then descending time
    const sortedComments = useMemo(() => {
        return [...comments].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    }, [comments]);

    return (
        <div className={`bg-white rounded-3xl border border-pink-100 shadow-sm p-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-pink-100/70">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-600 shadow-sm">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-slate-800">
                            Thảo luận {questionIndex !== undefined ? `Câu ${questionIndex}` : (testTitle ? `• ${testTitle}` : '')}
                        </h3>
                        <p className="text-xs text-slate-400">
                            Chia sẻ cách giải hoặc đặt câu hỏi để thầy cô và bạn bè hỗ trợ
                        </p>
                    </div>
                </div>

                <div className="text-xs font-bold text-pink-700 bg-pink-50 px-3 py-1.5 rounded-full border border-pink-200">
                    {comments.length} bình luận
                </div>
            </div>

            {/* Root Comment Composer (Pure text) */}
            <form onSubmit={handleAddComment} className="mb-6">
                <div className="bg-[#FFF5F7] rounded-2xl p-3 border border-pink-200/80 focus-within:border-pink-400 focus-within:ring-2 focus-within:ring-pink-200 transition-all">
                    <textarea
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder={`Viết câu hỏi hoặc chia sẻ giải thích của bạn về câu hỏi này...`}
                        rows={3}
                        className="w-full bg-transparent resize-none text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
                    />

                    <div className="flex items-center justify-between pt-2 border-t border-pink-200/60 mt-1">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="font-medium text-slate-500">
                                {currentUser?.fullName || 'Bạn'}
                            </span>
                            {renderRoleBadge(currentUser?.role)}
                        </div>

                        <button
                            type="submit"
                            disabled={!newCommentText.trim() || submitting}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer ${
                                newCommentText.trim() && !submitting
                                    ? 'bg-pink-600 text-white hover:bg-pink-700 hover:shadow-md'
                                    : 'bg-pink-200 text-pink-400 cursor-not-allowed'
                            }`}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Đang gửi...
                                </>
                            ) : (
                                <>
                                    <Send className="w-3.5 h-3.5" />
                                    Gửi bình luận
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>

            {/* Error Message if any */}
            {errorMsg && (
                <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* Comment List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
                    <span className="text-xs font-medium">Đang tải thảo luận...</span>
                </div>
            ) : sortedComments.length === 0 ? (
                <div className="text-center py-10 px-4 rounded-2xl bg-pink-50/50 border border-dashed border-pink-200">
                    <div className="w-12 h-12 rounded-full bg-white text-pink-400 flex items-center justify-center mx-auto mb-2 shadow-sm border border-pink-100">
                        <MessageSquare className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-700 mb-1">Chưa có bình luận nào</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Hãy là người đầu tiên đặt câu hỏi hoặc chia sẻ góc nhìn giải thích cho câu hỏi này!
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {sortedComments.map(comment => (
                        <div
                            key={comment.id}
                            className={`rounded-2xl border transition-all p-4 ${
                                comment.isPinned
                                    ? 'bg-pink-50/40 border-pink-300 ring-1 ring-pink-300/60 shadow-sm'
                                    : 'bg-white border-slate-100 hover:border-pink-100 shadow-xs'
                            }`}
                        >
                            {/* Pinned Header Badge */}
                            {comment.isPinned && (
                                <div className="flex items-center gap-1.5 text-xs font-bold text-pink-700 bg-pink-100/70 border border-pink-200 px-3 py-1 rounded-full mb-3 w-fit">
                                    <Pin className="w-3.5 h-3.5 fill-pink-600 text-pink-600" />
                                    <span>Đã ghim bởi Giáo viên / Ban quản trị</span>
                                </div>
                            )}

                            {/* Comment Item Header */}
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                    {/* Avatar circle */}
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-400 to-rose-300 text-white font-black text-xs flex items-center justify-center shadow-xs">
                                        {(comment.authorName || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-bold text-slate-800">
                                                {comment.authorName || 'Người dùng'}
                                            </span>
                                            {renderRoleBadge(comment.authorRole)}
                                        </div>
                                        <span className="text-[11px] text-slate-400">
                                            {formatRelativeTime(comment.createdAt)}
                                            {comment.isEdited && <span className="ml-1 text-[10px] italic text-slate-400">(đã chỉnh sửa)</span>}
                                        </span>
                                    </div>
                                </div>

                                {/* Header Actions (Pin toggle for Teacher/Admin) */}
                                {isTeacherOrAdmin && !comment.isDeleted && (
                                    <button
                                        type="button"
                                        onClick={() => handleTogglePin(comment.id)}
                                        title={comment.isPinned ? "Bỏ ghim bình luận" : "Ghim bình luận này lên đầu"}
                                        className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                                            comment.isPinned
                                                ? 'bg-pink-100 text-pink-700 hover:bg-pink-200'
                                                : 'text-slate-400 hover:text-pink-600 hover:bg-pink-50'
                                        }`}
                                    >
                                        <Pin className={`w-3.5 h-3.5 ${comment.isPinned ? 'fill-pink-600 text-pink-600' : ''}`} />
                                        <span className="text-[10px] hidden sm:inline">{comment.isPinned ? 'Bỏ ghim' : 'Ghim'}</span>
                                    </button>
                                )}
                            </div>

                            {/* Comment Body / Edit View */}
                            <div className="mt-2.5 text-sm">
                                {editingId === comment.id ? (
                                    <div className="space-y-2 mt-1">
                                        <textarea
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            rows={3}
                                            className="w-full p-2.5 rounded-xl border border-pink-300 bg-pink-50/30 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none"
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingId(null);
                                                    setEditText('');
                                                }}
                                                className="px-3 py-1 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 transition"
                                            >
                                                Hủy
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleSaveEdit(comment.id, false)}
                                                className="px-3 py-1 rounded-lg text-xs font-bold bg-pink-600 text-white hover:bg-pink-700 transition flex items-center gap-1 shadow-xs"
                                            >
                                                <Check className="w-3 h-3" />
                                                Lưu
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className={`whitespace-pre-wrap leading-relaxed ${
                                        comment.isDeleted
                                            ? 'text-slate-400 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs'
                                            : 'text-slate-700'
                                    }`}>
                                        {comment.content}
                                    </p>
                                )}
                            </div>

                            {/* Comment Actions (Like, Reply, Edit, Delete) */}
                            {!comment.isDeleted && editingId !== comment.id && (
                                <div className="flex items-center gap-3 mt-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
                                    {/* Like Reaction */}
                                    <button
                                        type="button"
                                        onClick={() => handleToggleLike(comment.id, false)}
                                        className={`flex items-center gap-1.5 transition cursor-pointer font-medium ${
                                            comment.isLiked ? 'text-rose-600 font-bold' : 'hover:text-rose-500 text-slate-400'
                                        }`}
                                    >
                                        <Heart className={`w-3.5 h-3.5 ${comment.isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                                        <span>{comment.likesCount || 0}</span>
                                    </button>

                                    {/* Reply Button */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setReplyingToId(replyingToId === comment.id ? null : comment.id);
                                            setReplyText('');
                                        }}
                                        className="flex items-center gap-1 hover:text-pink-600 transition cursor-pointer font-medium text-slate-400"
                                    >
                                        <Reply className="w-3.5 h-3.5" />
                                        <span>Trả lời</span>
                                    </button>

                                    {/* Edit Button (Author only) */}
                                    {canEditComment(comment) && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingId(comment.id);
                                                setEditText(comment.content);
                                            }}
                                            className="flex items-center gap-1 hover:text-slate-700 transition cursor-pointer text-slate-400"
                                        >
                                            <Pencil className="w-3 h-3" />
                                            <span>Sửa</span>
                                        </button>
                                    )}

                                    {/* Delete Button (Author OR Teacher OR Admin) */}
                                    {canDeleteComment(comment) && (
                                        <button
                                            type="button"
                                            onClick={() => confirmDelete(comment.id, false)}
                                            className="flex items-center gap-1 hover:text-red-600 transition cursor-pointer text-slate-400 ml-auto"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            <span>Xóa</span>
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Inline Reply Composer */}
                            {replyingToId === comment.id && (
                                <div className="mt-3.5 pt-3 border-t border-pink-100 flex gap-2">
                                    <CornerDownRight className="w-4 h-4 text-pink-400 flex-shrink-0 mt-2" />
                                    <div className="flex-1 bg-[#FFF5F7] rounded-xl p-2.5 border border-pink-200">
                                        <textarea
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder={`Trả lời @${comment.authorName}...`}
                                            rows={2}
                                            autoFocus
                                            className="w-full bg-transparent resize-none text-xs text-slate-700 placeholder-slate-400 focus:outline-none"
                                        />
                                        <div className="flex justify-end gap-2 pt-1 border-t border-pink-200/50 mt-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setReplyingToId(null);
                                                    setReplyText('');
                                                }}
                                                className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:bg-white transition"
                                            >
                                                Hủy
                                            </button>
                                            <button
                                                type="button"
                                                disabled={!replyText.trim() || submitting}
                                                onClick={() => handleAddReply(comment.id)}
                                                className="px-3 py-1 rounded-lg text-xs font-bold bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-50 transition flex items-center gap-1 shadow-xs cursor-pointer"
                                            >
                                                <Send className="w-3 h-3" />
                                                Gửi
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 2nd Level Replies Tree */}
                            {comment.replies && comment.replies.length > 0 && (
                                <div className="mt-3.5 space-y-2.5 pl-4 sm:pl-7 border-l-2 border-pink-100 ml-2 sm:ml-4">
                                    {comment.replies.map(reply => (
                                        <div
                                            key={reply.id}
                                            className="bg-slate-50/70 rounded-xl p-3 border border-slate-100/90 text-xs"
                                        >
                                            {/* Reply Header */}
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                                                        {(reply.authorName || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="font-bold text-slate-800">
                                                            {reply.authorName || 'Người dùng'}
                                                        </span>
                                                        {renderRoleBadge(reply.authorRole)}
                                                        <span className="text-[10px] text-slate-400">
                                                            • {formatRelativeTime(reply.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Reply Content / Edit View */}
                                            <div className="mt-1.5 text-slate-700">
                                                {editingId === reply.id ? (
                                                    <div className="space-y-1.5 mt-1">
                                                        <textarea
                                                            value={editText}
                                                            onChange={(e) => setEditText(e.target.value)}
                                                            rows={2}
                                                            className="w-full p-2 rounded-lg border border-pink-300 bg-white text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-pink-200 resize-none"
                                                        />
                                                        <div className="flex justify-end gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setEditingId(null);
                                                                    setEditText('');
                                                                }}
                                                                className="px-2 py-0.5 rounded text-[11px] font-medium text-slate-500 hover:bg-slate-200 transition"
                                                            >
                                                                Hủy
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSaveEdit(reply.id, true, comment.id)}
                                                                className="px-2 py-0.5 rounded text-[11px] font-bold bg-pink-600 text-white hover:bg-pink-700 transition"
                                                            >
                                                                Lưu
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="whitespace-pre-wrap leading-relaxed">
                                                        {reply.content}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Reply Actions (Like, Edit, Delete) */}
                                            {editingId !== reply.id && (
                                                <div className="flex items-center gap-3 mt-2 pt-1 border-t border-slate-200/50 text-[11px] text-slate-400">
                                                    {/* Like */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleLike(reply.id, true, comment.id)}
                                                        className={`flex items-center gap-1 transition cursor-pointer ${
                                                            reply.isLiked ? 'text-rose-600 font-bold' : 'hover:text-rose-500 text-slate-400'
                                                        }`}
                                                    >
                                                        <Heart className={`w-3 h-3 ${reply.isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                                                        <span>{reply.likesCount || 0}</span>
                                                    </button>

                                                    {/* Edit (Author only) */}
                                                    {canEditComment(reply) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingId(reply.id);
                                                                setEditText(reply.content);
                                                            }}
                                                            className="flex items-center gap-0.5 hover:text-slate-700 transition cursor-pointer"
                                                        >
                                                            <Pencil className="w-2.5 h-2.5" />
                                                            <span>Sửa</span>
                                                        </button>
                                                    )}

                                                    {/* Delete (Author OR Teacher OR Admin) */}
                                                    {canDeleteComment(reply) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => confirmDelete(reply.id, true, comment.id)}
                                                            className="flex items-center gap-0.5 hover:text-red-600 transition cursor-pointer ml-auto"
                                                        >
                                                            <Trash2 className="w-2.5 h-2.5" />
                                                            <span>Xóa</span>
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {confirmDeleteModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-pink-100 animate-in zoom-in-95 duration-150">
                        <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-3 border border-red-100">
                            <Trash2 className="w-5 h-5" />
                        </div>
                        <h4 className="text-base font-bold text-slate-800 mb-1">
                            Xác nhận xóa bình luận?
                        </h4>
                        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                            {confirmDeleteModal.isReply
                                ? 'Phản hồi này sẽ bị xóa hoàn toàn khỏi cuộc trò chuyện.'
                                : 'Nếu bình luận đã có phản hồi bên dưới, nội dung sẽ được ẩn đi nhưng mạch thảo luận vẫn được giữ nguyên.'}
                        </p>

                        <div className="flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setConfirmDeleteModal({ isOpen: false, commentId: null, isReply: false, parentCommentId: null })}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={handleExecuteDelete}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-600 text-white transition shadow-sm cursor-pointer"
                            >
                                Xóa vĩnh viễn
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
