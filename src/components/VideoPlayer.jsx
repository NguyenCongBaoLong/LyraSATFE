import React from 'react';
import { resolveVideoSource } from '../utils/videoSource';

/**
 * Khung phát video chữa bài dùng chung cho mọi màn hình xem lại.
 * Nhận cả link YouTube, link Google Drive và file video giáo viên tải lên server.
 */
export default function VideoPlayer({ url, title = 'Video chữa bài', className = '' }) {
    const source = resolveVideoSource(url);

    if (!source) {
        return (
            <div className={`aspect-video w-full rounded-3xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center ${className}`}>
                <p className="text-xs font-bold text-slate-400">Bài test này chưa có video chữa bài</p>
            </div>
        );
    }

    if (source.kind === 'file') {
        return (
            <div className={`relative aspect-video w-full rounded-3xl overflow-hidden shadow-xl bg-black border-2 border-pink-200 ${className}`}>
                <video
                    src={source.src}
                    controls
                    controlsList="nodownload"
                    playsInline
                    preload="metadata"
                    className="w-full h-full"
                >
                    Trình duyệt của bạn không phát được video này. Mở trực tiếp tại đây:{' '}
                    <a href={source.src} target="_blank" rel="noreferrer">{source.src}</a>
                </video>
            </div>
        );
    }

    return (
        <div className={`relative aspect-video w-full rounded-3xl overflow-hidden shadow-xl bg-black border-2 border-pink-200 ${className}`}>
            <iframe
                src={source.src}
                title={title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
        </div>
    );
}
