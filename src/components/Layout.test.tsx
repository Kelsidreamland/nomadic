// @vitest-environment jsdom

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Layout } from './Layout';

const SPONSOR_URL = 'https://api.payuni.com.tw/api/uop/receive_info/2/3/NPPA226028039/mgYrU0DqoPbb6vatwL86Z';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('Layout sponsor entry points', () => {
  it('keeps Sponsor available on desktop and mobile headers', () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/items']}>
          <Layout>
            <main>Items</main>
          </Layout>
        </MemoryRouter>
      );
    });

    const sponsorLinks = Array.from(container.querySelectorAll<HTMLAnchorElement>('a'))
      .filter(link => link.textContent?.trim() === 'Sponsor' || link.getAttribute('aria-label') === 'Sponsor');

    expect(sponsorLinks).toHaveLength(2);
    expect(sponsorLinks.every(link => link.getAttribute('href') === SPONSOR_URL)).toBe(true);

    act(() => {
      root.unmount();
    });
  });
});
