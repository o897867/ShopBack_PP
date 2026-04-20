export type LinkType = "evolution" | "causation" | "contrast" | "resonance";

export type NodeColor =
  | "c-amber" | "c-blue" | "c-teal" | "c-purple" | "c-coral"
  | "c-pink" | "c-gray" | "c-green" | "c-red";

export interface Tag {
  slug: string;
  name: string;
  color: string;
  description: string | null;
  parent_slug: string | null;
}

export interface NodeDetail {
  id: string;
  report_id: string;
  order: number;
  title: string;
  subtitle: string | null;
  summary: string | null;
  body_markdown: string | null;
  key_points: string[] | null;
  tags: string[] | null;
  color: NodeColor;
  position_x: number | null;
  position_y: number | null;
  created_at: string;
}

export interface LinkDetail {
  id: string;
  from_node_id: string;
  to_node_id: string;
  type: LinkType;
  label: string | null;
  strength: number;
  ai_suggested: boolean;
  user_confirmed: boolean;
  ai_reasoning: string | null;
  created_at: string;
}

export interface ReportSummary {
  id: string;
  date: string;
  title: string;
  author: string;
  source_url: string | null;
  cover_image: string | null;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
  node_count: number;
}

export interface ReportDetail {
  id: string;
  date: string;
  title: string;
  author: string;
  source_url: string | null;
  cover_image: string | null;
  raw_content: string | null;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
  nodes: NodeDetail[];
}
