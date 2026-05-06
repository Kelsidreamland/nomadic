// @vitest-environment jsdom

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../i18n';
import { Overview } from './Overview';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(() => []),
}));

vi.mock('../services/ai', () => ({
  generateSmartInsights: vi.fn(),
}));

describe('Overview departure tools', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps packing-related actions on Overview without duplicating the outfit tab', () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/overview']}>
          <Overview />
        </MemoryRouter>
      );
    });

    expect(container.textContent).toContain('AI 斷捨離');
    expect(container.textContent).toContain('打包模式');
    expect(container.textContent).toContain('旅居足跡');
    expect(container.textContent).not.toContain('查看搭配統計');

    act(() => {
      root.unmount();
    });
  });
});
