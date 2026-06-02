/**
 * Trả về đường dẫn đúng cho file trong /public/
 * - Local dev (base="/"): /images/logo.png
 * - GitHub Pages (base="/OpPoReview/"): /images/logo.png
 *
 * Dùng: imgUrl('images/logo.png') hoặc imgUrl('/images/logo.png')
 */
export const imgUrl = (path) => {
  const base = import.meta.env.BASE_URL || '/';
  // Bỏ dấu / ở đầu path nếu có để tránh double slash
  const cleanPath = path.replace(/^\//, '');
  // Bỏ prefix /OpPoReview/ nếu ai đó đã hardcode vào
  const normalized = cleanPath.replace(/^OpPoReview\//, '');
  return `${base}${normalized}`;
};
