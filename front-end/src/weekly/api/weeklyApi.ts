import type {
  LinkDetail,
  LinkIndexResponse,
  NodeDetail,
  ReportDetail,
  ReportSummary,
  Tag,
} from "../types";

const BASE = import.meta.env.VITE_API_URL ?? "";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// In-flight dedup caches for frequently re-fetched entities
const reportCache = new Map<string, Promise<ReportDetail>>();
const nodeCache = new Map<string, Promise<NodeDetail>>();

function cachedGetReport(id: string): Promise<ReportDetail> {
  if (reportCache.has(id)) return reportCache.get(id)!;
  const promise = get<ReportDetail>(`/api/weekly/reports/${id}`).catch((e) => {
    reportCache.delete(id);
    throw e;
  });
  reportCache.set(id, promise);
  return promise;
}

function cachedGetNode(id: string): Promise<NodeDetail> {
  if (nodeCache.has(id)) return nodeCache.get(id)!;
  const promise = get<NodeDetail>(`/api/weekly/nodes/${id}`).catch((e) => {
    nodeCache.delete(id);
    throw e;
  });
  nodeCache.set(id, promise);
  return promise;
}

export const weeklyApi = {
  listReports: () => get<ReportSummary[]>("/api/weekly/reports"),

  getReport: (id: string) => cachedGetReport(id),

  listNodes: (tag?: string) => {
    const q = tag ? `?tag=${encodeURIComponent(tag)}` : "";
    return get<NodeDetail[]>(`/api/weekly/nodes${q}`);
  },

  getNode: (id: string) => cachedGetNode(id),

  listLinks: (nodeId?: string) => {
    const q = nodeId ? `?node=${encodeURIComponent(nodeId)}` : "";
    return get<LinkDetail[]>(`/api/weekly/links${q}`);
  },

  getLinkIndex: () => get<LinkIndexResponse>("/api/weekly/links/index"),

  listTags: () => get<Tag[]>("/api/weekly/tags"),

  getTagTimeline: (slug: string) =>
    get<NodeDetail[]>(`/api/weekly/tags/${slug}/timeline`),
};
