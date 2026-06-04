import { getS3UrlByFilename } from './s3Images';

/**
 * Trả về đường dẫn đúng cho file trong /public/ hoặc link S3 nếu có cấu hình
 * - S3 CDN (nếu đã upload): https://bucket.s3.region.amazonaws.com/category/logo.png
 * - Local dev (base="/"): /images/logo.png
 * - GitHub Pages (base="/OpPoReview/"): /images/logo.png
 *
 * Dùng: imgUrl('images/logo.png') hoặc imgUrl('/images/logo.png')
 */
export const imgUrl = (path) => {
  if (!path) return '';

  // Bỏ dấu / ở đầu path nếu có để tránh double slash
  const cleanPath = path.replace(/^\//, '');
  // Bỏ prefix /OpPoReview/ nếu ai đó đã hardcode vào
  const normalized = cleanPath.replace(/^OpPoReview\//, '');

  // Kiểm tra nếu là ảnh trong thư mục images
  if (normalized.startsWith('images/')) {
    const filename = normalized.substring('images/'.length);
    const s3Url = getS3UrlByFilename(filename);
    if (s3Url) {
      return s3Url;
    }
  }

  const base = import.meta.env.BASE_URL || '/';
  return `${base}${normalized}`;
};

