// @vitest-environment jsdom

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import '../i18n';
import { Items } from './Items';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(() => []),
}));

vi.mock('../services/ai', () => ({
  analyzeItemWithAI: vi.fn(),
}));

describe('Items inventory modes', () => {
  it('opens the quick count panel from the mode query string', () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/items?mode=quick']}>
          <Items />
        </MemoryRouter>
      );
    });

    expect(container.textContent).toContain('快速清點');
    expect(container.textContent).toContain('襪子');
    expect(container.textContent).toContain('護照');

    act(() => {
      root.unmount();
    });
  });

  it('shows detailed packing zones before photo capture', () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/items?mode=detail']}>
          <Items />
        </MemoryRouter>
      );
    });

    expect(container.textContent).toContain('從哪一區開始');
    expect(container.textContent).toContain('盥洗');
    expect(container.textContent).toContain('化妝');
    expect(container.textContent).toContain('正在記錄：衣物');

    const toiletriesButton = Array.from(container.querySelectorAll('button'))
      .find(button => button.textContent?.includes('盥洗'));
    expect(toiletriesButton).toBeTruthy();

    act(() => {
      toiletriesButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('正在記錄：盥洗');

    act(() => {
      root.unmount();
    });
  });
});
