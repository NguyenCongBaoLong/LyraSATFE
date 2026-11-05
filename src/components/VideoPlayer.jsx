import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { resolveVideoSource } from '../utils/videoSource';

/**
 * Khung phát một video chữa bài.
 * Nhận link YouTube, link Google Drive (file) và file video tải lên server.
 *
 * Hai trường hợp hỏng thường gặp được xử lý để người xem không thấy "khung đen":
 * - Link Google Docs/Slides/Drive folder: Google chặn nhúng -> báo rõ + nút mở tab mới.
 * - File tải lên server bị xóa (ổ đĩa Render tạm thời) -> trình duyệt báo lỗi tải video -> báo rõ.
 */
export default function VideoPlayer({ url, title = 'Video chữa bài', className = '', showOpenLink = true }) {
    const [fileFailed, setFileFailed] = useState(false);
    const source = resolveVideoSource(url);
    const rawUrl = source?.kind === 'file' ? source.src : (url || '');

    if (!source) {
        return (
            <div className={`aspect-video w-full rounded-3xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center ${className}`}>
                <p className="text-xs font-bold text-slate-400">Bài test này chưa có video chữa bài</p>
            </div>
        );
    }

    const Notice = ({ children, openLabel = 'Mở link trong tab mới' }) => (
        <div className="aspect-video w-full rounded-3xl bg-amber-50 border-2 border-amber-200 flex flex-col items-center justify-center text-center px-6 gap-2">
            <p className="text-2xl">🎬</p>
            {children}
            {rawUrl && (
                <a
                    href={rawUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-black text-amber-900 underline"
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {openLabel}
                </a>
            )}
        </div>
    );

    return (
        <div className={className}>
            {source.kind === 'blocked' ? (
                <Notice>
                    <p className="text-xs font-black text-amber-800">Video này đang dùng link không phát được trong khung</p>
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                        Link Google Docs/Slides/Drive folder bị Google chặn nhúng. Giáo viên cần thay bằng
                        link YouTube (chế độ Không công khai) hoặc link file video trên Drive.
                    </p>
                </Notice>
            ) : source.kind === 'file' ? (
                fileFailed ? (
                    <Notice openLabel="Thử mở trực tiếp">
                        <p className="text-xs font-black text-amber-800">File video này không còn trên server</p>
                        <p className="text-[11px] text-amber-700 leading-relaxed">
                            File tải trực tiếp lên server chỉ tồn tại tạm thời. Nhờ giáo viên gắn lại video
                            bằng link YouTube (Không công khai) hoặc file trên Google Drive để xem được lâu dài.
                        </p>
                    </Notice>
                ) : (
                    <div className="relative aspect-video w-full rounded-3xl overflow-hidden shadow-xl bg-black border-2 border-pink-200">
                        <video
                            src={source.src}
                            controls
                            controlsList="nodownload"
                            playsInline
                            preload="metadata"
                            className="w-full h-full"
                            onError={() => setFileFailed(true)}
                        >
                            Trình duyệt của bạn không phát được video này.
                        </video>
                    </div>
                )
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

            {showOpenLink && source.kind !== 'blocked' && !fileFailed && rawUrl && (
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
