/**
 * Seed script: thêm banner Top Spotlight "Phúc Lộc Thọ" vào DynamoDB
 * 
 * Chạy: node amplify/backend/seed-spotlight-banner.js
 * 
 * Banner này sẽ hiển thị ở sidebar cả trang chủ (/candidate/dashboard)
 * và trang danh sách job (/candidate/jobs?tab=standard).
 * 
 * Ảnh poster đã có sẵn trên S3: poster/phucloctho.jpg
 */

const API_URL = 'https://35djy3cnxb.execute-api.ap-southeast-1.amazonaws.com/prod';
const S3_BASE = 'https://opporeview-cv-storage.s3.ap-southeast-1.amazonaws.com';

const spotlightBanner = {
  title: 'Phúc Lộc Thọ - Tuyển Nhân Viên Phục Vụ',
  imageUrl: `${S3_BASE}/poster/phucloctho.jpg`,
  linkUrl: '', // Admin có thể update link tới job detail sau
  isActive: true,
  isTopSpotlight: true,
  orientation: 'vertical',
  order: 1,
  targetRegions: [], // Hiện ở mọi vùng
};

async function seed() {
  console.log(`🚀 Seeding Top Spotlight banner to ${API_URL}/banners ...\n`);
  console.log(`   Title: "${spotlightBanner.title}"`);
  console.log(`   Image: ${spotlightBanner.imageUrl}`);
  console.log(`   isTopSpotlight: ${spotlightBanner.isTopSpotlight}`);
  console.log('');

  try {
    const res = await fetch(`${API_URL}/banners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(spotlightBanner),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    const data = await res.json();
    const created = data.banner || data;
    console.log(`✅ Created: "${created.title}" → bannerId: ${created.bannerId}`);
    console.log('');
    console.log('📌 Banner sẽ hiện ở sidebar cả 2 trang:');
    console.log('   - /candidate/dashboard');
    console.log('   - /candidate/jobs?tab=standard');
    console.log('');
    console.log('💡 Admin có thể quản lý banner này tại trang Admin > Quản lý Banner');
  } catch (err) {
    console.error(`❌ Failed: ${err.message}`);
    console.error('');
    console.error('Nếu lỗi 401/403, chạy lại với auth token hoặc seed trực tiếp qua admin dashboard.');
  }

  console.log('\n✨ Done!');
}

seed();
