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
});
