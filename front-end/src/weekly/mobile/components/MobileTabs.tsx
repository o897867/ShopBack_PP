export type MobileTab = "latest" | "topics" | "index";

interface MobileTabsProps {
  activeTab: MobileTab;
  onChange: (tab: MobileTab) => void;
}

const TABS: { key: MobileTab; label: string }[] = [
  { key: "latest", label: "最新" },
  { key: "topics", label: "主题" },
  { key: "index", label: "索引" },
];

export function MobileTabs({ activeTab, onChange }: MobileTabsProps) {
  return (
    <nav className="mobile-tabs" role="tablist">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={activeTab === tab.key}
          className={`mobile-tab ${activeTab === tab.key ? "is-active" : ""}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
