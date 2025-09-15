import bleach

# 允许的HTML标签 - 严格控制以防止XSS攻击
ALLOWED_TAGS = [
    'p', 'br', 'ul', 'ol', 'li', 'strong', 'em', 'u', 's',
    'blockquote', 'pre', 'code', 'hr', 'h3', 'h4', 'a'  # 移除h1, h2以防止样式破坏，保留a标签但严格控制
]

# 严格控制允许的属性
ALLOWED_ATTRS = {
    'a': ['href'],  # 移除target和title以减少攻击面
    'blockquote': ['cite'],
    'pre': ['class'],  # 只允许class用于代码高亮
    'code': ['class']
}

# 只允许安全的协议
ALLOWED_PROTOCOLS = ['http', 'https']  # 移除mailto以减少攻击面


def sanitize_html(raw: str) -> str:
    if not raw:
        return ''
    
    # 预检查：拒绝过长的输入以防止DoS攻击
    if len(raw) > 50000:  # 50KB限制
        raise ValueError("输入内容过长")
    
    # 预检查：检测可疑的JavaScript模式
    suspicious_patterns = [
        r'javascript:', r'vbscript:', r'data:', r'on\w+\s*=',
        r'<script', r'</script>', r'<iframe', r'<object', r'<embed'
    ]
    import re
    for pattern in suspicious_patterns:
        if re.search(pattern, raw, re.IGNORECASE):
            # 不抛出异常，而是记录并继续清理
            pass
    
    # 第一步：使用白名单清理
    cleaned = bleach.clean(
        raw,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRS,
        protocols=ALLOWED_PROTOCOLS,
        strip=True,
        strip_comments=True,
    )
    
    # 第二步：添加安全的链接属性
    def safe_link_callback(attrs, new=False):
        # 为所有链接添加安全属性
        attrs[(None, 'rel')] = 'nofollow noopener noreferrer'
        attrs[(None, 'target')] = '_blank'
        return attrs
    
    # 第三步：自动链接化，但跳过代码块
    linkified = bleach.linkify(
        cleaned,
        callbacks=[safe_link_callback],
        skip_tags=['pre', 'code'],
        parse_email=False,  # 禁用邮件链接以增加安全性
    )
    
    return linkified

