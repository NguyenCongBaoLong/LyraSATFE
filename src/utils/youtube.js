/**
 * Chuẩn hóa link YouTube bất kỳ (watch, share, short, embed) sang dạng iframe embed
 */
export function getEmbedYoutubeUrl(url) {
    if (!url) return '';
    if (url.includes('youtube.com/embed/')) return url;

    // Bắt Video ID 11 ký tự của YouTube
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`;
    }
    return url;
}
