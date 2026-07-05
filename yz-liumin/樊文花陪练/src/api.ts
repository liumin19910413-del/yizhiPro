const DEFAULT_MEMORY_API = "https://yz-fc.meimeifa.com/dify/api/public/user/memory/";

export interface UrlContext {
  oneId: string;
  apiBase: string;
  isDemo: boolean;
}

export function parseUrlContext(): UrlContext {
  const query = new URLSearchParams(location.search);
  const hashText = decodeURIComponent(location.hash.replace(/^#\/?/, "").trim());
  const [hashPath, hashQuery = ""] = hashText.split("?");
  const hashParams = new URLSearchParams(hashQuery);
  const oneIdMatch = hashPath.match(/[A-Za-z0-9_]+:[A-Za-z0-9_:-]+/);
  const oneId = query.get("oneId") || (oneIdMatch ? oneIdMatch[0] : hashPath);
  const apiBase = query.get("memoryApi") || hashParams.get("memoryApi") || DEFAULT_MEMORY_API;

  return {
    oneId: (oneId || "").trim(),
    apiBase: apiBase.replace(/\/?$/, "/"),
    isDemo: !oneId || oneId === "demo"
  };
}

export async function fetchMemoryProfile(oneId: string, apiBase: string): Promise<unknown> {
  const url = apiBase + encodeURIComponent(oneId);
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`报告数据加载失败 HTTP ${response.status}`);
  return response.json();
}

export function unwrapMemory(raw: unknown): Record<string, unknown> {
  let data: unknown = raw;

  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return {};
    }
  }

  const outer = data as Record<string, unknown> | null;
  data = outer?.data ?? outer?.result ?? outer?.memory ?? data;

  const maybeContent = data as { content?: unknown } | null;
  if (typeof maybeContent?.content === "string") {
    try {
      data = JSON.parse(maybeContent.content);
    } catch {
      data = maybeContent.content;
    }
  }

  const unwrapped = data as Record<string, unknown> | null;
  if (unwrapped?.profile && typeof unwrapped.profile === "object") return unwrapped;
  if (unwrapped?.userProfile && typeof unwrapped.userProfile === "object") {
    return { profile: unwrapped.userProfile };
  }
  return { profile: unwrapped || {} };
}
