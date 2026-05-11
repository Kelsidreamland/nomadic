// @vitest-environment jsdom

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../i18n';
import { PWAPrompt } from './PWAPrompt';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { useRegisterSWMock, fetchRemoteAppVersionMock } = vi.hoisted(() => ({
  useRegisterSWMock: vi.fn(),
  fetchRemoteAppVersionMock: vi.fn(),
}));

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: useRegisterSWMock,
}));

vi.mock('../services/appVersion', async importOriginal => {
  const actual = await importOriginal<typeof import('../services/appVersion')>();
  return {
    ...actual,
    APP_VERSION: 'same-version',
    fetchRemoteAppVersion: fetchRemoteAppVersionMock,
  };
});

describe('PWAPrompt update prompt', () => {
  beforeEach(() => {
    fetchRemoteAppVersionMock.mockResolvedValue('same-version');
    useRegisterSWMock.mockReturnValue({
      offlineReady: [false, vi.fn()],
      needRefresh: [true, vi.fn()],
      updateServiceWorker: vi.fn(),
    });

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it('does not show an update card when the service worker refresh flag points to the current version', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<PWAPrompt />);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchRemoteAppVersionMock).toHaveBeenCalled();
    expect(container.textContent).not.toContain('新版本已就緒');
    expect(container.textContent).not.toContain('目前版本 same-version · 最新版本 same-version');

    act(() => {
      root.unmount();
    });
  });
});
