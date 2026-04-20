import { useState, useEffect, useRef } from "react";

const STORIES = [
  {
    id: "govt",
    emoji: "\uD83C\uDFE0",
    title: "\u7F8E\u56FD\u653F\u5E9C\uFF1A\u4E00\u4E2A\u5165\u4E0D\u6577\u51FA\u7684\u201C\u5BB6\u5EAD\u201D",
    simple: "\u60F3\u8C61\u4E00\u4E2A\u5BB6\u5EAD\uFF1A\u6BCF\u5E74\u8D5A100\u4E07\u5374\u82B1\u4E86106\u4E07\u3002\u5DEE\u76846\u4E07\u9760\u5237\u4FE1\u7528\u5361\u3002\u8FD9\u5DF2\u7ECF\u6301\u7EED\u4E86\u5341\u51E0\u5E74\u3002",
    detail: "\u7F8E\u56FD\u8054\u90A6\u653F\u5E9C2026\u5E74\u8D64\u5B57\u9884\u8BA11.9\u4E07\u4EBF\u7F8E\u5143\uFF08\u5360GDP\u76845.8%\uFF09\u3002\u56FD\u503A\u603B\u989D\u5DF2\u8FBE36\u4E07\u4EBF\u7F8E\u5143\uFF0C\u76F8\u5F53\u4E8E\u6BCF\u4E2A\u7F8E\u56FD\u4EBA\u80CC\u8D1F\u7EA610.8\u4E07\u7F8E\u5143\u3002",
    danger: 3,
    color: "#e67e22",
    bgLight: "#fef3e2",
  },
  {
    id: "creditcard",
    emoji: "\uD83D\uDCB3",
    title: "\u5929\u91CF\u4FE1\u7528\u5361\u8981\u8FD8\uFF1A\u6BCF\u5E749\u4E07\u4EBF\u5230\u671F",
    simple: "\u8FD9\u4E2A\u5BB6\u5EAD\u4E4B\u524D\u53D1\u7684\u4FE1\u7528\u5361\u9646\u7EED\u5230\u671F\u4E86\u2014\u2014\u6BCF\u5E74\u8981\u8FD89\u4E07\u4EBF\u3002\u95EE\u9898\u662F\uFF0C\u5B83\u53EA\u80FD\u501F\u65B0\u8FD8\u65E7\u3002\u5982\u679C\u65B0\u8D37\u6B3E\u5229\u606F\u6DA8\u4E86\uFF0C\u538B\u529B\u5C31\u5DE8\u5927\u3002",
    detail: "2026-2028\u5E74\u5171\u6709\u7EA615\u4E07\u4EBF\u7F8E\u5143\u56FD\u503A\u5230\u671F\u9700\u518D\u878D\u8D44\u3002\u5229\u7387\u5DF2\u4ECE2021\u5E74\u76841.6%\u7FFB\u5230\u52303.4%\u3002\u5149\u5229\u606F\u6BCF\u5E74\u5C31\u8981\u8FD8\u8FD11\u4E07\u4EBF\u2014\u2014\u5DF2\u7ECF\u8D85\u8FC7\u4E86\u56FD\u9632\u5F00\u652F\u3002",
    danger: 4,
    color: "#e74c3c",
    bgLight: "#fdeaea",
  },
  {
    id: "casino",
    emoji: "\uD83C\uDFB0",
    title: "\u534E\u5C14\u8857\u7684\u201C\u8D85\u7EA7\u8D4C\u5C40\u201D\uFF1A\u57FA\u5DEE\u4EA4\u6613",
    simple: "\u6709\u4E9B\u5927\u73A9\u5BB6\u53D1\u73B0\u4E86\u4E00\u4E2A\u201C\u7A33\u8D5A\u201D\u7684\u5C0F\u5DEE\u4EF7\uFF0C\u4E8E\u662F\u501F\u4E8650-100\u500D\u7684\u94B1\u53BB\u8D4C\u3002\u8D62\u4E86\u8D5A\u4E00\u70B9\u70B9\uFF0C\u4F46\u5982\u679C\u98CE\u5411\u4E00\u53D8\uFF0C\u8D54\u5149\u7684\u901F\u5EA6\u6BD4\u7FFB\u8239\u8FD8\u5FEB\u3002",
    detail: "\u5BF9\u51B2\u57FA\u91D1\u7684\u201C\u57FA\u5DEE\u4EA4\u6613\u201D\u89C4\u6A21\u8D85\u8FC71\u4E07\u4EBF\u7F8E\u5143\uFF0C\u6760\u6746\u9AD8\u8FBE50-100\u500D\u30022020\u5E743\u6708\u5E02\u573A\u6050\u614C\u65F6\uFF0C\u7C7B\u4F3C\u4EA4\u6613\u7684\u5D29\u76D8\u8FEB\u4F7F\u7F8E\u8054\u50A8\u4E0D\u5F97\u4E0D\u7D27\u6025\u4E70\u51653600\u4EBF\u7F8E\u5143\u56FD\u503A\u6765\u6551\u5E02\u3002\u73B0\u5728\u89C4\u6A21\u6BD4\u90A3\u65F6\u8FD8\u592750%\u3002",
    danger: 5,
    color: "#e74c3c",
    bgLight: "#fdeaea",
  },
  {
    id: "blood",
    emoji: "\uD83E\uDE78",
    title: "\u201C\u56DE\u8D2D\u5E02\u573A\u201D\u2014\u2014\u91D1\u878D\u7CFB\u7EDF\u7684\u8840\u6DB2",
    simple: "\u94F6\u884C\u548C\u91D1\u878D\u673A\u6784\u4E4B\u95F4\u6BCF\u5929\u8981\u4E92\u76F8\u77ED\u671F\u501F\u94B1\u5468\u8F6C\uFF0C\u5C31\u50CF\u4EBA\u4F53\u7684\u8840\u6DB2\u5FAA\u73AF\u3002\u5982\u679C\u8FD9\u4E2A\u201C\u5FAA\u73AF\u201D\u5835\u4F4F\u4E86\uFF0C\u6574\u4E2A\u7CFB\u7EDF\u5C31\u4F1A\u7F3A\u6C27\u4F11\u514B\u3002",
    detail: "\u56DE\u8D2D\u5E02\u573A\u6BCF\u5929\u6570\u4E07\u4EBF\u7F8E\u5143\u7684\u8D44\u91D1\u5728\u6D41\u52A8\u30022025\u5E749-10\u6708\uFF0C\u5173\u952E\u5229\u7387\u6307\u6807\u5DF2\u591A\u6B21\u7A81\u7834\u7F8E\u8054\u50A8\u8BBE\u5B9A\u7684\u4E0A\u9650\u2014\u2014\u5C31\u50CF\u8840\u538B\u53CD\u590D\u98D9\u9AD8\u7684\u5371\u9669\u4FE1\u53F7\u3002\u7F8E\u8054\u50A8\u88AB\u8FEB\u521B\u7EAA\u5F55\u5730\u6CE8\u5165\u4E86294\u4EBF\u7F8E\u5143\u7D27\u6025\u8D44\u91D1\u3002",
    danger: 4,
    color: "#c0392b",
    bgLight: "#fdeaea",
  },
  {
    id: "fire_dept",
    emoji: "\uD83D\uDE92",
    title: "\u7F8E\u8054\u50A8\uFF1A\u5FEB\u8981\u5E72\u4E0D\u52A8\u5FE7\u7684\u201C\u6D88\u9632\u961F\u201D",
    simple: "\u4EE5\u524D\u7740\u706B\u4E86\uFF0C\u6D88\u9632\u961F\uFF08\u7F8E\u8054\u50A8\uFF09\u53EF\u4EE5\u968F\u4FBF\u653E\u6C34\u3002\u4F46\u73B0\u5728\u5B83\u9762\u4E34\u4E00\u4E2A\u5C34\u5C2C\uFF1A\u7269\u4EF7\u8FD8\u5728\u6DA8\uFF08\u4E0D\u8BE5\u653E\u6C34\uFF09\uFF0C\u7ECF\u6D4E\u53C8\u8981\u51FA\u4E8B\u4E86\uFF08\u5FC5\u987B\u653E\u6C34\uFF09\u3002\u5DE6\u53F3\u4E3A\u96BE\u3002",
    detail: "\u7F8E\u8054\u50A8\u57282025\u5E7410\u6708\u88AB\u8FEB\u505C\u6B62\u201C\u7F29\u8868\u201D\uFF0C12\u6708\u53C8\u5F00\u59CB\u6BCF\u6708\u4E70\u5165400\u4EBF\u7F8E\u5143\u56FD\u503A\u2014\u2014\u867D\u7136\u5B98\u65B9\u8BF4\u201C\u8FD9\u4E0D\u662F\u653E\u6C34\u201D\uFF0C\u4F46\u5B9E\u8D28\u4E0A\u662F\u5728\u7ED9\u5E02\u573A\u8F93\u8840\u3002\u66F4\u9EBB\u70E6\u7684\u662F\uFF0C\u603B\u7EDF\u8FD8\u5728\u516C\u5F00\u65BD\u538B\u8981\u6C42\u964D\u606F\uFF0C\u5A01\u80C1\u7740\u592E\u884C\u7684\u72EC\u7ACB\u6027\u3002",
    danger: 4,
    color: "#e67e22",
    bgLight: "#fef3e2",
  },
  {
    id: "shadow",
    emoji: "\uD83D\uDD73\uFE0F",
    title: "\u5730\u4E0B\u91D1\u878D\uFF1A3.5\u4E07\u4EBF\u201C\u5F71\u5B50\u501F\u8D37\u201D",
    simple: "\u94F6\u884C\u4E4B\u5916\uFF0C\u6709\u4E00\u4E2A\u5DE8\u5927\u7684\u201C\u5730\u4E0B\u501F\u8D37\u201D\u5E02\u573A\u2014\u2014\u79C1\u4EBA\u4FE1\u8D37\u3002\u5B83\u4E0D\u50CF\u94F6\u884C\u90A3\u6837\u53D7\u4E25\u683C\u76D1\u7BA1\uFF0C\u5F88\u591A\u501F\u6B3E\u4EBA\u5176\u5B9E\u5DF2\u7ECF\u8FD8\u4E0D\u8D77\u94B1\u4E86\uFF0C\u4F46\u8D37\u6B3E\u8D26\u9762\u4E0A\u770B\u7740\u8FD8\u662F\u201C\u6B63\u5E38\u201D\u7684\u3002",
    detail: "\u5168\u7403\u79C1\u4EBA\u4FE1\u8D37\u5DF2\u8FBE3.5\u4E07\u4EBF\u7F8E\u5143\u3002IMF\u53D1\u73B040%\u7684\u501F\u6B3E\u4EBA\u5DF2\u51FA\u73B0\u8D1F\u73B0\u91D1\u6D41\u30022025\u5E74\u5DF2\u53D1\u751F\u591A\u8D77\u4E0B\u96F7\uFF1AFirst Brands\uFF08100\u4EBF\u7F8E\u5143\u6C7D\u8F66\u96F6\u90E8\u4EF6\u516C\u53F8\uFF09\u66B4\u9732\u8D22\u52A1\u6B3A\u8BC8\u3002Tricolor\uFF08\u6B21\u7EA7\u8D37\u6B3E\uFF098\u4EBF\u7F8E\u5143\u9ED8\u3002\u6469\u6839\u5927\u901ACEO\u8FBE\u8499\u8B66\u544A\uFF1A\u201C\u5F53\u4F60\u770B\u5230\u4E0D\u53EA\u87C0\u87B6\uFF0C\u8BF4\u660E\u8FD8\u6709\u66F4\u591A\u3002\u201D",
    danger: 4,
    color: "#8e44ad",
    bgLight: "#f4ecf7",
  },
  {
    id: "crypto_crash",
    emoji: "\uD83D\uDCC9",
    title: "\u52A0\u5BC6\u8D27\u5E01\u5D29\u76D8\uFF1A\u4E0D\u518D\u662F\u201C\u5C40\u5916\u4EBA\u201D",
    simple: "\u4EE5\u524D\u6BD4\u7279\u5E01\u6DA8\u8DCC\u8DDF\u80A1\u5E02\u6CA1\u592A\u5927\u5173\u7CFB\uFF0C\u73B0\u5728\u5B83\u4EEC\u201C\u7ED1\u5728\u4E86\u4E00\u8D77\u201D\u3002\u6BD4\u7279\u5E01\u66B4\u8DCC52%\uFF0C\u5F88\u591A\u901A\u8FC7\u94F6\u884C\u4E70\u4E86\u52A0\u5BC6\u4EA7\u54C1\u7684\u4EBA\u548C\u673A\u6784\u90FD\u88AB\u6CE2\u53CA\u3002",
    detail: "\u6BD4\u7279\u5E01\u4ECE12.6\u4E07\u8DCC\u81F36\u4E07\u7F8E\u5143\u3002\u66F4\u5173\u952E\u7684\u662F\uFF0C\u7A33\u5B9A\u5E01\uFF08USDT\u7B49\uFF09\u6301\u67091300\u4EBF\u7F8E\u5143\u7684\u7F8E\u56FD\u56FD\u503A\u3002\u5982\u679C\u4EBA\u4EEC\u6050\u614C\u6027\u629B\u552E\u7A33\u5B9A\u5E01\uFF0C\u53D1\u884C\u65B9\u5C31\u5FC5\u987B\u7D27\u6025\u629B\u552E\u56FD\u503A\u2014\u2014\u8FD9\u4F1A\u76F4\u63A5\u51B2\u51FB\u7F8E\u56FD\u56FD\u503A\u5E02\u573A\u3002",
    danger: 3,
    color: "#8e44ad",
    bgLight: "#f4ecf7",
  },
  {
    id: "tariff",
    emoji: "\uD83E\uDE81",
    title: "\u8D38\u6613\u6218+\u653F\u6CBB\u6DF7\u4E71\uFF1A\u706B\u4E0A\u6D47\u6CB9",
    simple: "\u7F8E\u56FD\u5BF9\u51E0\u4E4E\u6240\u6709\u8FDB\u53E3\u5546\u54C1\u52A0\u4E86\u7A0E\uFF0C\u7269\u4EF7\u4E0A\u6DA8\u3002\u540C\u65F6\u603B\u7EDF\u8FD8\u60F3\u63A7\u5236\u7F8E\u8054\u50A8\u3002\u6CD5\u9662\u5728\u5BA1\u5173\u7A0E\u662F\u5426\u8FDD\u6CD5\u2014\u2014\u6240\u6709\u4EBA\u90FD\u4E0D\u786E\u5B9A\u660E\u5929\u4F1A\u53D1\u751F\u4EC0\u4E48\u3002\u8FD9\u79CD\u201C\u4E0D\u786E\u5B9A\u6027\u201D\u672C\u8EAB\u5C31\u662F\u6700\u5927\u7684\u98CE\u9669\u3002",
    detail: "\u7F8E\u56FD\u6709\u6548\u5173\u7A0E\u7387\u98D9\u5347\u81F313.5%\uFF081946\u5E74\u6765\u6700\u9AD8\uFF09\u3002\u6700\u9AD8\u6CD5\u9662\u6B63\u5728\u5BA1\u67E5\u5173\u7A0E\u5408\u6CD5\u6027\u3002\u65E5\u672C\u592E\u884C\u52A0\u606F\u5BFC\u81F45000\u4EBF\u7F8E\u5143\u5957\u5229\u4EA4\u6613\u627F\u538B\uFF0C\u53EF\u80FD\u5F15\u53D1\u65E5\u672C\u6295\u8D44\u8005\u629B\u552E\u7F8E\u56FD\u56FD\u503A\u3002",
    danger: 3,
    color: "#2980b9",
    bgLight: "#eaf2f8",
  },
];

