export function generateFortune(currentLanguage, translate) {
  const lang = currentLanguage === 'zh-CN' ? 'zh-CN' : 'en';
  const today = new Date();
  const key = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  let seed = 17;
  for (const ch of key) {
    seed = (seed * 31 + ch.charCodeAt(0)) % 9973;
  }
  const pick = (arr, offset = 0) => arr[(seed + offset) % arr.length];

  const tierOptions = [
    {
      id: 'lucky',
      label: translate('home.fortune.tier.lucky'),
      verdict: lang === 'zh-CN'
        ? '宜轻仓顺势，气顺财到。'
        : 'Green light for a small, trend-following entry.',
      accent: 'lucky'
    },
    {
      id: 'balanced',
      label: translate('home.fortune.tier.balanced'),
      verdict: lang === 'zh-CN'
        ? '静守多看，等一根确认K。'
        : 'Stay observant and wait for a clean confirmation candle.',
      accent: 'balanced'
    },
    {
      id: 'cautious',
      label: translate('home.fortune.tier.cautious'),
      verdict: lang === 'zh-CN'
        ? '少动手，护住子弹，先做功课。'
        : 'Hands light; protect capital and sharpen the plan.',
      accent: 'cautious'
    }
  ];

  const qiIndex = 62 + (seed % 34); // 62-95 to avoid extremes

  const qiNarratives = [
    {
      label: lang === 'zh-CN' ? '水木相生' : 'Water & Wood in flow',
      tip: lang === 'zh-CN' ? '顺势走，轻仓试探。' : 'Follow the current with small probes.'
    },
    {
      label: lang === 'zh-CN' ? '火土相融' : 'Fire warms Earth',
      tip: lang === 'zh-CN' ? '敢于止盈，别恋战。' : 'Take profits; avoid overtrading.'
    },
    {
      label: lang === 'zh-CN' ? '金气收敛' : 'Metal consolidates',
      tip: lang === 'zh-CN' ? '仓位收一收，等突破。' : 'Tighten size, wait for breakout.'
    },
    {
      label: lang === 'zh-CN' ? '风来无声' : 'Silent wind',
      tip: lang === 'zh-CN' ? '多看少动，守住节奏。' : 'Observe more, move less to keep rhythm.'
    }
  ];

  const amulets = [
    {
      label: lang === 'zh-CN' ? '紫微稳心符' : 'Purple Star calm',
      tip: lang === 'zh-CN' ? '盯风险，不盯盈亏。' : 'Watch risk, not PnL.'
    },
    {
      label: lang === 'zh-CN' ? '青龙护仓符' : 'Azure Dragon shield',
      tip: lang === 'zh-CN' ? '止损别拖，尊重计划。' : 'Respect stops; no dragging feet.'
    },
    {
      label: lang === 'zh-CN' ? '白虎醒脑符' : 'White Tiger focus',
      tip: lang === 'zh-CN' ? '只做熟悉的标的。' : 'Trade only the pairs you know.'
    },
    {
      label: lang === 'zh-CN' ? '玄武聚气符' : 'Black Tortoise patience',
      tip: lang === 'zh-CN' ? '等候慢线拐头。' : 'Wait for slow MAs to curl.'
    }
  ];

  const rituals = [
    lang === 'zh-CN' ? '晨间回顾复盘，写下入场条件' : 'Morning review and rewrite your entry rules',
    lang === 'zh-CN' ? '只下计划内的一笔' : 'Place only the trade you planned',
    lang === 'zh-CN' ? '盯一次4H级别的节奏' : 'Check the 4H rhythm once',
    lang === 'zh-CN' ? '把止盈止损同时挂好' : 'Set take-profit and stop together',
    lang === 'zh-CN' ? '喝口热茶再动手' : 'Sip something warm before clicking buy'
  ];

  const taboos = [
    lang === 'zh-CN' ? '情绪化加仓' : 'Revenge or emotion-driven sizing',
    lang === 'zh-CN' ? '见红就补' : 'Averaging down blindly',
    lang === 'zh-CN' ? '跨品种乱切换' : 'Jumping instruments mid-plan',
    lang === 'zh-CN' ? '忽视大级别趋势' : 'Ignoring higher timeframe drift',
    lang === 'zh-CN' ? '交易时刷社交媒体' : 'Trading while doomscrolling'
  ];

  const directions = [
    lang === 'zh-CN' ? '正东 · 木旺' : 'East · Wood qi',
    lang === 'zh-CN' ? '东南 · 风生水起' : 'Southeast · Wind & water rising',
    lang === 'zh-CN' ? '正北 · 水润财源' : 'North · Water fuels flow',
    lang === 'zh-CN' ? '西南 · 土稳心定' : 'Southwest · Earth steadies heart',
    lang === 'zh-CN' ? '正西 · 金气敛锋' : 'West · Metal tempers edge'
  ];

  const notes = [
    lang === 'zh-CN' ? '今日宜做“气氛组”，不抢C位。' : 'Be the vibe, not the hero today.',
    lang === 'zh-CN' ? '小胜即收，莫贪下一根。' : 'Bank the small win; skip the next candle.',
    lang === 'zh-CN' ? '把亏损日当成缴学费，保持记录。' : 'Treat red days as tuition—log everything.',
    lang === 'zh-CN' ? '若心浮，先离屏十分钟。' : 'If you feel jumpy, take a 10-minute screen break.'
  ];

  const tier = tierOptions[seed % tierOptions.length];

  return {
    tier,
    qiIndex,
    qi: pick(qiNarratives, 1),
    amulet: pick(amulets, 2),
    ritual: pick(rituals, 3),
    taboo: pick(taboos, 4),
    direction: pick(directions, 5),
    note: pick(notes, 6)
  };
}

