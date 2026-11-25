import { API_ORIGIN } from '../api';

const UNSAFE_SCHEME_RE = /^(?:javascript|data|vbscript|file):/i;
const DIRECT_VIDEO_EXT_RE = /\.(mp4|m4v|webm|mov|ogv)$/i;

function parseStartSeconds(urlObj) {
    const raw = urlObj.searchParams.get('t') || urlObj.searchParams.get('start') || '';
    if (!raw) return 0;
    if (/^\d+$/.test(raw)) return Number.parseInt(raw, 10);

    const match = raw.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/i);
    if (!match || (!match[1] && !match[2] && !match[3])) return 0;
    return (Number.parseInt(match[1] || '0', 10) * 3600) +
        (Number.parseInt(match[2] || '0', 10) * 60) +
        Number.parseInt(match[3] || '0', 10);
}

function normalizeUrl(rawUrl) {
    if (!rawUrl) return '';
    const trimmed = String(rawUrl).trim();
    if (!trimmed) return '';
    if (UNSAFE_SCHEME_RE.test(trimmed)) return '';
    if (trimmed.startsWith('/')) return `${API_ORIGIN}${trimmed}`;
    if (!trimmed.includes('://') && trimmed.includes('.') && !/\s/.test(trimmed)) {
        return `https://${trimmed}`;
    }
    return trimmed;
}

/**
 * Nhận diện nguồn video chữa bài và trả về cách phát phù hợp.
 *
 * - File video trực tiếp (.mp4/.mov/.webm hoặc lưu trên server/Supabase): thẻ <video>.
 * - Google Drive file (/file/d/..., /file/u/0/d/..., open?id=..., uc?id=...): iframe /preview.
 * - Google Docs/Slides/Sheets/Drive folder: link mở tab mới (Google chặn nhúng iframe).
 * - YouTube (watch, youtu.be, shorts, live, embed, youtube-nocookie, công khai & không công khai): iframe embed.
 * - Vimeo (kể cả link không công khai có hash) & Loom: iframe embed.
 * - Link https hợp lệ khác: iframe + nút mở tab mới.
 *
 * Trả về { kind: 'youtube' | 'drive' | 'vimeo' | 'loom' | 'file' | 'external' | 'iframe', src, rawUrl, ext? } hoặc null.
 */
export function resolveVideoSource(rawUrl) {
    const absolute = normalizeUrl(rawUrl);
    if (!absolute) return null;

    let parsedUrl = null;
    try {
        parsedUrl = new URL(absolute);
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            return null;
        }
    } catch {
        return null;
    }

    const pathname = parsedUrl.pathname || '';
    const extMatch = pathname.match(DIRECT_VIDEO_EXT_RE);

    // 1. File video trực tiếp (Supabase Storage media-assets, /uploads/tests/ hoặc đuôi video chuẩn)
    if (
        extMatch ||
        pathname.includes('/uploads/tests/') ||
        /\/storage\/v1\/object\/public\/media-assets\/(?:tests|questions)\//i.test(pathname)
    ) {
        return {
            kind: 'file',
            src: absolute,
            rawUrl: absolute,
            ext: extMatch ? extMatch[1].toLowerCase() : ''
        };
    }

    const host = parsedUrl.hostname.toLowerCase();

    // 2. Google Docs/Slides/Sheets hoặc thư mục Drive: Google chặn nhúng iframe -> hiện thẻ mở tab mới.
    if (
        host === 'docs.google.com' ||
        host === 'slides.google.com' ||
        host === 'sheets.google.com' ||
        (host === 'drive.google.com' && pathname.startsWith('/drive/'))
    ) {
        return { kind: 'external', src: absolute, rawUrl: absolute };
    }

    // 3. Google Drive file (/file/d/<id>, /file/u/0/d/<id>, open?id=<id>, uc?id=<id>, drive.usercontent.google.com)
    if (host === 'drive.google.com' || host === 'drive.usercontent.google.com') {
        const pathId = pathname.match(/\/file\/(?:u\/\d+\/)?d\/([\w-]{10,})/i)?.[1];
        const queryId = parsedUrl.searchParams.get('id');
        const fileId = pathId || (queryId && /^[\w-]{10,}$/.test(queryId) ? queryId : '');
        if (fileId) {
            return {
                kind: 'drive',
                src: `https://drive.google.com/file/d/${fileId}/preview`,
                rawUrl: absolute
            };
        }
    }

    // 4. YouTube (watch, youtu.be, shorts, live, embed, v, m.youtube.com, music.youtube.com, youtube-nocookie.com)
    if (host === 'youtu.be' || host.endsWith('.youtu.be') || host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtube-nocookie.com' || host.endsWith('.youtube-nocookie.com')) {
        const idMatch = absolute.match(
            /(?:youtube(?:-nocookie)?\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i
        );
        if (idMatch?.[1]) {
            const start = parseStartSeconds(parsedUrl);
            const suffix = start > 0 ? `?start=${start}` : '';
            return {
                kind: 'youtube',
                src: `https://www.youtube.com/embed/${idMatch[1]}${suffix}`,
                rawUrl: absolute
            };
        }
        return { kind: 'youtube', src: absolute, rawUrl: absolute };
    }

    // 5. Vimeo (public: vimeo.com/<id>, unlisted hash: vimeo.com/<id>/<hash> hoặc player.vimeo.com/video/<id>?h=...)
    if (host === 'vimeo.com' || host === 'www.vimeo.com' || host === 'player.vimeo.com') {
        const playerMatch = pathname.match(/^\/video\/(\d+)/i);
        const stdMatch = pathname.match(/^\/(?:channels\/[^/]+\/|groups\/[^/]+\/videos\/)?(\d+)(?:\/([a-f0-9]+))?/i);
        const videoId = playerMatch?.[1] || stdMatch?.[1];
        if (videoId) {
            const hash = stdMatch?.[2] || parsedUrl.searchParams.get('h') || '';
            const query = hash ? `?h=${encodeURIComponent(hash)}` : '';
            return {
                kind: 'vimeo',
                src: `https://player.vimeo.com/video/${videoId}${query}`,
                rawUrl: absolute
            };
        }
    }

    // 6. Loom (loom.com/share/<id> hoặc loom.com/embed/<id>)
    if (host === 'loom.com' || host.endsWith('.loom.com')) {
        const loomMatch = pathname.match(/^\/(?:share|embed)\/([A-Za-z0-9-]+)/i);
        if (loomMatch?.[1]) {
            return {
                kind: 'loom',
                src: `https://www.loom.com/embed/${loomMatch[1]}`,
                rawUrl: absolute
            };
        }
    }

    // 7. Mọi link http(s) hợp lệ khác
    return { kind: 'iframe', src: absolute, rawUrl: absolute };
}
