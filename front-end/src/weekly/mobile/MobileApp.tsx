import { useState, useEffect } from "react";
import { useTimelineStore } from "../store/timelineStore";
import { weeklyApi } from "../api/weeklyApi";
import { MobileHeader } from "./components/MobileHeader";
import { MobileTabs, type MobileTab } from "./components/MobileTabs";
import { LatestFeed } from "./components/LatestFeed";
import { TopicsTab, IndexTab } from "./components/TopicsTab";
import "./styles/mobile.css";

export default function MobileApp() {
  const [activeTab, setActiveTab] = useState<MobileTab>("latest");
  const setLinkIndex = useTimelineStore((s) => s.setLinkIndex);
  const setTagMap = useTimelineStore((s) => s.setTagMap);

  useEffect(() => {
    weeklyApi.getLinkIndex().then(setLinkIndex).catch(console.error);
    weeklyApi.listTags().then((tags) => {
      const m: Record<string, string> = {};
      for (const t of tags) m[t.slug] = t.name;
      setTagMap(m);
    }).catch(console.error);
  }, [setLinkIndex, setTagMap]);

  return (
    <div className="mobile-app">
      <MobileHeader />
      <MobileTabs activeTab={activeTab} onChange={setActiveTab} />

      <div className="mobile-content">
        {activeTab === "latest" && <LatestFeed />}
        {activeTab === "topics" && <TopicsTab />}
        {activeTab === "index" && <IndexTab />}
      </div>
    </div>
  );
}
