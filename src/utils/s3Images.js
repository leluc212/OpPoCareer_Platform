const S3_BUCKET_NAME = import.meta.env.VITE_S3_BUCKET_NAME || 'opporeview-cv-storage';
const S3_REGION = import.meta.env.VITE_S3_REGION || 'ap-southeast-1';
const S3_BASE_URL = import.meta.env.VITE_S3_ASSETS_URL || `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com`;

export const s3Images = {
  banner: {
    bamos: `${S3_BASE_URL}/banner/bamosbanner.jpg`,
    default: `${S3_BASE_URL}/banner/banner.png`,
    banner1: `${S3_BASE_URL}/banner/banner1.png`,
    banner2: `${S3_BASE_URL}/banner/banner2.png`,
    dai: `${S3_BASE_URL}/banner/bannerdai.png`,
    le: `${S3_BASE_URL}/banner/lebanner.jpg`,
    seoul: `${S3_BASE_URL}/banner/seoul.jpg`,
    unnamed: `${S3_BASE_URL}/banner/unnamed.jpg`,
    unnamed1: `${S3_BASE_URL}/banner/unnamed1.jpg`
  },
  poster: {
    default: `${S3_BASE_URL}/poster/poster.png`,
    phache: `${S3_BASE_URL}/poster/phache.png`,
    lemoments: `${S3_BASE_URL}/poster/lemoments.png`,
    bamos1: `${S3_BASE_URL}/poster/bamos1.jpg`,
    katinatQ8: `${S3_BASE_URL}/poster/katinatQ8.jpg`,
    phucloctho: `${S3_BASE_URL}/poster/phucloctho.jpg`
  },
  system: {
    logo: `${S3_BASE_URL}/system/logo.png`,
    logoPlt: `${S3_BASE_URL}/system/logoplt.png`,
    mascot: `${S3_BASE_URL}/system/mascot.png`,
    linhvat: `${S3_BASE_URL}/system/linhvat.png`,
    appstore: `${S3_BASE_URL}/system/appstore1.jpg`,
    chplay: `${S3_BASE_URL}/system/chplay.jpg`,
    coffeehouse: `${S3_BASE_URL}/system/coffeehouse.jpg`,
    highlands: `${S3_BASE_URL}/system/highlands.jpg`,
    katinatlogo: `${S3_BASE_URL}/system/katinatlogo.jpg`,
    katinat: `${S3_BASE_URL}/system/katinat.png`,
    bamos: `${S3_BASE_URL}/system/bamos.png`,
    starbuck: `${S3_BASE_URL}/system/starbuck.png`,
    phuclong: `${S3_BASE_URL}/system/phuclong.jpg`,
    ngogia: `${S3_BASE_URL}/system/ngogia.png`,
    suncha: `${S3_BASE_URL}/system/suncha.jpg`,
    trungnguyen: `${S3_BASE_URL}/system/trungnguyen.jpg`
  }
};

// Quick mapping for automatic filename resolution
export const filenameToS3Path = {
  // Banners
  'bamosbanner.jpg': 'banner/bamosbanner.jpg',
  'banner.png': 'banner/banner.png',
  'banner1.png': 'banner/banner1.png',
  'banner2.png': 'banner/banner2.png',
  'bannerdai.png': 'banner/bannerdai.png',
  'lebanner.jpg': 'banner/lebanner.jpg',
  'seoul.jpg': 'banner/seoul.jpg',
  'unnamed.jpg': 'banner/unnamed.jpg',
  'unnamed1.jpg': 'banner/unnamed1.jpg',

  // Posters
  'poster.png': 'poster/poster.png',
  'phache.png': 'poster/phache.png',
  'lemoments.png': 'poster/lemoments.png',
  'bamos1.jpg': 'poster/bamos1.jpg',
  'katinatQ8.jpg': 'poster/katinatQ8.jpg',
  'phucloctho.jpg': 'poster/phucloctho.jpg',

  // System
  'logo.png': 'system/logo.png',
  'logoplt.png': 'system/logoplt.png',
  'mascot.png': 'system/mascot.png',
  'linhvat.png': 'system/linhvat.png',
  'appstore1.jpg': 'system/appstore1.jpg',
  'chplay.jpg': 'system/chplay.jpg',
  'coffeehouse.jpg': 'system/coffeehouse.jpg',
  'highlands.jpg': 'system/highlands.jpg',
  'katinatlogo.jpg': 'system/katinatlogo.jpg',
  'katinat.png': 'system/katinat.png',
  'bamos.png': 'system/bamos.png',
  'starbuck.png': 'system/starbuck.png',
  'phuclong.jpg': 'system/phuclong.jpg',
  'ngogia.png': 'system/ngogia.png',
  'suncha.jpg': 'system/suncha.jpg',
  'trungnguyen.jpg': 'system/trungnguyen.jpg'
};

/**
 * Utility function to get an S3 URL by filename.
 * @param {string} filename 
 * @returns {string|null} S3 URL or null if not mapped
 */
export const getS3UrlByFilename = (filename) => {
  if (!filename) return null;
  const cleanName = filename.replace(/^\//, '').split('/').pop(); // get only the base filename
  const s3Path = filenameToS3Path[cleanName];
  if (s3Path) {
    return `${S3_BASE_URL}/${s3Path}`;
  }
  return null;
};

/**
 * Utility function to get an image URL by category and key.
 * @param {('banner'|'poster'|'system')} category 
 * @param {string} key 
 * @returns {string} S3 URL
 */
export const getS3ImageUrl = (category, key) => {
  if (s3Images[category] && s3Images[category][key]) {
    return s3Images[category][key];
  }
  return '';
};
