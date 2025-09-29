import { API_BASE_URL } from '../config/api.js';

const brokerComparisonService = {
  // 对比选中的brokers
  compareBrokers: async (brokerIds) => {
    const response = await fetch(`${API_BASE_URL}/api/cfd/brokers/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(brokerIds),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    return response.json();
  },

  // 获取可用的对比字段
  getComparisonFields: async () => {
    const response = await fetch(`${API_BASE_URL}/api/cfd/brokers/compare-fields`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  },

  // 格式化对比数据用于显示
  formatComparisonData: (comparisonData) => {
    if (!comparisonData) return null;

    const { brokers, comparison_fields, best_in_category, summary } = comparisonData;
    const formatRegulators = (broker) => {
      if (Array.isArray(broker.regulator_details) && broker.regulator_details.length > 0) {
        return broker.regulator_details
          .map((item) => {
            const code = item.code || item.regulator;
            if (!code) return null;
            return item.license ? `${code} (${item.license})` : code;
          })
          .filter(Boolean)
          .join(', ');
      }
      return broker.regulators || 'N/A';
    };

    // 创建对比表格数据
    const tableData = [];

    // 基本信息行
    tableData.push({
      category: 'basic_info',
      label: '基本信息',
      rows: [
        {
          field: 'name',
          label: '经纪商名称',
          values: brokers.map(broker => ({
            brokerId: broker.id,
            value: broker.name,
            isText: true
          }))
        },
        {
          field: 'rating',
          label: '总体评级',
          values: brokers.map(broker => ({
            brokerId: broker.id,
            value: broker.rating || 'N/A',
            isBest: best_in_category.overall_rating === broker.id,
            isGrade: true
          }))
        },
        {
          field: 'website',
          label: '官方网站',
          values: brokers.map(broker => ({
            brokerId: broker.id,
            value: broker.website || 'N/A',
            isUrl: true
          }))
        }
      ]
    });

    // 监管信息行
    tableData.push({
      category: 'regulatory_info',
      label: '监管信息',
      rows: [
        {
          field: 'regulators',
          label: '监管机构',
          values: brokers.map(broker => ({
            brokerId: broker.id,
            value: formatRegulators(broker) || 'N/A',
            isText: true
          }))
        },
        {
          field: 'regulatory_count',
          label: '监管机构数量',
          values: brokers.map(broker => {
            const count = Array.isArray(broker.regulator_details) && broker.regulator_details.length > 0
              ? broker.regulator_details.length
              : broker.regulators
                ? broker.regulators.split(',').length
                : 0;
            return {
              brokerId: broker.id,
              value: count,
              isBest: best_in_category.regulatory_count === broker.id,
              isNumber: true
            };
          })
        }
      ]
    });

    // 评级细分行
    const breakdownCategories = [
      { key: '监管强度', label: '监管强度' },
      { key: '透明度与合规', label: '透明度与合规' },
      { key: '交易成本', label: '交易成本' },
      { key: '执行与流动性', label: '执行与流动性' },
      { key: '平台与产品', label: '平台与产品' },
      { key: '服务与教育', label: '服务与教育' },
      { key: '稳定性与口碑', label: '稳定性与口碑' }
    ];

    const ratingBreakdownRows = breakdownCategories.map(category => ({
      field: category.key,
      label: category.label,
      values: brokers.map(broker => {
        const breakdown = broker.rating_breakdown;
        let score = 'N/A';

        if (breakdown && breakdown[category.key]) {
          const scoreData = breakdown[category.key];
          if (typeof scoreData === 'object') {
            score = scoreData.score || scoreData.value || 'N/A';
          } else {
            score = scoreData;
          }
        }

        return {
          brokerId: broker.id,
          value: score,
          isBest: best_in_category[category.key] === broker.id,
          isScore: true
        };
      })
    }));

    tableData.push({
      category: 'rating_breakdown',
      label: '评级细分',
      rows: ratingBreakdownRows
    });

    return {
      brokers,
      tableData,
      bestInCategory: best_in_category,
      summary,
      metadata: {
        totalComparisons: brokers.length,
        hasRatingBreakdown: brokers.some(b => b.rating_breakdown),
        uniqueRegulators: summary.unique_regulators
      }
    };
  },

  // 生成对比总结
  generateComparisonSummary: (formattedData) => {
    if (!formattedData) return '';

    const { brokers, summary, bestInCategory } = formattedData;

    let summaryText = `对比了 ${summary.total_brokers} 家经纪商，`;

    if (summary.rated_brokers > 0) {
      summaryText += `其中 ${summary.rated_brokers} 家有评级信息。`;
    }

    if (summary.unique_regulators > 0) {
      summaryText += `涉及 ${summary.unique_regulators} 个不同的监管机构。`;
    }

    // 找出综合表现最佳的broker
    if (bestInCategory.overall_rating) {
      const bestBroker = brokers.find(b => b.id === bestInCategory.overall_rating);
      if (bestBroker) {
        summaryText += `总体评级最高的是 ${bestBroker.name}。`;
      }
    }

    return summaryText;
  }
};

export default brokerComparisonService;
