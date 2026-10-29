import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Check, RefreshCw } from 'lucide-react';
import api from '../api';

export default function AudioVoiceRecorder({ onRecordingComplete, onCancel }) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [micError, setMicError] = useState('');

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const streamRef = useRef(null);

    const stopMicStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    useEffect(() => {
        return () => {
            stopMicStream();
            if (timerRef.current) clearInterval(timerRef.current);
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
    }, [audioUrl]);

    const startRecording = async () => {
        setMicError('');
        audioChunksRef.current = [];
        setAudioBlob(null);
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
            setAudioUrl('');
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find(
                t => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)
            ) || '';

            // Tối ưu nén âm thanh: 24kbps mono voice (1 phút chỉ chiếm ~180KB)
            const options = {
                audioBitsPerSecond: 24000
            };
            if (mimeType) options.mimeType = mimeType;

            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const mime = mediaRecorder.mimeType || 'audio/webm';
                const blob = new Blob(audioChunksRef.current, { type: mime });
                setAudioBlob(blob);
                const localUrl = URL.createObjectURL(blob);
                setAudioUrl(localUrl);
                stopMicStream();
            };

            mediaRecorder.start(250);
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error('Không thể truy cập Microphone:', err);
            setMicError('Không thể mở micro. Vui lòng cấp quyền truy cập mic trên trình duyệt!');
            stopMicStream();
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const handleConfirmUpload = async () => {
        if (!audioBlob) return;
        setIsUploading(true);

        try {
            const formData = new FormData();
            const extension = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
            formData.append('file', audioBlob, `voice_note_${Date.now()}.${extension}`);
            formData.append('type', 'audio');

            const res = await api.post('/upload/attachment', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.url) {
                onRecordingComplete({
                    url: res.data.url,
                    duration: recordingTime || 1
                });
            }
        } catch (err) {
            console.error('Lỗi tải file ghi âm lên server:', err);
            alert('Không thể lưu đoạn ghi âm. Vui lòng thử lại!');
        } finally {
            setIsUploading(false);
        }
    };

    const handleCancel = () => {
        stopRecording();
        stopMicStream();
        if (timerRef.current) clearInterval(timerRef.current);
        if (onCancel) onCancel();
    };

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="bg-pink-50 border border-pink-200 rounded-2xl p-4 flex flex-col gap-3 animate-fadeIn">
            {micError ? (
                <div className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100 flex items-center justify-between">
                    <span>{micError}</span>
                    <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600 font-bold ml-2">Đóng</button>
                </div>
            ) : isRecording ? (
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping"></span>
                        <span className="text-xs font-bold text-slate-700">Đang thu âm voice (đã bật nén tiết kiệm dung lượng)...</span>
                        <span className="text-sm font-mono font-black text-pink-700 bg-pink-100/80 px-2 py-0.5 rounded-lg">
                            {formatTime(recordingTime)}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={stopRecording}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                            <Square className="w-3.5 h-3.5 fill-white" /> Dừng
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ) : audioUrl ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <audio src={audioUrl} controls className="h-9 max-w-[220px]" />
                        <span className="text-xs font-mono font-bold text-pink-700">
                            {formatTime(recordingTime)}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                            type="button"
                            onClick={startRecording}
                            title="Ghi âm lại"
                            className="p-2 bg-white border border-pink-200 text-slate-600 hover:bg-pink-100 rounded-xl transition cursor-pointer"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            title="Hủy"
                            className="p-2 bg-white border border-pink-200 text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            disabled={isUploading}
                            onClick={handleConfirmUpload}
                            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl shadow-md shadow-pink-600/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                            <Check className="w-4 h-4" />
                            <span>{isUploading ? 'Đang lưu...' : 'Sử dụng đoạn ghi âm'}</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-600 font-medium">
                        Nhấn nút để bắt đầu thu âm câu hỏi hoặc lời giải thích...
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={startRecording}
                            className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs rounded-xl shadow-md shadow-pink-500/20 transition flex items-center gap-2 cursor-pointer"
                        >
                            <Mic className="w-4 h-4" /> Bắt đầu nói
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
                        >
                            Hủy
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
