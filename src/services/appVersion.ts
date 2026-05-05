type VersionFetch = typeof fetch;

export const APP_VERSION = __APP_VERSION__;
export const APP_BUILT_AT = __APP_BUILT_AT__;

export const shouldPromptForAppUpdate = (currentVersion: string, remoteVersion?: string) => {
  return Boolean(remoteVersion && remoteVersion !== currentVersion);
};

export const fetchRemoteAppVersion = async (fetchImpl: VersionFetch = fetch) => {
  const response = await fetchImpl(`/version.json?t=${Date.now()}`, {
    cache: 'no-store',
  });

  if (!response.ok) return '';

  const data = await response.json().catch(() => null) as { version?: string } | null;
  return data?.version || '';
};
