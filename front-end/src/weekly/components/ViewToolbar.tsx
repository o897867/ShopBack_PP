import { Link, useLocation } from "react-router-dom";

interface Props {
  children?: React.ReactNode;
}

const VIEWS = [
  { path: "/weekly-mindmap", label: "Timeline" },
  { path: "/weekly-mindmap/topics", label: "Topics" },
  { path: "/weekly-mindmap/graph", label: "Graph" },
] as const;

export default function ViewToolbar({ children }: Props) {
  const location = useLocation();

  function isActive(path: string): boolean {
    if (path === "/weekly-mindmap/topics") {
      return location.pathname.startsWith("/weekly-mindmap/topics");
    }
    return location.pathname === path;
  }

  return (
    <div className="wm-toolbar">
      <h1>Weekly Mindmap</h1>
      <div className="wm-view-btns">
        {VIEWS.map((v) => (
          <Link
            key={v.path}
            to={v.path}
            className={`wm-view-btn ${isActive(v.path) ? "active" : ""}`}
          >
            {v.label}
          </Link>
        ))}
      </div>
      {children && <div className="wm-toolbar-right">{children}</div>}
    </div>
  );
}
