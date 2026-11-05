import React from 'react';
import VideoPlayer from './VideoPlayer';

/**
 * Danh sách video chữa bài của một đề.
 * Một đề có thể có nhiều video (tổng kết, từng phần, từng câu...).
 *
 * - videos: mảng [{ id, title, url }] từ API
 * - legacyUrl: cột cũ Test.VideoExplanationUrl, chỉ dùng khi chưa có bảng videos
 */
export default function VideoGallery({
    videos = [],
    legacyUrl = '',
    title = 'Video chữa bài',
    emptyText = 'Bài test này chưa có video chữa bài',
    className = ''
}) {
    const list = (videos || []).filter(v => v && v.url);
    const fallback = !list.length && legacyUrl ? [{ id: 'legacy', title, url: legacyUrl }] : [];

    if (!list.length && !fallback.length) {
        return (
            <div className={`aspect-video w-full rounded-3xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center ${className}`}>
                <p className="text-xs font-bold text-slate-400">{emptyText}</p>
            </div>
        );
    }

    const items = list.length ? list : fallback;

    return (
        <div className={`space-y-5 ${className}`}>
            {items.map((video, index) => (
                <div key={video.id ?? index}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-xs font-black text-pink-900">
                            🎬 {video.title || `${title} ${items.length > 1 ? index + 1 : ''}`.trim()}
                        </p>
                        {items.length > 1 && (
                            <span className="text-[10px] font-bold text-slate-400">
                                {index + 1}/{items.length}
                            </span>
                        )}
                    </div>
                    <VideoPlayer url={video.url} title={video.title || title} />
                </div>
            ))}
        </div>
    );
}
