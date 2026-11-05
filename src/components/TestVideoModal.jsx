import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link2, Upload, Trash2, X, Loader2 } from 'lucide-react';
import api from '../api';

const MAX_VIDEO_MB = 150;

/**
 * Quản lý NHIỀU video chữa bài cho một đề đã giao.
 * Giáo viên có thể thêm video bất cứ lúc nào sau khi up đề:
 * dán link YouTube/Google Drive, hoặc tải file video lên.
 */
export default function TestVideoModal({ test, isOpen, onClose, onSaved }) {
    const [videos, setVideos] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState('link');
    const [link, setLink] = useState('');
    const [title, setTitle] = useState('');
    const [file, setFile] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState('');
    const [progressLabel, setProgressLabel] = useState('');
    const fileInputRef = useRef(null);

    const testId = test?.id;

    const loadVideos = useCallback(async () => {
        if (!testId) return;
        setIsLoading(true);
        setError('');
        try {
            const res = await api.get(`/testvideos/test/${testId}`);
            setVideos(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Lỗi tải danh sách video:', err);
            setError('Không tải được danh sách video. Kiểm tra kết nối rồi thử lại.');
        } finally {
            setIsLoading(false);
        }
    }, [testId]);

    useEffect(() => {
        if (!isOpen) return;
        setMode('link');
        setLink('');
        setTitle('');
        setFile(null);
        setError('');
        setProgressLabel('');
        setVideos([]);
        loadVideos();
    }, [isOpen, testId, loadVideos]);

    if (!isOpen || !test) return null;

    const pickFile = (f) => {
        if (!f) return;
        if (f.size > MAX_VIDEO_MB * 1024 * 1024) {
            setError(`File vượt quá ${MAX_VIDEO_MB}MB. Hãy nén video hoặc dùng cách dán link YouTube.`);
            setFile(null);
            return;
        }
        setError('');
        setFile(f);
    };

    const addVideo = async () => {
        setError('');
        setIsSaving(true);
        try {
            let created = null;
            if (mode === 'link') {
                const url = link.trim();
                if (!url) {
                    setError('Hãy dán link video (YouTube hoặc Google Drive).');
                    setIsSaving(false);
                    return;
                }
                const res = await api.post(`/testvideos/test/${test.id}`, { url, title: title.trim() || null });
                created = res.data?.video;
            } else {
                if (!file) {
                    setError('Hãy chọn file video trước khi tải lên.');
                    setIsSaving(false);
                    return;
                }
                const formData = new FormData();
                formData.append('file', file);
                if (title.trim()) formData.append('title', title.trim());
                setProgressLabel('Đang tải video lên, đừng đóng cửa sổ này...');
                const res = await api.post(`/testvideos/test/${test.id}/file`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    timeout: 10 * 60 * 1000
                });
                created = res.data?.video;
            }

            if (created) {
                const next = [...videos, created];
                setVideos(next);
                onSaved?.(next);
            }
            setLink('');
            setTitle('');
            setFile(null);
        } catch (err) {
            console.error('Lỗi thêm video chữa bài:', err);
            setError(err.response?.data?.message || 'Không thêm được video. Kiểm tra kết nối rồi thử lại.');
        } finally {
            setIsSaving(false);
            setProgressLabel('');
        }
    };

    const removeVideo = async (video) => {
        if (!window.confirm(`Gỡ "${video.title || 'video này'}" khỏi đề?`)) return;
        setBusyId(video.id);
        setError('');
        try {
            await api.delete(`/testvideos/${video.id}`);
            const next = videos.filter(v => v.id !== video.id);
            setVideos(next);
            onSaved?.(next);
        } catch (err) {
            console.error('Lỗi gỡ video:', err);
            setError(err.response?.data?.message || 'Không gỡ được video. Thử lại sau.');
        } finally {
            setBusyId(null);
        }
    };

    const hasAnyVideo = videos.length > 0 || Boolean(test.videoExplanationUrl);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4">
            <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-pink-100 max-h-[92vh] overflow-y-auto">
                <div className="flex items-start justify-between gap-3 p-5 border-b border-pink-100">
                    <div>
                        <h3 className="text-sm font-black text-pink-900">🎬 Video chữa bài</h3>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                            {test.title}
                        </p>
                        <p className="text-[10px] font-bold text-pink-600 mt-1">
                            {isLoading ? 'Đang tải...' : `Đã gắn ${videos.length} video`}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Đóng"
                        className="p-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-600 transition cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Danh sách video đã gắn */}
                <div className="px-5 pt-4">
                    {isLoading ? (
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 py-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Đang tải danh sách video...
                        </div>
                    ) : videos.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic py-1">
                            {hasAnyVideo ? 'Video cũ đang dùng link đơn, hãy thêm video mới bên dưới.' : 'Đề này chưa có video nào.'}
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {videos.map((video, index) => (
                                <div
                                    key={video.id}
                                    className="flex items-center justify-between gap-2 rounded-2xl bg-pink-50/50 border border-pink-100 px-3 py-2"
                                >
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-bold text-slate-700 truncate">
                                            {index + 1}. {video.title || 'Video chữa bài'}
                                        </p>
                                        <p className="text-[10px] text-slate-400 truncate">{video.url}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeVideo(video)}
                                        disabled={busyId === video.id}
                                        className="p-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-50"
                                        title="Gỡ video này"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => { setMode('link'); setError(''); }}
                            className={`py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${mode === 'link' ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20' : 'bg-white border border-pink-100 text-slate-600 hover:bg-pink-50'}`}
                        >
                            <Link2 className="w-4 h-4" /> Dán link
                        </button>
                        <button
                            type="button"
                            onClick={() => { setMode('upload'); setError(''); }}
                            className={`py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${mode === 'upload' ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20' : 'bg-white border border-pink-100 text-slate-600 hover:bg-pink-50'}`}
                        >
                            <Upload className="w-4 h-4" /> Tải file lên
                        </button>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                            Tên video (không bắt buộc)
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ví dụ: Chữa câu 1-5, Chữa phần Reading..."
                            className="w-full px-4 py-2.5 bg-pink-50/50 rounded-2xl border border-pink-100 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                    </div>

                    {mode === 'link' ? (
                        <div>
                            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                                Link YouTube hoặc Google Drive (file video)
                            </label>
                            <input
                                type="url"
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="w-full px-4 py-3 bg-pink-50/50 rounded-2xl border border-pink-100 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
                            />
                            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                                Cách bền nhất: đăng video lên YouTube ở chế độ <strong>Không công khai</strong> rồi dán link.
                                Không dùng link Google Docs/Slides/Drive folder — những loại đó không phát được.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                                File video (mp4, webm, mov — tối đa {MAX_VIDEO_MB}MB)
                            </label>
                            <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setIsDragging(false);
                                    pickFile(e.dataTransfer.files?.[0]);
                                }}
                                onClick={() => fileInputRef.current?.click()}
                                className={`rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition ${isDragging ? 'border-pink-400 bg-pink-50' : 'border-pink-200 bg-pink-50/40 hover:bg-pink-50'}`}
                            >
                                <Upload className="w-6 h-6 mx-auto text-pink-500 mb-2" />
                                <p className="text-xs font-bold text-slate-700">
                                    {file ? file.name : 'Bấm để chọn video, hoặc kéo thả vào đây'}
                                </p>
                                {file && (
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        {(file.size / (1024 * 1024)).toFixed(1)} MB
                                    </p>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.webm,.mov,.m4v"
                                className="hidden"
                                onChange={(e) => pickFile(e.target.files?.[0])}
                            />
                            <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-2 leading-relaxed">
                                Lưu ý: file tải trực tiếp nằm trên ổ đĩa server và sẽ mất khi server khởi động lại.
                                Muốn giữ lâu, hãy dùng link YouTube/Drive.
                            </p>
                        </div>
                    )}

                    {error && (
                        <p className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                            {error}
                        </p>
                    )}
                    {progressLabel && (
                        <p className="text-[11px] font-bold text-pink-600">{progressLabel}</p>
                    )}
                </div>

                <div className="p-5 pt-0 flex gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 rounded-2xl bg-white border border-pink-100 text-xs font-bold text-slate-600 hover:bg-pink-50 transition cursor-pointer"
                    >
                        Xong
                    </button>
                    <button
                        type="button"
                        onClick={addVideo}
                        disabled={isSaving}
                        className="flex-[2] py-3 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-black shadow-md shadow-pink-600/20 transition cursor-pointer disabled:opacity-60"
                    >
                        {isSaving ? 'Đang lưu...' : 'Thêm video này'}
                    </button>
                </div>
            </div>
        </div>
    );
}
