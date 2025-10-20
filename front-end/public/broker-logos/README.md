# Broker Logos

这个目录存放broker的logo图片文件。

## 当前需要的Logo

根据最新更新,以下broker需要logo:

### 1. ECMarket
- **文件名**: `ecmarket.png`
- **描述**: 红色圆形logo,白色"EC"字样,"markets"黑色文字
- **建议尺寸**: 200x200px 或更高(保持正方形)
- **格式**: PNG (透明背景优先)

### 2. AvaTrade
- **文件名**: `avatrade.png`
- **描述**: 蓝色logo,"AVATRADE"文字,"TRADE WITH CONFIDENCE"标语
- **建议尺寸**: 200x80px 或等比例
- **格式**: PNG (透明背景优先)

### 3. EBC
- **文件名**: `ebc.png`
- **描述**: 六边形logo,EBC Financial Group
- **建议尺寸**: 200x200px
- **格式**: PNG (透明背景优先)

### 4. FXCM
- **文件名**: `fxcm.png`
- **描述**: 蓝白色logo,带中文"用卓越主义·交易股指黄金"
- **建议尺寸**: 200x100px 或等比例
- **格式**: PNG (透明背景优先)

## 如何添加Logo

### 方法1: 直接上传
将logo文件复制到此目录:
```bash
cp your-logo.png /root/shopback/ShopBack_PP/front-end/public/broker-logos/
```

### 方法2: 使用上传脚本
```bash
/root/shopback/ShopBack_PP/upload_broker_logos.sh /path/to/logo1.png /path/to/logo2.png
```

### 方法3: 使用wget下载
如果logo有公开URL:
```bash
cd /root/shopback/ShopBack_PP/front-end/public/broker-logos
wget -O ecmarket.png "https://example.com/ecmarket-logo.png"
wget -O avatrade.png "https://example.com/avatrade-logo.png"
wget -O ebc.png "https://example.com/ebc-logo.png"
wget -O fxcm.png "https://example.com/fxcm-logo.png"
```

## Logo优化建议

1. **尺寸**: 推荐使用200-400px的宽度,保持原始比例
2. **格式**: PNG格式,支持透明背景
3. **文件大小**: 尽量控制在100KB以内
4. **命名**: 使用小写字母和连字符,如: `ic-markets.png`

## 已配置的Logo路径

| Broker | 数据库路径 | 状态 |
|--------|-----------|------|
| ECMarket | `/broker-logos/ecmarket.png` | ⏳ 待添加 |
| AvaTrade | `/broker-logos/avatrade.png` | ⏳ 待添加 |
| EBC | `/broker-logos/ebc.png` | ⏳ 待添加 |
| FXCM | `/broker-logos/fxcm.png` | ⏳ 待添加 |

## 验证Logo

添加logo后,可以通过以下方式验证:

1. 访问: `http://your-domain/broker-logos/ecmarket.png`
2. 在浏览器开发者工具中检查图片加载
3. 查看Home页面的Broker Score Panel

## 注意事项

- 确保logo文件有正确的读取权限
- 部署后需要运行 `deploy-frontend` 来更新生产环境
- Logo会在Broker Tab、Broker Card等多个位置显示
- 移动端会优先显示logo而非文字(768px以下)