const DOMINO_CHAIN = [
  { label: "\u5173\u7A0E\u51B2\u51FB\n\u6216\u5730\u7F18\u5C40\u52BF", emoji: "\uD83E\uDE81", color: "#2980b9" },
  { label: "\u5E02\u573A\u6050\u614C\n\u6CE2\u52A8\u52A0\u5267", emoji: "\uD83D\uDE31", color: "#e67e22" },
  { label: "\u8D85\u7EA7\u8D4C\u5C40\n\u88AB\u8FEB\u5E73\u4ED3", emoji: "\uD83C\uDFB0", color: "#e74c3c" },
  { label: "\u5927\u91CF\u629B\u552E\n\u56FD\u503A", emoji: "\uD83D\uDCC9", color: "#e74c3c" },
  { label: "\u5229\u7387\u98D9\u5347\n\u501F\u94B1\u66F4\u8D35", emoji: "\uD83D\uDCB9", color: "#c0392b" },
  { label: "\u201C\u8840\u6DB2\u5FAA\u73AF\u201D\n\u5835\u585E", emoji: "\uD83E\uDE78", color: "#c0392b" },
  { label: "\u94F6\u884C\u6536\u7D27\n\u4E0D\u6562\u653E\u8D37", emoji: "\uD83C\uDFE6", color: "#8e44ad" },
  { label: "\u4F01\u4E1A\u5173\u95ED\n\u5931\u4E1A\u4E0A\u5347", emoji: "\uD83C\uDFDA\uFE0F", color: "#7f1d1d" },
];

