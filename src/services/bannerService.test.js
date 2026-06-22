/**
 * Tests for banner region targeting logic
 * Run: npx vitest run src/services/bannerService.test.js
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock aws-amplify before importing the service
vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn(() => Promise.resolve({ tokens: null }))
}));

// We'll test the filtering logic directly by extracting it
// Since getActiveBanners calls getAllBanners internally, we'll mock fetch

const mockBanners = [
  {
    bannerId: 'banner_1',
    title: 'Banner HCM only',
    imageUrl: 'https://example.com/hcm.jpg',
    linkUrl: '',
    isActive: true,
    order: 1,
    targetRegions: ['Hồ Chí Minh'],
  },
  {
    bannerId: 'banner_2',
    title: 'Banner nationwide',
    imageUrl: 'https://example.com/all.jpg',
    linkUrl: '',
    isActive: true,
    order: 2,
    targetRegions: [],
  },
  {
    bannerId: 'banner_3',
    title: 'Banner Hà Nội + Đà Nẵng',
    imageUrl: 'https://example.com/hn-dn.jpg',
    linkUrl: '',
    isActive: true,
    order: 3,
    targetRegions: ['Hà Nội', 'Đà Nẵng'],
  },
  {
    bannerId: 'banner_4',
    title: 'Banner inactive HCM',
    imageUrl: 'https://example.com/inactive.jpg',
    linkUrl: '',
    isActive: false,
    order: 4,
    targetRegions: ['Hồ Chí Minh'],
  },
  {
    bannerId: 'banner_5',
    title: 'Banner Bình Dương',
    imageUrl: 'https://example.com/bd.jpg',
    linkUrl: '',
    isActive: true,
    order: 5,
    targetRegions: ['Bình Dương'],
  },
  {
    bannerId: 'banner_6',
    title: 'Banner no targetRegions field',
    imageUrl: 'https://example.com/no-field.jpg',
    linkUrl: '',
    isActive: true,
    order: 6,
    // no targetRegions field at all
  },
];

// Mock global fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ banners: mockBanners }),
  })
);

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value; },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock import.meta.env
vi.stubGlobal('import', { meta: { env: {} } });

// Now import the service
const { getActiveBanners } = await import('./bannerService.js');

describe('getActiveBanners - Region Targeting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ banners: mockBanners }),
      })
    );
  });

  it('should return all active banners when no candidate location is provided', async () => {
    // When candidateLocation is empty, banners without targetRegions show, others don't
    const result = await getActiveBanners('');
    
    // Should include: banner_2 (nationwide, []), banner_6 (no field)
    // Should NOT include: banner_1, banner_3, banner_5 (have targetRegions but candidate has no location)
    // Should NOT include: banner_4 (inactive)
    const ids = result.map(b => b.bannerId);
    expect(ids).toContain('banner_2');
    expect(ids).toContain('banner_6');
    expect(ids).not.toContain('banner_1');
    expect(ids).not.toContain('banner_3');
    expect(ids).not.toContain('banner_4');
    expect(ids).not.toContain('banner_5');
  });

  it('should filter banners matching HCM candidate location', async () => {
    const result = await getActiveBanners('Quận 1, Hồ Chí Minh');
    
    const ids = result.map(b => b.bannerId);
    // Should include: banner_1 (targets HCM), banner_2 (nationwide), banner_6 (no field)
    expect(ids).toContain('banner_1');
    expect(ids).toContain('banner_2');
    expect(ids).toContain('banner_6');
    // Should NOT include: banner_3 (targets HN + DN), banner_5 (targets BD)
    expect(ids).not.toContain('banner_3');
    expect(ids).not.toContain('banner_5');
    // Should NOT include inactive
    expect(ids).not.toContain('banner_4');
  });

  it('should filter banners matching Hà Nội candidate location', async () => {
    const result = await getActiveBanners('Cầu Giấy, Hà Nội');
    
    const ids = result.map(b => b.bannerId);
    // Should include: banner_2 (nationwide), banner_3 (targets HN), banner_6 (no field)
    expect(ids).toContain('banner_2');
    expect(ids).toContain('banner_3');
    expect(ids).toContain('banner_6');
    // Should NOT include: banner_1 (HCM only), banner_5 (BD only)
    expect(ids).not.toContain('banner_1');
    expect(ids).not.toContain('banner_5');
  });

  it('should filter banners matching Đà Nẵng candidate location', async () => {
    const result = await getActiveBanners('Hải Châu, Đà Nẵng');
    
    const ids = result.map(b => b.bannerId);
    // banner_3 targets ['Hà Nội', 'Đà Nẵng'] - should match
    expect(ids).toContain('banner_3');
    expect(ids).toContain('banner_2');
    expect(ids).toContain('banner_6');
    expect(ids).not.toContain('banner_1');
  });

  it('should be case-insensitive when matching regions', async () => {
    const result = await getActiveBanners('quận 7, hồ chí minh');
    
    const ids = result.map(b => b.bannerId);
    expect(ids).toContain('banner_1'); // 'Hồ Chí Minh' matches 'hồ chí minh'
  });

  it('should return max 5 banners', async () => {
    // Add more active nationwide banners
    const manyBanners = [
      ...mockBanners,
      { bannerId: 'banner_7', title: 'Extra 1', imageUrl: '', isActive: true, order: 7, targetRegions: [] },
      { bannerId: 'banner_8', title: 'Extra 2', imageUrl: '', isActive: true, order: 8, targetRegions: [] },
      { bannerId: 'banner_9', title: 'Extra 3', imageUrl: '', isActive: true, order: 9, targetRegions: [] },
      { bannerId: 'banner_10', title: 'Extra 4', imageUrl: '', isActive: true, order: 10, targetRegions: [] },
    ];

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ banners: manyBanners }),
      })
    );

    const result = await getActiveBanners('Quận 1, Hồ Chí Minh');
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it('should sort by order', async () => {
    const result = await getActiveBanners('Quận 1, Hồ Chí Minh');
    
    for (let i = 1; i < result.length; i++) {
      expect(result[i].order || 0).toBeGreaterThanOrEqual(result[i - 1].order || 0);
    }
  });

  it('should not include inactive banners regardless of region match', async () => {
    const result = await getActiveBanners('Quận 1, Hồ Chí Minh');
    
    const ids = result.map(b => b.bannerId);
    // banner_4 is inactive but targets HCM - should NOT be included
    expect(ids).not.toContain('banner_4');
  });

  it('should handle candidate with Bình Dương location', async () => {
    const result = await getActiveBanners('Dĩ An, Bình Dương');
    
    const ids = result.map(b => b.bannerId);
    expect(ids).toContain('banner_5'); // targets Bình Dương
    expect(ids).toContain('banner_2'); // nationwide
    expect(ids).not.toContain('banner_1'); // HCM only
  });
});
