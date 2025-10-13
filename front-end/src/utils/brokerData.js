// Shared broker data helpers used across the homepage and Broker Hub
const BREAKDOWN_TRANSLATIONS = {
  '监管强度': 'brokerHub.ratingBreakdown.regulation',
  '透明度与合规': 'brokerHub.ratingBreakdown.transparency',
  '交易成本': 'brokerHub.ratingBreakdown.tradingCost',
  '执行与流动性': 'brokerHub.ratingBreakdown.execution',
  '平台与产品': 'brokerHub.ratingBreakdown.platform',
  '服务与教育': 'brokerHub.ratingBreakdown.service',
  '稳定性与口碑': 'brokerHub.ratingBreakdown.stability'
};

const LETTER_GRADE_SCORE = {
  'A++': 98,
  'A+': 95,
  A: 92,
  'A-': 88,
  'B+': 84,
  B: 80,
  'B-': 76,
  'C+': 72,
  C: 68,
  'C-': 64
};

const REGULATOR_INFO = {
  ASIC: {
    name: 'Australian Securities and Investments Commission',
    url: 'https://asic.gov.au/'
  },
  FCA: {
    name: 'Financial Conduct Authority (UK)',
    url: 'https://www.fca.org.uk/'
  },
  CYSEC: {
    name: 'Cyprus Securities and Exchange Commission',
    url: 'https://www.cysec.gov.cy/'
  },
  FMA: {
    name: 'Financial Markets Authority (New Zealand)',
    url: 'https://www.fma.govt.nz/'
  },
  FSA: {
    name: 'Financial Services Authority (Seychelles)',
    url: 'https://fsaseychelles.sc/'
  },
  LFSA: {
    name: 'Labuan Financial Services Authority',
    url: 'https://www.labuanfsa.gov.my/'
  },
  VFSC: {
    name: 'Vanuatu Financial Services Commission',
    url: 'https://www.vfsc.vu/'
  },
  FSC: {
    name: 'Financial Services Commission (Mauritius)',
    url: 'https://www.fscmauritius.org/'
  },
  CMA: {
    name: 'Capital Markets Authority (Kenya)',
    url: 'https://www.cma.or.ke/'
  },
  CBCS: {
    name: 'Central Bank of Curaçao and Sint Maarten',
    url: 'https://www.centralbank.cw/'
  },
  MAS: {
    name: 'Monetary Authority of Singapore',
    url: 'https://www.mas.gov.sg/'
  },
  CIMA: {
    name: 'Cayman Islands Monetary Authority',
    url: 'https://www.cima.ky/'
  }
};

const REGULATOR_ALIASES = {
  VFSCN: 'VFSC',
  FSA_SEYCHELLES: 'FSA',
  MAURITIUS_FSC: 'FSC',
  CAYMAN: 'CIMA'
};

export const parseRegulators = (rawRegulators, rawDetails) => {
  const normalizeCode = (value) => {
    if (!value) return null;
    const upper = String(value).trim().toUpperCase();
    return REGULATOR_ALIASES[upper] || upper;
  };

  const seen = new Set();
  const buildEntry = (code, source = {}) => {
    if (!code) return null;
    const normalized = normalizeCode(code);
    if (!normalized) return null;
    const dedupeKey = `${normalized}|${source.license || ''}`;
    if (seen.has(dedupeKey)) return null;
    seen.add(dedupeKey);
    const info = REGULATOR_INFO[normalized];
    return {
      code: normalized,
      name: info?.name || source.name || source.regulator || code,
      url: info?.url || source.url || null,
      license: source.license || null,
      note: source.notes || source.note || null
    };
  };

  const fromDetails = Array.isArray(rawDetails)
    ? rawDetails
        .map((item) => {
          const candidate = buildEntry(item?.code || item?.regulator || item?.name, item);
          return candidate;
        })
        .filter(Boolean)
    : [];

  if (fromDetails.length > 0) {
    return fromDetails;
  }

  if (!rawRegulators) return [];

  return rawRegulators
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((code) => buildEntry(code, { name: code }))
    .filter(Boolean);
};

export const gradeToScore = (grade) => {
  if (!grade) return null;
  const normalized = grade.trim().toUpperCase();
  return LETTER_GRADE_SCORE[normalized] ?? null;
};

export const computeCompositeScore = (breakdown) => {
  if (!breakdown || typeof breakdown !== 'object') return null;
  let weighted = 0;
  let totalWeight = 0;
  let fallbackTotal = 0;
  let fallbackCount = 0;

  for (const value of Object.values(breakdown)) {
    if (value == null) continue;
    const score = typeof value === 'object' ? Number(value.score ?? value.value) : Number(value);
    if (!Number.isFinite(score)) continue;
    if (typeof value === 'object' && Number.isFinite(Number(value.weight))) {
      const weight = Number(value.weight);
      weighted += score * weight;
      totalWeight += weight;
    } else {
      fallbackTotal += score;
      fallbackCount += 1;
    }
  }

  if (totalWeight > 0) {
    return Math.round(weighted / totalWeight);
  }
  if (fallbackCount > 0) {
    return Math.round(fallbackTotal / fallbackCount);
  }
  return null;
};

export const parseBreakdownEntries = (breakdown, translate) => {
  if (!breakdown || typeof breakdown !== 'object') return [];
  return Object.entries(breakdown)
    .map(([rawKey, value]) => {
      const translationKey = BREAKDOWN_TRANSLATIONS[rawKey];
      const label = translationKey ? translate(translationKey) : rawKey;
      const score = typeof value === 'object' ? Number(value.score ?? value.value) : Number(value);
      if (!Number.isFinite(score)) return null;
      return {
        key: rawKey,
        label,
        score: Math.round(score)
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
};

export const formatRelativeTime = (value, language) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const now = Date.now();
  const diffSeconds = Math.round((date.getTime() - now) / 1000);
  const absSeconds = Math.abs(diffSeconds);
  const locale = language === 'zh-CN' ? 'zh-CN' : 'en';
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (absSeconds < 60) return formatter.format(diffSeconds, 'second');
  const minutes = Math.round(diffSeconds / 60);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour');
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 7) return formatter.format(days, 'day');
  const weeks = Math.round(days / 7);
  if (Math.abs(weeks) < 5) return formatter.format(weeks, 'week');
  const months = Math.round(days / 30);
  if (Math.abs(months) < 12) return formatter.format(months, 'month');
  const years = Math.round(days / 365);
  return formatter.format(years, 'year');
};

export const formatWebsiteHost = (url) => {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return url;
  }
};
