import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Award, Target, BarChart2 } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import './BestIndicatorToday.css';

const BestIndicatorToday = ({ onClose, data }) => {
  const [showContent, setShowContent] = useState(false);
  const { currentLanguage } = useLanguage();
  const isEnglish = currentLanguage === 'en';

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    onClose();
  };

  const indicatorIcons = {
    RSI: <BarChart2 size={60} />,
    MACD: <TrendingUp size={60} />,
    BOLL: <Target size={60} />,
    KDJ: <Award size={60} />
  };

  const indicatorColors = {
    RSI: '#FF6B6B',
    MACD: '#4ECDC4',
    BOLL: '#45B7D1',
    KDJ: '#96CEB4'
  };

  return (
    <AnimatePresence>
      <motion.div
        className="best-indicator-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="best-indicator-container"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.2
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            className="star-burst"
            animate={{
              rotate: 360,
              scale: [1, 1.2, 1]
            }}
            transition={{
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity }
            }}
          />

          <motion.div
            className="best-indicator-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              className="crown-icon"
              animate={{
                y: [-5, 5, -5],
                rotate: [-5, 5, -5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Award size={40} color="gold" />
            </motion.div>

            <h1 className="best-indicator-title">
              {isEnglish ? "Today's Best Indicator" : '今日最佳指标'}
            </h1>

            {data?.interval && (
              <p style={{
                fontSize: '1.1rem',
                color: '#718096',
                marginTop: '-10px',
                marginBottom: '20px',
                fontWeight: '500'
              }}>
                {isEnglish ? `For ${data.interval} timeframe` : `${data.interval} 时间周期`}
              </p>
            )}

            <motion.div
              className="indicator-showcase"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: "spring" }}
              style={{
                background: `linear-gradient(135deg, ${indicatorColors[data?.name] || '#4ECDC4'}22, ${indicatorColors[data?.name] || '#4ECDC4'}11)`
              }}
            >
              <div className="indicator-icon" style={{ color: indicatorColors[data?.name] || '#4ECDC4' }}>
                {indicatorIcons[data?.name] || <TrendingUp size={60} />}
              </div>
              <h2 className="indicator-name">{data?.name}</h2>

              <div className="stats-grid">
                <motion.div
                  className="stat-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 }}
                >
                  <span className="stat-label">
                    {isEnglish ? 'Accuracy' : '准确率'}
                  </span>
                  <span className="stat-value">{data?.accuracy}%</span>
                </motion.div>

                <motion.div
                  className="best-indicator-stat-item"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.1 }}
                >
                  <span className="stat-label">
                    {isEnglish ? 'Win Rate' : '胜率'}
                  </span>
                  <span className="stat-value">{data?.winRate}%</span>
                </motion.div>

                <motion.div
                  className="best-indicator-stat-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 }}
                >
                  <span className="stat-label">
                    {isEnglish ? 'Signals' : '信号数'}
                  </span>
                  <span className="stat-value">{data?.signals}</span>
                </motion.div>

                <motion.div
                  className="best-indicator-stat-item"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.3 }}
                >
                  <span className="stat-label">
                    {isEnglish ? 'Overall Score' : '综合评分'}
                  </span>
                  <span className="stat-value stat-value--score">{data?.score}</span>
                </motion.div>
              </div>
            </motion.div>

            <motion.p
              className="indicator-description"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              {isEnglish
                ? `Based on today's market analysis, ${data?.name} indicator performs the best. It is recommended to focus on its trading signals.`
                : `基于今日市场行情分析，${data?.name} 指标表现最佳，建议重点关注该指标的交易信号。`
              }
            </motion.p>

            <motion.button
              className="continue-button"
              onClick={handleClose}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8 }}
            >
              {isEnglish ? 'Start Using' : '开始使用'}
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BestIndicatorToday;