function DangerBar({ level, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
      <span style={{ fontSize: 12, color: "#8b8b8b", fontWeight: 500, minWidth: 52 }}>{"\u5371\u9669\u7A0B\u5EA6"}</span>
      <div style={{ display: "flex", gap: 4 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{
            width: 22, height: 10, borderRadius: 3,
            background: i <= level ? color : "#e8e8e8",
            transition: "background 0.4s",
            boxShadow: i <= level ? `0 0 6px ${color}40` : "none",
          }} />
        ))}
      </div>
      <span style={{ fontSize: 11, color: level >= 4 ? color : "#aaa", fontWeight: 600 }}>
        {level <= 2 ? "\u4F4E" : level === 3 ? "\u4E2D\u9AD8" : level === 4 ? "\u9AD8" : "\u6700\u9AD8"}
      </span>
    </div>
  );
}

function StoryCard({ story, index, isOpen, onToggle }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      onClick={onToggle}
      style={{
        background: isOpen ? story.bgLight : "#ffffff",
        borderRadius: 20,
        padding: "28px 28px 24px",
        cursor: "pointer",
        border: `2px solid ${isOpen ? story.color + "40" : "#f0f0f0"}`,
        transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: isOpen
          ? `0 8px 30px ${story.color}18, 0 2px 8px rgba(0,0,0,0.06)`
          : "0 2px 12px rgba(0,0,0,0.04)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(30px)",
        transitionDelay: `${index * 0.06}s`,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div style={{
          fontSize: 36, lineHeight: 1,
          width: 56, height: 56,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: story.bgLight,
          borderRadius: 16,
          flexShrink: 0,
        }}>
          {story.emoji}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: 17, fontWeight: 700, color: "#1a1a2e",
            margin: "0 0 8px", lineHeight: 1.4,
          }}>
            <span style={{
              display: "inline-block",
              background: story.color,
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 6,
              marginRight: 8,
              verticalAlign: "middle",
              lineHeight: "18px",
            }}>
              {index + 1}
            </span>
            {story.title}
          </h3>
          <p style={{
            fontSize: 15, color: "#444", lineHeight: 1.75,
            margin: 0, fontWeight: 400,
          }}>
            {story.simple}
          </p>

          {isOpen && (
            <div style={{
              marginTop: 14,
              padding: "14px 16px",
              background: "#fff",
              borderRadius: 12,
              border: `1px solid ${story.color}20`,
              animation: "fadeIn 0.3s ease-out",
            }}>
              <div style={{
                fontSize: 11, color: story.color, fontWeight: 700,
                marginBottom: 6, letterSpacing: "0.05em",
              }}>
                {"\uD83D\uDCCA"} {"\u771F\u5B9E\u6570\u636E"}
              </div>
              <p style={{
                fontSize: 13, color: "#666", lineHeight: 1.7,
                margin: 0, fontWeight: 300,
              }}>
                {story.detail}
              </p>
            </div>
          )}

          <DangerBar level={story.danger} color={story.color} />
        </div>
      </div>

      <div style={{
        textAlign: "right", fontSize: 11, color: "#bbb",
        marginTop: 6,
      }}>
        {isOpen ? "\u70B9\u51FB\u6536\u8D77 \u25B2" : "\u70B9\u51FB\u5C55\u5F00\u8BE6\u60C5 \u25BC"}
      </div>
    </div>
  );
}

