import { create } from "zustand";
import type { LinkType, LinkIndexResponse } from "../types";

interface TimelineState {
  // Server data cache
  linkIndex: LinkIndexResponse | null;
  tagMap: Record<string, string>;

  // UI interaction state
  hoveredNodeId: string | null;
  focusedNodeId: string | null;
  hoveredLinkId: string | null;
  visibleTypes: Set<LinkType>;
  showAllLinks: boolean;

  // Actions
  setLinkIndex: (idx: LinkIndexResponse) => void;
  setTagMap: (m: Record<string, string>) => void;
  setHovered: (id: string | null) => void;
  setFocused: (id: string | null) => void;
  setHoveredLink: (id: string | null) => void;
  toggleType: (type: LinkType) => void;
  toggleShowAll: () => void;
  clearFocus: () => void;
}

const ALL_TYPES: LinkType[] = ["evolution", "causation", "contrast", "resonance"];

export const useTimelineStore = create<TimelineState>((set) => ({
  linkIndex: null,
  tagMap: {},
  hoveredNodeId: null,
  focusedNodeId: null,
  hoveredLinkId: null,
  visibleTypes: new Set(ALL_TYPES),
  showAllLinks: false,

  setLinkIndex: (idx) => set({ linkIndex: idx }),
  setTagMap: (m) => set({ tagMap: m }),
  setHovered: (id) => set({ hoveredNodeId: id }),
  setFocused: (id) => set({ focusedNodeId: id }),
  setHoveredLink: (id) => set({ hoveredLinkId: id }),
  toggleType: (type) =>
    set((s) => {
      const next = new Set(s.visibleTypes);
      next.has(type) ? next.delete(type) : next.add(type);
      return { visibleTypes: next };
    }),
  toggleShowAll: () => set((s) => ({ showAllLinks: !s.showAllLinks })),
  clearFocus: () => set({ focusedNodeId: null, hoveredNodeId: null }),
}));
