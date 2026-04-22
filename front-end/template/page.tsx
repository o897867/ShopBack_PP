// app/page.tsx  (Next.js 13+ App Router)
// 数据由 Python 后端提供，Claude Code 负责接入 API 调用

import Link from 'next/link'
import type { HomePageData, NewsItem, WeeklyReport } from '@/types'

// ─── 数据获取 ─────────────────────────────────────────────────────────────────
// TODO: 让 Claude Code 把这里替换成你的真实 Python API 地址

async function getHomeData(): Promise<HomePageData> {
  try {
    const res = await fetch(`${process.env.API_BASE_URL}/api/home`, {
      next: { revalidate: 60 },         // 每 60 秒重新验证
    })
    if (!res.ok) throw new Error('API error')
    return res.json()
  } catch {
    // 开发占位数据，上线前删除
    return MOCK_DATA
  }
}

// ─── 子组件 ───────────────────────────────────────────────────────────────────

function SentimentBadge({ value }: { value: NewsItem['sentiment'] }) {
  const map = {
    积极: 'border-green-200 text-green-800 bg-green-50',
    中性: 'border-amber-200 text-amber-800 bg-amber-50',
    消极: 'border-red-200 text-red-800 bg-red-50',
  }
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${map[value]}`}>
      {value}
    </span>
  )
}

function ImpactBadge({ value }: { value: NewsItem['impact'] }) {
  const map = {
    高影响:   'border-red-200   text-red-800   bg-red-50',
    中等影响: 'border-amber-200 text-amber-800 bg-amber-50',
    低影响:   'border-gray-200  text-gray-500  bg-gray-50',
  }
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${map[value]}`}>
      {value}
    </span>
  )
}

function NewsCard({ item }: { item: NewsItem }) {
  const inner = (
    <article className="py-3.5 border-b border-gray-100 group cursor-pointer">
      <p className="font-serif text-[13px] leading-snug text-gray-800 mb-2
        group-hover:text-gray-400 transition-colors duration-150">
        {item.title}
      </p>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="font-mono text-[10px] tracking-wide text-gray-300">
          {item.source}
        </span>
        <span className="w-[2px] h-[2px] rounded-full bg-gray-200" />
        <span className="text-[11px] text-gray-300">{item.time}</span>
        <SentimentBadge value={item.sentiment} />
        <ImpactBadge value={item.impact} />
      </div>
    </article>
  )
  return item.url ? <Link href={item.url}>{inner}</Link> : inner
}

function WeeklyCard({ report }: { report: WeeklyReport }) {
  return (
    <div className="bg-gray-50 rounded-xl p-5 flex flex-col gap-3 h-fit">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-serif text-[15px] font-medium text-gray-900 leading-snug">
          {report.title}
        </h3>
        <span className="font-mono text-[9px] tracking-wide text-gray-300
          border border-gray-200 rounded-full px-2 py-1 whitespace-nowrap flex-shrink-0">
          {report.week}
        </span>
      </div>

      <div className="h-px bg-gray-200" />

      <ul className="flex flex-col gap-2.5">
        {report.bullets.map((point, i) => (
          <li key={i} className="flex gap-2 items-start">
            <span className="w-1 h-1 rounded-full bg-gray-300 mt-[7px] flex-shrink-0" />
            <p className="text-[12px] text-gray-500 leading-relaxed">{point}</p>
          </li>
        ))}
      </ul>

      <div className="h-px bg-gray-200" />

      {report.url ? (
        <Link
          href={report.url}
          className="font-mono text-[10px] text-gray-300 tracking-wide
            hover:text-gray-500 transition-colors inline-flex items-center gap-1"
        >
          阅读完整周报 →
        </Link>
      ) : (
        <span className="font-mono text-[10px] text-gray-200 tracking-wide">
          阅读完整周报 →
        </span>
      )}
    </div>
  )
}

