import React, { useEffect, useRef, useState } from 'react';
import { Link2, Upload, Trash2, X } from 'lucide-react';
import api from '../api';

const MAX_VIDEO_MB = 150;

/**
 * Gắn / đổi / gỡ video chữa bài cho một đề ĐÃ giao.
 * Hai cách: dán link (YouTube/Drive) hoặc tải file video trực tiếp lên server.
 */
export default function TestVideoModal({ test, isOpen, onClose, onSaved }) {
    const [mode, setMode] = useState('link');
    const [link, setLink] = useState('');
    const [file, setFile] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState('');
    const [progressLabel, setProgressLabel] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        setMode('link');
        setLink(test?.videoExplanationUrl && !String(test.videoExplanationUrl).startsWith('/uploads/') ? test.videoExplanationUrl : '');
        setFile(null);
        setError('');
        setProgressLabel('');
        setIsSaving(false);
    }, [isOpen, test]);

    if (!isOpen || !test) return null;

    const hasVideo = Boolean(test.videoExplanationUrl);

    const pickFile = (f) => {
        if (!f) return;
        if (f.size > MAX_VIDEO_MB * 1024 * 1024) {
            setError(`File vượt quá ${MAX_VIDEO_MB}MB. Hãy nén video hoặc dùng cách dán link.`);
            setFile(null);
            return;
        }
        setError('');
        setFile(f);
    };

    const save = async () => {
        setError('');
        setIsSaving(true);
        try {
            if (mode === 'link') {
                const url = link.trim();
                if (!url) {
                    setError('Hãy dán link video (YouTube hoặc Google Drive).');
                    setIsSaving(false);
                    return;
                }
                const res = await api.put(`/tests/${test.id}/video`, { videoExplanationUrl: url });
                onSaved?.(res.data?.videoExplanationUrl ?? url);
            } else {
                if (!file) {
                    setError('Hãy chọn file video trước khi tải lên.');
                    setIsSaving(false);
                    return;
                }
                const formData = new FormData();
                formData.append('file', file);
                setProgressLabel('Đang tải video lên, đừng đóng cửa sổ này...');
                const res = await api.post(`/tests/${test.id}/video-file`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    timeout: 10 * 60 * 1000
                });
                onSaved?.(res.data?.videoExplanationUrl ?? '');
            }
            onClose?.();
        } catch (err) {
            console.error('Lỗi lưu video chữa bài:', err);
            const serverMessage = err.response?.data?.message;
            setError(serverMessage || 'Không lưu được video. Kiểm tra kết nối rồi thử lại.');
        } finally {
            setIsSaving(false);
            setProgressLabel('');
        }
    };

    const removeVideo = async () => {
        if (!window.confirm('Gỡ video chữa bài khỏi đề này?')) return;
        setIsSaving(true);
        setError('');
        try {
            await api.put(`/tests/${test.id}/video`, { videoExplanationUrl: '' });
            onSaved?.('');
            onClose?.();
        } catch (err) {
            console.error('Lỗi gỡ video:', err);
            setError(err.response?.data?.message || 'Không gỡ được video. Thử lại sau.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4">
            <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-pink-100 max-h-[92vh] overflow-y-auto">
                <div className="flex items-start justify-between gap-3 p-5 border-b border-pink-100">
                    <div>
                        <h3 className="text-sm font-black text-pink-900">🎬 Video chữa bài</h3>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                            {test.title}
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

                    {mode === 'link' ? (
                        <div>
                            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                                Link YouTube hoặc Google Drive
                            </label>
                            <input
                                type="url"
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="w-full px-4 py-3 bg-pink-50/50 rounded-2xl border border-pink-100 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
                            />
                            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                                Cách bền nhất: đăng video lên YouTube ở chế độ <strong>Không công khai</strong> rồi dán link vào đây.
                                File nằm trên YouTube nên không bao giờ mất.
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

                    {hasVideo && (
                        <div className="flex items-center justify-between gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 px-3 py-2">
                            <p className="text-[11px] font-bold text-emerald-700">
                                Đề này đã có video chữa bài
                            </p>
                            <button
                                type="button"
                                onClick={removeVideo}
                                disabled={isSaving}
                                className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Gỡ
                            </button>
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
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={save}
                        disabled={isSaving}
                        className="flex-[2] py-3 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-black shadow-md shadow-pink-600/20 transition cursor-pointer disabled:opacity-60"
                    >
                        {isSaving ? 'Đang lưu...' : 'Lưu video chữa bài'}
                    </button>
                </div>
            </div>
        </div>
    );
}
