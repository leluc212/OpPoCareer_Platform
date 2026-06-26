import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

describe('FeaturedPercentPanel', () => {
  it('does not render invented percent values when no backend summary is available', async () => {
    const { default: FeaturedPercentPanel } = await import('./FeaturedPercentPanel.jsx');

    const html = renderToStaticMarkup(
      <FeaturedPercentPanel
        configured={false}
        loading={false}
        summary={null}
        language="vi"
      />,
    );

    expect(html).toContain('Chưa có dữ liệu % nổi bật');
    expect(html).not.toContain('100%');
    expect(html).not.toContain('80%');
    expect(html).not.toContain('60%');
  });

  it('renders the real summary, profile checklist, and employer history from props', async () => {
    const { default: FeaturedPercentPanel } = await import('./FeaturedPercentPanel.jsx');

    const html = renderToStaticMarkup(
      <FeaturedPercentPanel
        configured
        loading={false}
        language="vi"
        summary={{
          percent: 84,
          level: { key: 'featured', label: 'Ứng viên nổi bật' },
          profile: {
            percent: 40,
            items: [
              { key: 'fullName', label: 'Họ và tên', percent: 5, completed: true },
              { key: 'phone', label: 'Số điện thoại', percent: 5, completed: true },
            ],
            missingFields: [],
          },
          history: [
            {
              applicationId: 'app-1',
              employerName: 'Nhà hàng A',
              jobTitle: 'Phục vụ',
              percent: 84,
              level: { key: 'featured', label: 'Ứng viên nổi bật' },
            },
          ],
        }}
      />,
    );

    expect(html).toContain('84%');
    expect(html).toContain('Ứng viên nổi bật');
    expect(html).toContain('Hồ sơ cá nhân');
    expect(html).toContain('Họ và tên');
    expect(html).toContain('Lịch sử theo nhà tuyển dụng');
    expect(html).toContain('Nhà hàng A');
    expect(html).not.toContain('Chưa có dữ liệu % nổi bật');
  });
});