// ─── 主页 ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const { news, weekly } = await getHomeData()

  return (
    <main className="max-w-3xl mx-auto px-5 pb-16">

      {/* ── 导航 ─────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between py-5
        border-b border-gray-100 mb-0 flex-wrap gap-3">
        <div className="font-serif text-lg font-medium text-gray-900 tracking-tight">
          明镜<span className="text-gray-400 font-normal">财经</span>
        </div>
        <div className="flex items-center gap-5 flex-wrap">
          {[
            { label: '金融新闻', href: '/news' },
            { label: '每日一卦', href: '/fortune' },
            { label: '周报',     href: '/weekly' },
            { label: '关于我们', href: '/about' },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-[12px] text-gray-400 hover:text-gray-700
                transition-colors tracking-wide"
            >
              {label}
            </Link>
          ))}
          <Link
            href={process.env.NEXT_PUBLIC_OPEN_ACCOUNT_URL ?? '#'}
            className="text-[11px] text-gray-700 border border-gray-300 rounded
              px-3.5 py-1.5 hover:bg-gray-50 transition-all tracking-wide"
          >
            立即开户 →
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="py-12 border-b border-gray-100 max-w-lg">
        <p className="font-mono text-[10px] tracking-[0.16em] text-gray-300 mb-4">
          面向散户的金融资讯平台
        </p>
        <h1 className="font-serif text-3xl font-normal leading-snug text-gray-900 mb-4">
          万象皆声，<em className="italic text-gray-400">唯静者能听</em>
        </h1>
        <p className="text-[13px] text-gray-400 leading-relaxed mb-6 max-w-md">
          我们为普通投资者提供简洁、及时、不废话的市场资讯与交易参考。
          AI摘要精华，每日更新，帮你在噪音中找到信号。
        </p>
        <div className="flex items-center gap-4 flex-wrap">
          <Link
            href={process.env.NEXT_PUBLIC_OPEN_ACCOUNT_URL ?? '#'}
            className="text-[13px] font-medium text-gray-800 border border-gray-300
              rounded-md px-5 py-2.5 hover:bg-gray-50 transition-all"
          >
            立即开户
          </Link>
          <Link
            href="/about"
            className="font-mono text-[11px] text-gray-300 tracking-wide
              hover:text-gray-500 transition-colors"
          >
            了解更多 →
          </Link>
        </div>
      </section>

      {/* ── 数据统计 ──────────────────────────────────────────── */}
      <div className="grid grid-cols-3 border border-gray-100 rounded-lg
        overflow-hidden my-8 divide-x divide-gray-100">
        {[
          { val: '20+', label: '每日精选新闻' },
          { val: 'AI',  label: '智能摘要' },
          { val: '周报', label: '每周深度复盘' },
        ].map(({ val, label }) => (
          <div key={label} className="px-5 py-4 bg-white">
            <div className="font-serif text-xl font-medium text-gray-800 mb-0.5">
              {val}
            </div>
            <div className="font-mono text-[10px] text-gray-300 tracking-wide">
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* ── 关于我们 ──────────────────────────────────────────── */}
      <section className="pb-8 border-b border-gray-100">
        <SectionHeader label="关于我们" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              icon: (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="9"/>
                  <path d="M12 8v4l3 3"/>
                </svg>
              ),
              title: '实时资讯',
              desc: '聚合全球主流财经媒体，AI自动摘要，第一时间掌握市场动态。',
            },
            {
              icon: (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 4-6"/>
                </svg>
              ),
              title: '专业分析',
              desc: '每周深度复盘，涵盖宏观走势、板块轮动与关键技术位。',
            },
            {
              icon: (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              ),
              title: '合规经营',
              desc: '持牌运营，受监管机构监督，资金安全有保障，透明费率。',
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-gray-50 rounded-lg p-4">
              <div className="w-7 h-7 rounded-full bg-white border border-gray-200
                flex items-center justify-center text-gray-400 mb-3">
                {icon}
              </div>
              <h3 className="font-serif text-[14px] font-medium text-gray-800 mb-1.5">
                {title}
              </h3>
              <p className="text-[12px] text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 新闻 + 周报（双栏）───────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-8 py-8">

        {/* 新闻列表 */}
        <div>
          <SectionHeader label="最新新闻" right={
            <Link href="/news"
              className="font-mono text-[10px] text-gray-300 hover:text-gray-500
                transition-colors tracking-wide">
              查看全部 →
            </Link>
          } />
          <div>
            {news.map(item => <NewsCard key={item.id} item={item} />)}
          </div>
        </div>

        {/* 周报 */}
        <div>
          <SectionHeader label="本周周报" />
          <WeeklyCard report={weekly} />
        </div>

      </div>

      {/* ── 开户召唤 ──────────────────────────────────────────── */}
      <div className="border border-gray-100 rounded-xl px-6 py-5
        flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-serif text-[16px] font-medium text-gray-900 mb-1">
            准备好开始交易了吗？
          </h3>
          <p className="text-[12px] text-gray-400">
            开户流程简单，最快5分钟完成，即可访问全球市场
          </p>
        </div>
        <Link
          href={process.env.NEXT_PUBLIC_OPEN_ACCOUNT_URL ?? '#'}
          className="text-[13px] font-medium text-gray-800 border border-gray-300
            rounded-md px-5 py-2.5 hover:bg-gray-50 transition-all whitespace-nowrap"
        >
          立即开户 →
        </Link>
      </div>

      {/* ── 页脚 ──────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 mt-8 pt-5
        flex items-center justify-between flex-wrap gap-3">
        <p className="text-[11px] text-gray-300">
          © 2026 明镜财经 · 投资有风险，入市需谨慎
        </p>
        <div className="flex gap-4">
          {['隐私政策', '使用条款', '联系我们'].map(t => (
            <Link key={t} href="#"
              className="text-[11px] text-gray-300 hover:text-gray-500 transition-colors">
              {t}
            </Link>
          ))}
        </div>
      </footer>

    </main>
  )
}

// ─── 工具组件 ─────────────────────────────────────────────────────────────────

function SectionHeader({
  label, right,
}: { label: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="font-mono text-[10px] tracking-[0.14em] text-gray-300 whitespace-nowrap">
        {label}
      </span>
      <span className="flex-1 h-px bg-gray-100" />
      {right}
    </div>
  )
}

// ─── 开发占位数据（上线前删除）────────────────────────────────────────────────

const MOCK_DATA: HomePageData = {
  news: [
    { id:1, title:'Global cooperation on stablecoins critically important, BIS says',
      source:'REUTERS', time:'5分钟前', sentiment:'中性', impact:'高影响' },
    { id:2, title:'Buy HDFC Bank; target of Rs 1100 — Motilal Oswal',
      source:'MONEYCONTROL', time:'9分钟前', sentiment:'积极', impact:'中等影响' },
    { id:3, title:'Fed officials signal patience on rate cuts amid persistent inflation data',
      source:'WSJ', time:'38分钟前', sentiment:'中性', impact:'高影响' },
    { id:4, title:'Gold hits all-time high as safe-haven demand accelerates',
      source:'BLOOMBERG', time:'1小时前', sentiment:'积极', impact:'中等影响' },
    { id:5, title:'Oil rebound drags India bonds lower, focus shifts to US-Iran ceasefire',
      source:'REUTERS', time:'1小时前', sentiment:'消极', impact:'高影响' },
  ],
  weekly: {
    week: '2026 W16',
    title: '4月第三周市场复盘',
    bullets: [
      '美联储鹰派信号持续压制风险资产，纳指单周回调2.3%，市场等待PCE数据确认通胀走势。',
      '黄金突破历史高位3,300美元，避险情绪主导，地缘局势推动资金持续流入贵金属。',
      'BTC ETF连续净流入创周度纪录，机构配置加速，加密市场情绪回暖，关注8.5万关键阻力。',
      '下周重点关注：美联储官员讲话、科技股财报季启动（微软、Alphabet）、非农预期。',
    ],
  },
}
