import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, ArrowLeft } from 'lucide-react';
import api from '../api';
import {
    formatRelativeTime,
    iconForNotificationType,
    buildNotificationTarget
} from '../utils/notificationTarget';

const PAGE_SIZE = 20;

export default function Notifications() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [loadError, setLoadError] = useState('');
    const requestIdRef = useRef(0);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id;

    const fetchUnreadCount = useCallback(async () => {
        if (!userId) return;
        try {
            const res = await api.get(`/notifications/unread-count?userId=${userId}`);
            setUnreadCount(res.data?.unreadCount || 0);
        } catch (err) {
            console.error('Lỗi tải số thông báo chưa đọc:', err);
        }
    }, [userId]);

    const fetchPage = useCallback(async (targetPage, { append } = { append: false }) => {
        if (!userId) return;
        const requestId = ++requestIdRef.current;
        if (append) setIsLoadingMore(true);
        else setIsLoading(true);
        setLoadError('');

        try {
            const res = await api.get('/notifications', {
                params: {
                    userId,
                    page: targetPage,
                    pageSize: PAGE_SIZE
                }
            });
            // Bỏ kết quả cũ nếu lượt tải mới đã bắt đầu trong lúc chờ.
            if (requestId !== requestIdRef.current) return;

            const nextItems = res.data?.items || [];
            setItems(prev => (append ? [...prev, ...nextItems] : nextItems));
            setTotalCount(res.data?.totalCount || 0);
            setPage(res.data?.page || targetPage);
        } catch (err) {
            if (requestId !== requestIdRef.current) return;
            console.error('Lỗi tải thông báo:', err);
            if (!append) setItems([]);
            setLoadError('Không tải được thông báo. Kiểm tra kết nối rồi thử lại.');
        } finally {
            if (requestId === requestIdRef.current) {
                setIsLoading(false);
                setIsLoadingMore(false);
            }
        }
    }, [userId]);

    useEffect(() => {
        setPage(1);
        fetchPage(1, { append: false });
    }, [fetchPage]);

    useEffect(() => {
        fetchUnreadCount();
    }, [fetchUnreadCount]);

    const handleLoadMore = () => {
        if (isLoadingMore) return;
        fetchPage(page + 1, { append: true });
    };

    const handleMarkAllAsRead = async () => {
        if (!userId) return;
        try {
            await api.put(`/notifications/read-all?userId=${userId}`);
            setUnreadCount(0);
            setItems(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error('Lỗi đánh dấu đọc tất cả:', err);
        }
    };

    const handleClickNotification = async (notif) => {
        if (!notif.isRead) {
            try {
                await api.put(`/notifications/${notif.id}/read`);
                setUnreadCount(prev => Math.max(0, prev - 1));
                setItems(prev => prev.map(n => (n.id === notif.id ? { ...n, isRead: true } : n)));
            } catch (err) {
                console.error('Lỗi khi đánh dấu đã đọc:', err);
            }
        }
        const target = buildNotificationTarget(notif, user.role);
        if (target) navigate(target);
    };

    const hasMore = items.length < totalCount;

    return (
        <div className="min-h-screen bg-[#FFF5F7] text-slate-800 font-sans">
            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="flex items-center gap-3 mb-6">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        aria-label="Quay lại"
                        className="p-2.5 rounded-2xl bg-white border border-pink-100 text-pink-600 hover:bg-pink-50 transition cursor-pointer shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-black text-pink-700">Thông báo</h1>
                        <p className="text-xs text-slate-400 font-medium">
                            {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Bạn đã xem hết thông báo'}
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={handleMarkAllAsRead}
                            className="text-xs font-bold text-pink-600 hover:text-pink-800 flex items-center gap-1 bg-white border border-pink-100 px-3 py-2 rounded-2xl transition cursor-pointer"
                        >
                            <Check className="w-4 h-4" /> Đọc tất cả
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-3xl border border-pink-100 shadow-sm overflow-hidden divide-y divide-pink-50">
                    {isLoading ? (
                        <div className="p-12 text-center text-xs text-slate-400 font-medium">Đang tải thông báo...</div>
                    ) : loadError ? (
                        <div className="p-12 text-center">
                            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-2 text-amber-500">⚠️</div>
                            <p className="text-xs font-bold text-slate-600">{loadError}</p>
                            <button
                                type="button"
                                onClick={() => fetchPage(1, { append: false })}
                                className="mt-3 text-[11px] font-bold text-pink-600 hover:text-pink-800 underline cursor-pointer"
                            >
                                Thử lại
                            </button>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-2 text-pink-400">
                                <Bell className="w-6 h-6 opacity-40" />
                            </div>
                            <p className="text-xs font-bold text-slate-500">Chưa có thông báo nào</p>
                        </div>
                    ) : (
                        items.map((n) => (
                            <div
                                key={n.id}
                                onClick={() => handleClickNotification(n)}
                                className={`p-4 hover:bg-pink-50/60 transition cursor-pointer flex items-start gap-3 ${
                                    !n.isRead ? 'bg-pink-50/30' : ''
                                }`}
                            >
                                <div className="w-9 h-9 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center shrink-0 mt-0.5 text-sm">
                                    {iconForNotificationType(n.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className={`text-sm ${!n.isRead ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
                                            {n.title}
                                        </p>
                                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0 mt-1.5" />}
                                    </div>
                                    <p className={`text-xs mt-1 leading-relaxed break-words ${!n.isRead ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                                        {n.content}
                                    </p>
                                    <span className="text-[10px] text-slate-400 font-medium mt-1.5 block">
                                        {formatRelativeTime(n.createdAt)}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {hasMore && !isLoading && !loadError && (
                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            onClick={handleLoadMore}
                            disabled={isLoadingMore}
                            className="px-5 py-2.5 bg-white border border-pink-100 text-xs font-bold text-pink-600 rounded-2xl hover:bg-pink-50 transition cursor-pointer disabled:opacity-60"
                        >
                            {isLoadingMore ? 'Đang tải...' : 'Tải thêm'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
