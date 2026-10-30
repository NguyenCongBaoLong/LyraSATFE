import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, MessageSquare } from 'lucide-react';
import api from '../api';

const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 60) return 'vừa xong';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay} ngày trước`;
};

export default function NotificationBell({ className = '', align = 'right' }) {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user')) || {};
    const userId = user.id;

    // 1. Tải số lượng chưa đọc định kỳ
    const fetchUnreadCount = useCallback(async () => {
        if (!userId) return;
        try {
            const res = await api.get(`/notifications/unread-count?userId=${userId}`);
            setUnreadCount(res.data.unreadCount || 0);
        } catch {
            // Ignore background error
        }
    }, [userId]);

    useEffect(() => {
        let isMounted = true;
        if (!userId) return;

        api.get(`/notifications/unread-count?userId=${userId}`)
            .then(res => {
                if (isMounted) setUnreadCount(res.data.unreadCount || 0);
            })
            .catch(() => {});

        const interval = setInterval(fetchUnreadCount, 25000); // 25s polling
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [userId, fetchUnreadCount]);

    // 2. Tải danh sách thông báo khi click mở chuông
    const fetchNotifications = async () => {
        if (!userId) return;
        setIsLoading(true);
        try {
            const res = await api.get(`/notifications?userId=${userId}&page=1&pageSize=15`);
            setNotifications(res.data.items || []);
        } catch (err) {
            console.error('Lỗi tải thông báo:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleOpen = () => {
        if (!isOpen) {
            fetchNotifications();
        }
        setIsOpen(!isOpen);
    };

    // Đóng dropdown khi click bên ngoài
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 3. Đánh dấu tất cả đã đọc
    const handleMarkAllAsRead = async () => {
        if (!userId) return;
        try {
            await api.put(`/notifications/read-all?userId=${userId}`);
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error('Lỗi đánh dấu đọc:', err);
        }
    };

    // 4. Click vào 1 thông báo
    const handleNotificationClick = async (notif) => {
        try {
            if (!notif.isRead) {
                await api.put(`/notifications/${notif.id}/read`);
                setUnreadCount(prev => Math.max(0, prev - 1));
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
            }
            setIsOpen(false);

            // Điều hướng đến bài test / điểm số
            if (user.role === 'Student') {
                navigate('/score');
            } else if (user.role === 'Teacher') {
                navigate('/teacher/overview');
            }
        } catch (err) {
            console.error('Lỗi khi xử lý thông báo:', err);
        }
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={toggleOpen}
                aria-label="Thông báo"
                className="relative p-2.5 rounded-2xl bg-pink-50 hover:bg-pink-100 text-pink-600 transition cursor-pointer flex items-center justify-center border border-pink-100 shadow-sm"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-5 h-5 flex items-center justify-center shadow-md animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Popover Dropdown */}
            {isOpen && (
                <div className={`absolute ${align === "left" ? "left-0" : "right-0"} mt-3 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-3xl shadow-2xl border border-pink-100 z-50 overflow-hidden animate-fadeIn`}>
                    <div className="p-4 bg-pink-50/70 border-b border-pink-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-pink-900">Thông báo</span>
                            {unreadCount > 0 && (
                                <span className="bg-pink-200 text-pink-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {unreadCount} mới
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-[11px] font-bold text-pink-600 hover:text-pink-800 flex items-center gap-1 cursor-pointer transition"
                            >
                                <Check className="w-3.5 h-3.5" /> Đọc tất cả
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto divide-y divide-pink-50">
                        {isLoading ? (
                            <div className="p-8 text-center text-xs text-slate-400 font-medium">
                                Đang tải thông báo...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-2 text-pink-400">
                                    <Bell className="w-6 h-6 opacity-40" />
                                </div>
                                <p className="text-xs font-bold text-slate-500">Chưa có thông báo nào</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Bạn sẽ nhận thông báo khi có người trả lời câu hỏi</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={`p-3.5 hover:bg-pink-50/60 transition cursor-pointer flex items-start gap-3 ${
                                        !n.isRead ? 'bg-pink-50/30' : ''
                                    }`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 mt-0.5">
                                        <MessageSquare className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1 mb-0.5">
                                            <p className={`text-xs truncate ${!n.isRead ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
                                                {n.title}
                                            </p>
                                            {!n.isRead && (
                                                <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0"></span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                            {n.content}
                                        </p>
                                        <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                                            {formatRelativeTime(n.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