const defaultFortuneShape = (translate, currentLanguage) => ({
  tier: {
    id: 'balanced',
    label: translate('home.fortune.tier.balanced'),
    verdict: translate('home.fortune.subtitle'),
    accent: 'balanced'
  },
  qiIndex: 72,
  qi: { label: '风来无声', tip: '' },
  amulet: { label: '紫微稳心符', tip: '' },
  ritual: translate('home.fortune.fields.ritual'),
  taboo: translate('home.fortune.fields.avoid'),
  direction: currentLanguage === 'zh-CN' ? '正东' : 'East',
  note: ''
});

function mapApiFortune(apiData, translate, currentLanguage) {
  const lang = currentLanguage === 'zh-CN' ? 'zh-CN' : 'en';
  const tierLevel = (apiData?.tier_level || apiData?.tier || 'balanced').toLowerCase();
  const accent = ['lucky', 'balanced', 'cautious'].includes(tierLevel) ? tierLevel : 'balanced';
  const defaults = defaultFortuneShape(translate, currentLanguage);

  return {
    tier: {
      id: accent,
      accent,
      label: apiData?.tier_label || defaults.tier.label,
      verdict: apiData?.verdict || defaults.tier.verdict
    },
    qiIndex: Number.isFinite(apiData?.qi_index) ? apiData.qi_index : defaults.qiIndex,
    qi: {
      label: apiData?.qi_label || defaults.qi.label,
      tip: apiData?.qi_tip || defaults.qi.tip
    },
    amulet: {
      label: apiData?.amulet_label || defaults.amulet.label,
      tip: apiData?.amulet_tip || defaults.amulet.tip
    },
    ritual: apiData?.ritual || defaults.ritual,
    taboo: apiData?.taboo || defaults.taboo,
    direction: apiData?.direction || defaults.direction,
    note: apiData?.note || defaults.note
  };
}

export async function fetchDailyFortuneFromApi(translate, currentLanguage) {
  try {
    const res = await fetch('/api/fortune/daily');
    if (!res.ok) return null;
    const json = await res.json();
    if (!json?.success || !json?.data) return null;
    return mapApiFortune(json.data, translate, currentLanguage);
  } catch (e) {
    console.warn('Failed to fetch daily fortune:', e);
    return null;
  }
}
