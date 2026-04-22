// types/index.ts
// 替换成你的 Python API 实际返回的字段

export interface NewsItem {
  id: number
  title: string
  source: string
  time: string                          // 相对时间字符串，如 "5分钟前"
  sentiment: '积极' | '中性' | '消极'
  impact: '高影响' | '中等影响' | '低影响'
  url?: string
}

export interface WeeklyReport {
  week: string                          // 如 "2026 W16"
  title: string                         // 如 "4月第三周市场复盘"
  bullets: string[]                     // 要点列表，建议 3-5 条
  url?: string                          // 完整周报链接
}

export interface HomePageData {
  news: NewsItem[]                      // 传入 5 条
  weekly: WeeklyReport
}