function DominoChain() {
  const [triggered, setTriggered] = useState(-1);
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const startDomino = () => {
    setTriggered(0);
    DOMINO_CHAIN.forEach((_, i) => {
      setTimeout(() => setTriggered(i), i * 400);
    });
  };

  const resetDomino = () => setTriggered(-1);

  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(30px)",
      transition: "all 0.6s",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 24,
        padding: "32px 24px",
        border: "2px solid #f0f0f0",
        boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
      }}>
        <h3 style={{
          fontSize: 20, fontWeight: 700, color: "#1a1a2e",
          textAlign: "center", margin: "0 0 8px",
        }}>
          {"\uD83E\uDDF1"} {"\u591A\u7C73\u8BFA\u9AA8\u724C\uFF1A\u5371\u673A\u5982\u4F55\u4E00\u6B65\u6B65\u8513\u5EF6\uFF1F"}
        </h3>
        <p style={{
          fontSize: 14, color: "#888", textAlign: "center",
          margin: "0 0 24px", fontWeight: 300,
        }}>
          {"\u70B9\u51FB\u4E0B\u65B9\u6309\u94AE\uFF0C\u770B\u4E00\u4E2A\u51B2\u51FB\u5982\u4F55\u5F15\u53D1\u8FDE\u9501\u53CD\u5E94"}
        </p>

        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          flexWrap: "wrap",
          padding: "0 8px",
        }}>
          {DOMINO_CHAIN.map((d, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div style={{
                width: 80,
                padding: "12px 6px",
                borderRadius: 14,
                background: triggered >= i
                  ? `linear-gradient(135deg, ${d.color}, ${d.color}dd)`
                  : "#f8f8f8",
                color: triggered >= i ? "#fff" : "#666",
                textAlign: "center",
                fontSize: 11,
                fontWeight: 600,
                lineHeight: 1.4,
                transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                transitionDelay: `${i * 0.05}s`,
                transform: triggered >= i ? "scale(1.05)" : "scale(1)",
                boxShadow: triggered >= i ? `0 4px 16px ${d.color}40` : "none",
              }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{d.emoji}</div>
                {d.label.split("\n").map((l, j) => <div key={j}>{l}</div>)}
              </div>
              {i < DOMINO_CHAIN.length - 1 && (
                <div style={{
                  fontSize: 16,
                  color: triggered > i ? d.color : "#ddd",
                  transition: "color 0.3s",
                  margin: "0 2px",
                  fontWeight: 700,
                }}>{"\u2192"}</div>
              )}
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 24, display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={startDomino}
            style={{
              background: "linear-gradient(135deg, #e74c3c, #c0392b)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "12px 28px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(231,76,60,0.3)",
              transition: "transform 0.2s",
              fontFamily: "inherit",
            }}
            onMouseOver={e => e.target.style.transform = "scale(1.05)"}
            onMouseOut={e => e.target.style.transform = "scale(1)"}
          >
            {"\u25B6 \u63A8\u5012\u7B2C\u4E00\u5757\u9AA8\u724C"}
          </button>
          {triggered >= 0 && (
            <button
              onClick={resetDomino}
              style={{
                background: "#f0f0f0",
                color: "#666",
                border: "none",
                borderRadius: 12,
                padding: "12px 20px",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {"\u91CD\u7F6E"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MeterGauge() {
  const [animated, setAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setAnimated(true); },
      { threshold: 0.3 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const needleAngle = animated ? -90 + (20 / 100) * 180 : -90;

  return (
    <div ref={ref} style={{
      background: "#fff",
      borderRadius: 24,
      padding: "32px 24px 24px",
      border: "2px solid #f0f0f0",
      boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
      textAlign: "center",
    }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e", margin: "0 0 4px" }}>
        {"\u8FD9\u4E00\u5207\u53D1\u751F\u7684\u53EF\u80FD\u6027\u6709\u591A\u5927\uFF1F"}
      </h3>
      <p style={{ fontSize: 13, color: "#888", margin: "0 0 20px", fontWeight: 300 }}>
        {"\u7EFC\u5408\u5404\u65B9\u8BC4\u4F30\u7684\u4E25\u91CD\u6D41\u52A8\u6027\u5371\u673A\u6982\u7387"}
      </p>

      <svg viewBox="0 0 200 120" style={{ width: "100%", maxWidth: 280 }}>
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#f0f0f0" strokeWidth="16" strokeLinecap="round" />
        <path d="M 20 100 A 80 80 0 0 1 60 35" fill="none" stroke="#2ecc71" strokeWidth="16" strokeLinecap="round" />
        <path d="M 60 35 A 80 80 0 0 1 100 20" fill="none" stroke="#f1c40f" strokeWidth="16" strokeLinecap="round" />
        <path d="M 100 20 A 80 80 0 0 1 140 35" fill="none" stroke="#e67e22" strokeWidth="16" strokeLinecap="round" />
        <path d="M 140 35 A 80 80 0 0 1 180 100" fill="none" stroke="#e74c3c" strokeWidth="16" strokeLinecap="round" />

        <text x="18" y="115" fontSize="8" fill="#2ecc71" fontWeight="600">{"\u5B89\u5168"}</text>
        <text x="80" y="14" fontSize="8" fill="#f1c40f" fontWeight="600" textAnchor="middle">{"\u8B66\u60EB"}</text>
        <text x="168" y="115" fontSize="8" fill="#e74c3c" fontWeight="600">{"\u5371\u9669"}</text>

        <g transform={`rotate(${needleAngle} 100 100)`} style={{ transition: "transform 1.5s cubic-bezier(0.4,0,0.2,1)" }}>
          <line x1="100" y1="100" x2="100" y2="30" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="100" cy="100" r="5" fill="#1a1a2e" />
        </g>

        {animated && (
          <text x="100" y="80" fontSize="22" fontWeight="700" fill="#e67e22" textAnchor="middle" fontFamily="inherit">
            15-25%
          </text>
        )}
        <text x="100" y="95" fontSize="7" fill="#888" textAnchor="middle" fontFamily="inherit">
          {"\u4E0D\u662F\u4E00\u5B9A\u4F1A\u53D1\u751F\uFF0C\u4F46\u503C\u5F97\u8B66\u60EB"}
        </text>
      </svg>

      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: 20,
        marginTop: 16,
        fontSize: 12,
        color: "#888",
      }}>
        <span>{"\uD83D\uDFE2"} {"\u6B63\u5E38\u65F6\u671F <5%"}</span>
        <span style={{ color: "#e67e22", fontWeight: 600 }}>{"\uD83D\uDFE0"} {"\u5F53\u524D 15-25%"}</span>
        <span>{"\uD83D\uDD34"} {"2008\u5E74\u65F6 >40%"}</span>
      </div>
    </div>
  );
}

function BottomLine() {
  return (
    <div style={{
      background: "linear-gradient(135deg, #1a1a2e, #2c2c54)",
      borderRadius: 24,
      padding: "32px 28px",
      color: "#fff",
    }}>
      <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 16px", textAlign: "center" }}>
        {"\uD83D\uDCA1"} {"\u4E00\u53E5\u8BDD\u603B\u7ED3"}
      </h3>
      <p style={{
        fontSize: 17, lineHeight: 1.8, textAlign: "center",
        fontWeight: 400, color: "#e2e8f0", maxWidth: 600, margin: "0 auto 20px",
      }}>
        {"\u7F8E\u56FD\u91D1\u878D\u7CFB\u7EDF\u5C31\u50CF\u4E00\u5EA7"}<span style={{ color: "#fcd34d", fontWeight: 700 }}>{"\u770B\u8D77\u6765\u5B8C\u597D\u4F46\u5185\u90E8\u627F\u91CD\u7ED3\u6784\u5DF2\u7ECF\u6709\u88C2\u7F1D"}</span>{"\u7684\u5927\u697C\u3002"}
        {"\u4E0D\u662F\u8BF4\u5B83\u4E00\u5B9A\u4F1A\u5851\uFF0C\u4F46\u5982\u679C\u540C\u65F6\u6765\u4E00\u573A\u5730\u9707\uFF08\u8D38\u6613\u6218\uFF09\u3001\u522E\u4E00\u573A\u5927\u98CE\uFF08\u5229\u7387\u98D9\u5347\uFF09\u3001\u52A0\u4E0A\u5E74\u4E45\u5931\u4FEE\uFF08\u503A\u52A1\u79EF\u7D2F\uFF09\uFF0C\u5C31\u53EF\u80FD\u51FA\u5927\u95EE\u9898\u3002"}
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 12,
        marginTop: 20,
      }}>
        {[
          { emoji: "\uD83C\uDFD7\uFE0F", text: "\u88C2\u7F1D = \u56FD\u503A\u5E02\u573A\u6D41\u52A8\u6027\u4E0D\u8DB3\uFF0C\u505A\u5E02\u5546\u8DDF\u4E0D\u4E0A" },
          { emoji: "\u26A1", text: "\u96F7\u7BA1 = \u4E07\u4EBF\u7EA7\u522B\u7684\u9AD8\u6760\u6746\u8D4C\u5C40\u968F\u65F6\u53EF\u80FD\u88AB\u5F15\u7206" },
          { emoji: "\uD83D\uDD17", text: "\u94FE\u6761 = \u6240\u6709\u98CE\u9669\u4E92\u76F8\u8FDE\u63A5\uFF0C\u4E00\u4E2A\u51FA\u4E8B\u53EF\u80FD\u62D6\u4E0B\u4E00\u4E32" },
          { emoji: "\uD83D\uDE92", text: "\u6D88\u9632\u961F\u4E5F\u5728\u72B9\u8C6B = \u7F8E\u8054\u50A8\u9762\u4E34\u201C\u6551\u706B\u201D\u548C\u201C\u63A7\u5236\u7269\u4EF7\u201D\u7684\u4E24\u96BE" },
        ].map((item, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.06)",
            borderRadius: 14,
            padding: "14px 16px",
            fontSize: 13,
            lineHeight: 1.6,
            color: "#cbd5e1",
            fontWeight: 300,
          }}>
            <span style={{ fontSize: 20, marginRight: 6 }}>{item.emoji}</span>
            {item.text}
          </div>
        ))}
      </div>

      <p style={{
        fontSize: 12, color: "#64748b", textAlign: "center",
        marginTop: 20, fontWeight: 300,
      }}>
        {"\u6570\u636E\u6765\u6E90\uFF1A\u7F8E\u8054\u50A8\u3001\u56FD\u9645\u8D27\u5E01\u57FA\u91D1\u7EC4\u7EC7(IMF)\u3001\u56FD\u9645\u6E05\u7B97\u94F6\u884C(BIS)\u3001\u7F8E\u56FD\u56FD\u4F1A\u9884\u7B97\u529E\u516C\u5BA4(CBO)\u3001\u53CA\u4E3B\u8981\u6295\u884C\u7814\u7A76\u62A5\u544A \u00B7 2025-2026"}
      </p>
    </div>
  );
}

export default function SimpleExplainer() {
  const [openCard, setOpenCard] = useState(null);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #faf8f5 0%, #f5f0eb 50%, #faf8f5 100%)",
      fontFamily: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        button { font-family: inherit; }
      `}</style>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 20px 60px" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            display: "inline-block",
            background: "linear-gradient(135deg, #e74c3c20, #e67e2220)",
            borderRadius: 16,
            padding: "8px 20px",
            fontSize: 13,
            color: "#c0392b",
            fontWeight: 600,
            marginBottom: 16,
          }}>
            {"\u26A0\uFE0F \u96F6\u57FA\u7840\u4E5F\u80FD\u770B\u61C2\u7684\u91D1\u878D\u79D1\u666E"}
          </div>
          <h1 style={{
            fontSize: 30,
            fontWeight: 700,
            color: "#1a1a2e",
            lineHeight: 1.4,
            margin: "0 0 12px",
          }}>
            {"\u7F8E\u56FD\u7ECF\u6D4E\u53EF\u80FD\u9047\u5230"}<br />
            <span style={{
              background: "linear-gradient(90deg, #e74c3c, #e67e22)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>{"\u4EC0\u4E48\u5927\u9EBB\u70E6\uFF1F"}</span>
          </h1>
          <p style={{
            fontSize: 15,
            color: "#888",
            lineHeight: 1.7,
            maxWidth: 500,
            margin: "0 auto",
            fontWeight: 300,
          }}>
            {"\u4E0D\u9700\u8981\u4EFB\u4F55\u91D1\u878D\u77E5\u8BC6\uFF0C\u75288\u4E2A\u751F\u6D3B\u5316\u6BD4\u55BB\uFF0C"}<br />
            {"\u5E26\u4F60\u4E86\u89E32025-2027\u5E74\u7F8E\u56FD\u9762\u4E34\u7684\u201C\u9690\u5F62\u98CE\u9669\u201D\u3002"}
          </p>
        </div>

        {/* Story Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
          {STORIES.map((story, i) => (
            <StoryCard
              key={story.id}
              story={story}
              index={i}
              isOpen={openCard === story.id}
              onToggle={() => setOpenCard(openCard === story.id ? null : story.id)}
            />
          ))}
        </div>

        {/* Domino Chain */}
        <div style={{ marginBottom: 32 }}>
          <DominoChain />
        </div>

        {/* Meter */}
        <div style={{ marginBottom: 32 }}>
          <MeterGauge />
        </div>

        {/* Bottom Line */}
        <BottomLine />

      </div>
    </div>
  );
}
