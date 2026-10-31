/**
 * EternalEcho - Ultra High-Speed Photo Thumbs Manifest
 * Automatically maps full-res photo URLs to lightweight thumbnails (10x faster load)
 */
window.PHOTO_THUMBS_DATA = {};
if (typeof window.REAL_COUPLE_PHOTOS !== 'undefined' && Array.isArray(window.REAL_COUPLE_PHOTOS)) {
  window.REAL_COUPLE_PHOTOS.forEach(p => {
    if (p && p.url && p.url.includes('/photos/')) {
      const thumbUrl = p.url.replace('/photos/', '/thumbs/');
      window.PHOTO_THUMBS_DATA[p.url] = thumbUrl;
      p.thumb = thumbUrl;
      p.thumbUrl = thumbUrl;
    }
  });
}
