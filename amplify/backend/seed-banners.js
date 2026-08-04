/**
 * Seed script: push 3 default banners vào DynamoDB qua Banner API
 * 
 * Chạy: node amplify/backend/seed-banners.js
 */

const API_URL = 'https://9eubdtwarg.execute-api.ap-southeast-1.amazonaws.com/prod';
const S3_BASE = 'https://opporeview-cv-storage-prod-2026.s3.ap-southeast-1.amazonaws.com';

const defaultBanners = [
  {
    title: 'Seoul Vua Mì Cay',
    imageUrl: `${S3_BASE}/banner/seoul.jpg`,
    linkUrl: '',
    isActive: true,
    order: 1,
  },
  {
    title: 'Banner 2',
    imageUrl: `${S3_BASE}/banner/unnamed1.jpg`,
    linkUrl: '',
    isActive: true,
    order: 2,
  },
  {
    title: 'Banner 3',
    imageUrl: `${S3_BASE}/banner/unnamed.jpg`,
    linkUrl: '',
    isActive: true,
    order: 3,
  },
];

async function seed() {
  console.log(`🚀 Seeding ${defaultBanners.length} banners to ${API_URL}/banners ...\n`);

  for (const banner of defaultBanners) {
    try {
      const res = await fetch(`${API_URL}/banners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(banner),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const data = await res.json();
      const created = data.banner || data;
      console.log(`✅ Created: "${created.title}" → ${created.bannerId}`);
    } catch (err) {
      console.error(`❌ Failed "${banner.title}": ${err.message}`);
    }
  }

  console.log('\n✨ Done! Kiểm tra trang admin để xem 3 banner vừa seed.');
}

seed();
