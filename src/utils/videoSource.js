import { API_ORIGIN } from '../api';

const UNSAFE_SCHEME_RE = /^(?:javascript|data|vbscript|file):/i;
const ANY_SCHEME_RE = /^[A-Za-z][A-Za-z0-9+.-]*:/;
const DIRECT_VIDEO_EXT_RE = /\.(mp4|m4v|webm|mov|ogv)$/i;
const YT_ID_RE = /^[A-Za-z0-9_-]{11}$/;
const YT_LIST_RE = /^[A-Za-z0-9_-]{10,}$/;

function parseTimeToken(raw) {
    if (!raw) return 0;
    const cleaned = String(raw).trim();
    if (/^\d+$/.test(cleaned)) return Number.parseInt(cleaned, 10);

    const match = cleaned.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
    if (!match || (!match[1] && !match[2] && !match[3])) return 0;
    return (Number.parseInt(match[1] || '0', 10) * 3600) +
        (Number.parseInt(match[2] || '0', 10) * 60) +
        Number.parseInt(match[3] || '0', 10);
}

function parseStartSeconds(urlObj) {
    const queryRaw = urlObj.searchParams.get('t') || urlObj.searchParams.get('start') || '';
    const fromQuery = parseTimeToken(queryRaw);
    if (fromQuery > 0) return fromQuery;

    const hash = (urlObj.hash || '').replace(/^#/, '');
    if (!hash) return 0;
    const hashParams = new URLSearchParams(hash);
    const hashRaw = hashParams.get('t') || hashParams.get('start') || '';
    return parseTimeToken(hashRaw);
}

function normalizeUrl(rawUrl) {
    if (!rawUrl) return '';
    const trimmed = String(rawUrl).trim();
    if (!trimmed) return '';
    if (UNSAFE_SCHEME_RE.test(trimmed)) return '';
    if (trimmed.startsWith('//')) return `https:${trimmed}`;
    if (trimmed.startsWith('/')) return `${API_ORIGIN}${trimmed}`;
    if (!ANY_SCHEME_RE.test(trimmed) && trimmed.includes('.') && !/\s/.test(trimmed)) {
        return `https://${trimmed}`;
    }
    return trimmed;
}

function isYouTubeHost(host) {
    return host === 'youtu.be' ||
        host.endsWith('.youtu.be') ||
        host === 'youtube.com' ||
        host.endsWith('.youtube.com') ||
        host === 'youtube-nocookie.com' ||
        host.endsWith('.youtube-nocookie.com');
}

function extractYouTubeEmbed(parsedUrl, depth = 0) {
    if (depth > 2) return '';

    const host = parsedUrl.hostname.toLowerCase();
    const pathname = parsedUrl.pathname || '';

    // Unwrap /attribution_link?u=...
    if (pathname === '/attribution_link') {
        const innerRaw = parsedUrl.searchParams.get('u');
        if (innerRaw) {
            try {
                const decoded = decodeURIComponent(innerRaw);
                const innerUrl = new URL(decoded.startsWith('/') ? `https://www.youtube.com${decoded}` : decoded);
                if (isYouTubeHost(innerUrl.hostname.toLowerCase())) {
                    return extractYouTubeEmbed(innerUrl, depth + 1);
                }
            } catch {
                // Ignore malformed attribution URL
            }
        }
    }

    let videoId = '';
    if (host === 'youtu.be' || host.endsWith('.youtu.be')) {
        const seg = pathname.replace(/^\/+/, '').split('/')[0] || '';
        if (YT_ID_RE.test(seg)) videoId = seg;
    } else if (host === 'studio.youtube.com') {
        const studioMatch = pathname.match(/^\/video\/([A-Za-z0-9_-]{11})(?:\/|$)/i);
        if (studioMatch?.[1]) videoId = studioMatch[1];
    } else {
        const pathMatch = pathname.match(/^\/(?:embed|shorts|live|v|e)\/([A-Za-z0-9_-]{11})(?:\/|$)/i);
        const queryV = parsedUrl.searchParams.get('v') || '';
        if (pathMatch?.[1]) {
            videoId = pathMatch[1];
        } else if (YT_ID_RE.test(queryV)) {
            videoId = queryV;
        }
    }

    if (videoId) {
        const start = parseStartSeconds(parsedUrl);
        const suffix = start > 0 ? `?start=${start}` : '';
        return `https://www.youtube.com/embed/${videoId}${suffix}`;
    }

    const listId = parsedUrl.searchParams.get('list') || '';
    if ((pathname === '/playlist' || pathname === '/embed/videoseries') && YT_LIST_RE.test(listId)) {
        return `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(listId)}`;
    }

    return '';
}

/**
 * Nhận diện nguồn video chữa bài và trả về cách phát phù hợp.
 *
 * - File video trực tiếp (.mp4/.mov/.webm hoặc lưu trên server/Supabase): thẻ <video>.
 * - Google Drive file (/file/d/..., /file/u/0/d/..., open?id=..., uc?id=...): iframe /preview.
 * - Google Docs/Slides/Sheets/Drive folder: link mở tab mới (Google chặn nhúng iframe).
 * - YouTube (watch, youtu.be, shorts, live, embed, studio, playlist, attribution_link, công khai & không công khai): iframe embed.
 * - Vimeo (kể cả link không công khai có hash, /manage/videos/, /showcase/) & Loom: iframe embed.
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
        (host === 'drive.google.com' &&
            (/^\/drive(?:\/|$)/i.test(pathname) ||
                /^\/folders(?:\/|$)/i.test(pathname) ||
                /^\/u\/\d+\/folders(?:\/|$)/i.test(pathname)))
    ) {
        return { kind: 'external', src: absolute, rawUrl: absolute };
    }

    // 3. Google Drive file (/file/d/<id>, /file/u/0/d/<id>, open?id=<id>, uc?id=<id>, drive.usercontent.google.com)
    if (host === 'drive.google.com' || host === 'drive.usercontent.google.com') {
        const pathId = pathname.match(/\/file\/(?:u\/\d+\/)?d\/([\w-]{10,})/i)?.[1];
        const queryId = parsedUrl.searchParams.get('id');
        const fileId = pathId || (queryId && /^[\w-]{10,}$/.test(queryId) ? queryId : '');
        if (fileId) {
            const resourceKey = parsedUrl.searchParams.get('resourcekey');
            const suffix = resourceKey ? `?resourcekey=${encodeURIComponent(resourceKey)}` : '';
            return {
                kind: 'drive',
                src: `https://drive.google.com/file/d/${fileId}/preview${suffix}`,
                rawUrl: absolute
            };
        }
        return { kind: 'external', src: absolute, rawUrl: absolute };
    }

    // 4. YouTube (watch, youtu.be, shorts, live, embed, v, studio, playlist, attribution_link)
    if (isYouTubeHost(host)) {
        const embedSrc = extractYouTubeEmbed(parsedUrl);
        if (embedSrc) {
            return {
                kind: 'youtube',
                src: embedSrc,
                rawUrl: absolute
            };
        }
        // Trang kênh hoặc trang chủ YouTube không cho phép nhúng iframe -> mở tab mới
        return { kind: 'external', src: absolute, rawUrl: absolute };
    }

    // 5. Vimeo (public, unlisted hash, manage/videos, album/showcase, player.vimeo.com)
    if (host === 'vimeo.com' || host === 'www.vimeo.com' || host === 'player.vimeo.com') {
        const playerMatch = pathname.match(/^\/video\/(\d+)/i);
        const manageMatch = pathname.match(/^\/manage\/videos\/(\d+)(?:\/([a-f0-9]+))?/i);
        const albumMatch = pathname.match(/^\/(?:album|showcase)\/\d+\/video\/(\d+)/i);
        const stdMatch = pathname.match(/^\/(?:channels\/[^/]+\/|groups\/[^/]+\/videos\/)?(\d+)(?:\/([a-f0-9]+))?/i);
        const videoId = playerMatch?.[1] || manageMatch?.[1] || albumMatch?.[1] || stdMatch?.[1];
        if (videoId) {
            const hash = manageMatch?.[2] || stdMatch?.[2] || parsedUrl.searchParams.get('h') || '';
            const query = hash ? `?h=${encodeURIComponent(hash)}` : '';
            return {
                kind: 'vimeo',
                src: `https://player.vimeo.com/video/${videoId}${query}`,
                rawUrl: absolute
            };
        }
        return { kind: 'external', src: absolute, rawUrl: absolute };
    }

    // 6. Loom (loom.com/share/<id> hoặc loom.com/embed/<id>; thư mục/spaces -> mở tab mới)
    if (host === 'loom.com' || host.endsWith('.loom.com')) {
        if (/^\/(?:share\/folder|spaces)(?:\/|$)/i.test(pathname)) {
            return { kind: 'external', src: absolute, rawUrl: absolute };
        }
        const loomMatch = pathname.match(/^\/(?:share|embed)\/([A-Za-z0-9-]{8,})(?:\/|$)/i);
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
