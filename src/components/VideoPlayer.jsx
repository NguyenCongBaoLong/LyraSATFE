import React, { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { resolveVideoSource } from '../utils/videoSource';

function VideoNotice({ rawUrl, children, openLabel = 'Mở link trong tab mới' }) {
    return (
        <div className="aspect-video w-full rounded-3xl bg-amber-50 border-2 border-amber-200 flex flex-col items-center justify-center text-center px-6 gap-2">
            <p className="text-2xl">🎬</p>
            {children}
            {rawUrl && (
                <a
                    href={rawUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-900 text-white text-[11px] font-black hover:bg-amber-800 transition"
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {openLabel}
                </a>
            )}
        </div>
    );
}

/**
 * Khung phát một video chữa bài.
 * Hỗ trợ YouTube (công khai & không công khai), Google Drive, Vimeo, Loom,
 * file video trên lưu trữ đám mây và các link video hợp lệ khác.
 */
export default function VideoPlayer({ url, title = 'Video chữa bài', className = '', showOpenLink = true }) {
    const [fileErrorKind, setFileErrorKind] = useState(null);
    const [prevUrl, setPrevUrl] = useState(url);
    if (url !== prevUrl) {
        setPrevUrl(url);
        setFileErrorKind(null);
    }

    const source = resolveVideoSource(url);
    const rawUrl = source?.rawUrl || source?.src || (url || '');

    useEffect(() => {
        if (fileErrorKind !== 'checking' || !rawUrl) return undefined;

        const controller = new AbortController();
        let active = true;

        fetch(rawUrl, { method: 'HEAD', signal: controller.signal })
            .then((res) => {
                if (!active) return;
                if (
                    res.status === 404 ||
                    res.status === 410 ||
                    (res.status === 400 && rawUrl.includes('/storage/v1/object/'))
                ) {
                    setFileErrorKind('missing');
                } else if (res.ok) {
                    setFileErrorKind('codec');
                } else {
                    setFileErrorKind(rawUrl.includes('/uploads/') ? 'missing' : 'network');
                }
            })
            .catch((err) => {
                if (!active || err?.name === 'AbortError') return;
                setFileErrorKind(rawUrl.includes('/uploads/') ? 'missing' : 'network');
            });

        return () => {
            active = false;
            controller.abort();
        };
    }, [fileErrorKind, rawUrl]);

    if (!source) {
        return (
            <div className={`aspect-video w-full rounded-3xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center ${className}`}>
                <p className="text-xs font-bold text-slate-400">Bài test này chưa có video chữa bài</p>
            </div>
        );
    }

    const handleFileError = () => {
        setFileErrorKind((prev) => (prev ? prev : 'checking'));
    };

    const showNotice = source.kind === 'external' || Boolean(fileErrorKind);

    return (
        <div className={className}>
            {source.kind === 'external' ? (
                <VideoNotice rawUrl={rawUrl}>
                    <p className="text-xs font-black text-amber-800">Link này cần mở trực tiếp ở tab mới</p>
                    <p className="text-[11px] text-amber-700 leading-relaxed max-w-md">
                        Google Docs/Slides hoặc thư mục Drive không hỗ trợ phát lồng trong khung. Bấm nút bên dưới để mở ngay ở tab mới.
                    </p>
                </VideoNotice>
            ) : source.kind === 'file' ? (
                fileErrorKind === 'checking' ? (
                    <VideoNotice rawUrl={rawUrl} openLabel="Mở video trong tab mới">
                        <p className="text-xs font-black text-amber-800">Đang kiểm tra file video...</p>
                    </VideoNotice>
                ) : fileErrorKind === 'missing' ? (
                    <VideoNotice rawUrl={rawUrl} openLabel="Thử mở trực tiếp">
                        <p className="text-xs font-black text-amber-800">File video cũ này không còn trên server</p>
                        <p className="text-[11px] text-amber-700 leading-relaxed max-w-md">
                            File từng tải lên ổ đĩa tạm của server trước đây đã bị xóa khi cập nhật hệ thống.
                            Nhờ giáo viên tải lại video lên hoặc dán link YouTube / Google Drive (công khai hay không công khai đều được).
                        </p>
                    </VideoNotice>
                ) : fileErrorKind === 'codec' ? (
                    <VideoNotice rawUrl={rawUrl} openLabel="Mở / Tải video trực tiếp">
                        <p className="text-xs font-black text-amber-800">Trình duyệt trên máy này không phát trực tiếp được định dạng video này</p>
                        <p className="text-[11px] text-amber-700 leading-relaxed max-w-md">
                            File vẫn còn trên hệ thống (thường gặp với file .mov quay từ iPhone/iPad khi mở trên Chrome Windows). Bấm nút bên dưới để mở hoặc tải về xem.
                        </p>
                    </VideoNotice>
                ) : fileErrorKind === 'network' ? (
                    <VideoNotice rawUrl={rawUrl} openLabel="Mở video trong tab mới">
                        <p className="text-xs font-black text-amber-800">Không tải được video trực tiếp trên khung này</p>
                        <p className="text-[11px] text-amber-700 leading-relaxed max-w-md">
                            Kết nối tới máy chủ chứa video bị gián đoạn hoặc bị chặn nhúng trực tiếp. Bấm nút bên dưới để mở video ở tab mới.
                        </p>
                    </VideoNotice>
                ) : (
                    <div className="relative aspect-video w-full rounded-3xl overflow-hidden shadow-xl bg-black border-2 border-pink-200">
                        <video
                            key={source.src}
                            src={source.src}
                            controls
                            controlsList="nodownload"
                            playsInline
                            preload="metadata"
                            className="w-full h-full"
                            onError={handleFileError}
                        >
                            <track kind="captions" />
                            Trình duyệt của bạn không phát được video này.
                        </video>
                    </div>
                )
            ) : (
                <div className="relative aspect-video w-full rounded-3xl overflow-hidden shadow-xl bg-black border-2 border-pink-200">
                    <iframe
                        key={source.src}
                        src={source.src}
                        title={title}
                        className="w-full h-full"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                    />
                </div>
            )}

            {showOpenLink && !showNotice && rawUrl && (
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
