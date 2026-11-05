import React from 'react';
import { ExternalLink } from 'lucide-react';
import { resolveVideoSource } from '../utils/videoSource';

/**
 * Khung phát một video chữa bài.
 * Nhận link YouTube, link Google Drive (file) và file video tải lên server.
 * Luôn kèm nút mở tab mới để nếu khung nhúng bị chặn (Drive/Trình duyệt chặn iframe)
 * người dùng vẫn xem được video.
 */
export default function VideoPlayer({ url, title = 'Video chữa bài', className = '', showOpenLink = true }) {
    const source = resolveVideoSource(url);
    const rawUrl = source?.kind === 'file' ? source.src : (url || '');

    if (!source) {
        return (
            <div className={`aspect-video w-full rounded-3xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center ${className}`}>
                <p className="text-xs font-bold text-slate-400">Bài test này chưa có video chữa bài</p>
            </div>
        );
    }

    return (
        <div className={className}>
            {source.kind === 'file' ? (
                <div className="relative aspect-video w-full rounded-3xl overflow-hidden shadow-xl bg-black border-2 border-pink-200">
                    <video
                        src={source.src}
                        controls
                        controlsList="nodownload"
                        playsInline
                        preload="metadata"
                        className="w-full h-full"
                    >
                        Trình duyệt của bạn không phát được video này.
                    </video>
                </div>
            ) : (
                <div className="relative aspect-video w-full rounded-3xl overflow-hidden shadow-xl bg-black border-2 border-pink-200">
                    <iframe
                        src={source.src}
                        title={title}
                        className="w-full h-full"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            )}

            {showOpenLink && rawUrl && (
                <a
                    href={rawUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-pink-600 hover:text-pink-800"
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Không phát được? Mở video trong tab mới
                </a>
            )}
        </div>
    );
}
