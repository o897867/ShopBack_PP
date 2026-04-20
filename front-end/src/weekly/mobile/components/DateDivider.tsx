interface DateDividerProps {
  date: string;
  nodeCount: number;
}

export function DateDivider({ date, nodeCount }: DateDividerProps) {
  return (
    <div className="date-divider">
      <div className="date-divider-line" />
      <div className="date-divider-content">
        <div className="date-divider-label">{date} 周总结</div>
        <div className="date-divider-count">{nodeCount} 个节点</div>
      </div>
      <div className="date-divider-line" />
    </div>
  );
}
