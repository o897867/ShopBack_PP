"""
玄学分析模块 - 提供基于数字、黄道吉日、方位和市场八卦的运势分析
"""
import hashlib
import random
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Tuple
from lunardate import LunarDate
import math

class FortuneTeller:
    """玄学分析主类"""

    # 易经64卦
    I_CHING_HEXAGRAMS = {
        1: ("乾卦", "天行健，君子以自强不息", "大吉"),
        2: ("坤卦", "地势坤，君子以厚德载物", "吉"),
        3: ("屯卦", "创始维艰，守正待机", "平"),
        4: ("蒙卦", "山下有险，止而不进", "凶"),
        5: ("需卦", "云上于天，待时而动", "吉"),
        6: ("讼卦", "天水相违，慎防争端", "凶"),
        7: ("师卦", "地中有水，谨慎行事", "平"),
        8: ("比卦", "水在地上，亲辅友邦", "吉"),
        11: ("泰卦", "天地交泰，万事亨通", "大吉"),
        12: ("否卦", "天地不交，闭塞不通", "凶"),
        13: ("同人卦", "天下大同，和合共济", "吉"),
        14: ("大有卦", "火在天上，大有所获", "大吉"),
        19: ("临卦", "泽上有地，居高临下", "吉"),
        20: ("观卦", "风行地上，观察等待", "平"),
        24: ("复卦", "雷在地中，一阳来复", "吉"),
        25: ("无妄卦", "天下有雷，不期而至", "平"),
        30: ("离卦", "明两作离，日月丽天", "吉"),
        31: ("咸卦", "山泽通气，感应而合", "吉"),
        33: ("遯卦", "天山相遯，退避三舍", "凶"),
        34: ("大壮卦", "雷在天上，壮勇前行", "大吉"),
        42: ("益卦", "风雷相益，损上益下", "吉"),
        43: ("夬卦", "泽天夬决，当机立断", "平"),
        49: ("革卦", "泽火相革，改革创新", "吉"),
        50: ("鼎卦", "火风鼎立，稳重发展", "大吉"),
        55: ("丰卦", "雷火丰满，盛大丰收", "大吉"),
        56: ("旅卦", "火山旅行，谨慎前行", "平"),
        60: ("节卦", "水泽有节，适可而止", "吉"),
        61: ("中孚卦", "风泽中孚，诚信为本", "吉"),
        63: ("既济卦", "水火既济，功成名就", "大吉"),
        64: ("未济卦", "火水未济，尚需努力", "平"),
    }

    # 五行属性
    FIVE_ELEMENTS = {
        0: ("金", "收敛、坚固、肃杀", "白色", "西方"),
        1: ("木", "生长、升发、条达", "青色", "东方"),
        2: ("水", "滋润、下行、寒凉", "黑色", "北方"),
        3: ("火", "炎热、上升、光明", "红色", "南方"),
        4: ("土", "承载、生化、受纳", "黄色", "中央"),
    }

    # 十二时辰
    TWELVE_HOURS = {
        0: ("子时", "23:00-01:00", "鼠", "水"),
        1: ("丑时", "01:00-03:00", "牛", "土"),
        2: ("寅时", "03:00-05:00", "虎", "木"),
        3: ("卯时", "05:00-07:00", "兔", "木"),
        4: ("辰时", "07:00-09:00", "龙", "土"),
        5: ("巳时", "09:00-11:00", "蛇", "火"),
        6: ("午时", "11:00-13:00", "马", "火"),
        7: ("未时", "13:00-15:00", "羊", "土"),
        8: ("申时", "15:00-17:00", "猴", "金"),
        9: ("酉时", "17:00-19:00", "鸡", "金"),
        10: ("戌时", "19:00-21:00", "狗", "土"),
        11: ("亥时", "21:00-23:00", "猪", "水"),
    }

    # 黄道吉日特征
    LUCKY_DAY_FEATURES = {
        "天德": "诸事皆宜，大吉大利",
        "月德": "吉祥如意，贵人相助",
        "天赦": "百无禁忌，逢凶化吉",
        "三合": "天地人和，事半功倍",
        "六合": "和合美满，财运亨通",
        "天喜": "喜事临门，好运连连",
        "月财": "财源广进，利于投资",
    }

    # 凶日特征
    UNLUCKY_DAY_FEATURES = {
        "月破": "诸事不宜，谨慎行事",
        "月煞": "易有波折，守旧为宜",
        "四废": "徒劳无功，不宜决策",
        "四穷": "财运不佳，忌大投资",
        "五离": "聚散无常，稳健为上",
    }

    # 八卦对应市场
    MARKET_BAGUA = {
        "乾": ("强势上涨", "天", "刚健有力，势不可挡"),
        "坤": ("震荡筑底", "地", "厚积薄发，等待时机"),
        "震": ("急涨急跌", "雷", "变化剧烈，注意风险"),
        "巽": ("缓慢上行", "风", "循序渐进，稳中有升"),
        "坎": ("下跌趋势", "水", "顺流而下，避免抄底"),
        "离": ("高位震荡", "火", "热度过高，见好就收"),
        "艮": ("横盘整理", "山", "静观其变，耐心等待"),
        "兑": ("获利回吐", "泽", "见利即收，落袋为安"),
    }

    def __init__(self):
        """初始化玄学分析器"""
        self.today = datetime.now()
        self.lunar_date = self._get_lunar_date()

    def _get_lunar_date(self) -> LunarDate:
        """获取今日农历日期"""
        return LunarDate.fromSolarDate(
            self.today.year,
            self.today.month,
            self.today.day
        )

    def _calculate_daily_seed(self, number: int) -> int:
        """计算每日种子值，确保同一天同一数字结果一致"""
        date_str = self.today.strftime("%Y%m%d")
        hash_input = f"{date_str}_{number}"
        hash_value = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
        return hash_value

    def _get_life_number(self, number: int) -> int:
        """计算生命灵数（1-9）"""
        while number > 9:
            number = sum(int(digit) for digit in str(number))
        return number if number > 0 else 9

    def _get_hexagram(self, number: int) -> Tuple[str, str, str]:
        """根据数字获取易经卦象"""
        # 使用数字映射到64卦
        hexagram_index = (number % 64) + 1

        # 获取预定义的卦象，如果没有则生成
        if hexagram_index in self.I_CHING_HEXAGRAMS:
            return self.I_CHING_HEXAGRAMS[hexagram_index]
        else:
            # 动态生成其他卦象
            gua_names = ["乾", "坤", "震", "巽", "坎", "离", "艮", "兑"]
            upper = gua_names[(hexagram_index - 1) // 8]
            lower = gua_names[(hexagram_index - 1) % 8]
            name = f"{upper}{lower}卦"
            meaning = f"{upper}上{lower}下，动静相宜"
            fortune = "平" if hexagram_index % 3 == 0 else "吉"
            return (name, meaning, fortune)

    def _get_five_element(self, number: int) -> Tuple[str, str, str, str]:
        """根据数字获取五行属性"""
        element_index = number % 5
        return self.FIVE_ELEMENTS[element_index]

    def _get_lucky_hours(self, number: int, daily_seed: int) -> List[str]:
        """计算幸运时段"""
        # 基于数字和日期种子计算3个幸运时段
        lucky_indices = []
        for i in range(3):
            index = (daily_seed + number * (i + 1)) % 12
            lucky_indices.append(index)

        lucky_hours = []
        for idx in sorted(set(lucky_indices)):
            hour_info = self.TWELVE_HOURS[idx]
            lucky_hours.append(f"{hour_info[1]} ({hour_info[0]})")

        return lucky_hours

    def _analyze_lunar_fortune(self) -> Dict[str, Any]:
        """分析黄道吉日"""
        lunar_day = self.lunar_date.day
        lunar_month = self.lunar_date.month

        # 简化的黄道吉日算法
        fortune_score = 50  # 基础分
        features = []

        # 初一、十五加分
        if lunar_day in [1, 15]:
            fortune_score += 10
            features.append("朔望日")

        # 逢三、六、九为吉日
        if lunar_day % 3 == 0 or lunar_day % 6 == 0 or lunar_day % 9 == 0:
            fortune_score += 15
            features.append("三六九吉日")

        # 避开四废日（简化算法）
        if lunar_day in [4, 14, 24]:
            fortune_score -= 20
            features.append("四废日")

        # 月德日（每月特定日子）
        moon_virtue_days = {
            1: [5, 20], 2: [2, 17], 3: [7, 22],
            4: [4, 19], 5: [1, 16], 6: [6, 21],
            7: [3, 18], 8: [8, 23], 9: [5, 20],
            10: [2, 17], 11: [7, 22], 12: [4, 19]
        }

        if lunar_day in moon_virtue_days.get(lunar_month, []):
            fortune_score += 20
            features.append("月德日")

        # 根据分数判断吉凶
        if fortune_score >= 70:
            verdict = "黄道吉日"
            suggestion = "诸事皆宜，大胆操作"
        elif fortune_score >= 50:
            verdict = "平日"
            suggestion = "中规中矩，稳健为主"
        else:
            verdict = "凶日"
            suggestion = "谨慎观望，不宜重仓"

        return {
            "lunar_date": f"农历{self.lunar_date.month}月{self.lunar_date.day}日",
            "fortune_score": fortune_score,
            "verdict": verdict,
            "features": features,
            "suggestion": suggestion
        }

    def _analyze_direction(self, number: int, daily_seed: int) -> Dict[str, str]:
        """分析财位方向"""
        directions = ["东", "南", "西", "北", "东南", "西南", "东北", "西北", "中央"]

        # 根据数字和日期计算财位
        fortune_index = (daily_seed + number) % len(directions)
        fortune_direction = directions[fortune_index]

        # 根据五行确定吉位
        element = self._get_five_element(number)[0]
        element_directions = {
            "金": "西",
            "木": "东",
            "水": "北",
            "火": "南",
            "土": "中央"
        }
        element_direction = element_directions.get(element, "中央")

        return {
            "财位": fortune_direction,
            "五行吉位": element_direction,
            "建议": f"面朝{fortune_direction}方操作，{element_direction}方摆放财物"
        }

    def _analyze_market_bagua(self, number: int, market_indicators: Optional[Dict] = None) -> Dict[str, Any]:
        """结合市场指标生成八卦解读"""
        # 根据数字确定卦象
        bagua_list = list(self.MARKET_BAGUA.keys())
        bagua_index = number % len(bagua_list)
        bagua_name = bagua_list[bagua_index]
        market_state, element, interpretation = self.MARKET_BAGUA[bagua_name]

        # 如果有真实市场指标，结合分析
        if market_indicators:
            rsi = market_indicators.get('rsi', 50)
            macd = market_indicators.get('macd', 0)

            # 根据技术指标调整解读
            if rsi > 70:
                market_state = "超买区域"
                interpretation += "，技术面显示超买，宜谨慎"
            elif rsi < 30:
                market_state = "超卖区域"
                interpretation += "，技术面显示超卖，可关注机会"

            if macd > 0:
                interpretation += "，动能向上"
            else:
                interpretation += "，动能向下"

        return {
            "卦象": f"{bagua_name}卦",
            "元素": element,
            "市场状态": market_state,
            "玄学解读": interpretation,
            "操作建议": self._get_bagua_suggestion(bagua_name)
        }

    def _get_bagua_suggestion(self, bagua_name: str) -> str:
        """根据八卦给出操作建议"""
        suggestions = {
            "乾": "宜追涨，仓位可达7成",
            "坤": "宜低吸，分批建仓",
            "震": "宜观望，快进快出",
            "巽": "宜跟随，稳健加仓",
            "坎": "宜空仓，等待转机",
            "离": "宜减仓，获利了结",
            "艮": "宜持币，静待突破",
            "兑": "宜止盈，见好就收"
        }
        return suggestions.get(bagua_name, "随机应变，灵活操作")

    def _generate_lucky_items(self, number: int) -> Dict[str, Any]:
        """生成幸运物品"""
        colors = ["红", "黄", "蓝", "绿", "紫", "金", "银", "黑", "白"]
        numbers = list(range(1, 10))

        seed = self._calculate_daily_seed(number)

        # 幸运颜色
        color_index = seed % len(colors)
        lucky_color = colors[color_index]

        # 幸运数字（3个）
        lucky_numbers = []
        for i in range(3):
            num_index = (seed * (i + 1)) % len(numbers)
            lucky_numbers.append(numbers[num_index])

        # 幸运物品
        items = ["貔貅", "金蟾", "五帝钱", "转运珠", "水晶球", "招财猫", "福袋", "金元宝", "如意"]
        item_index = (seed + number) % len(items)
        lucky_item = items[item_index]

        return {
            "幸运颜色": lucky_color,
            "幸运数字": lucky_numbers,
            "幸运物品": lucky_item
        }

    def _generate_fortune_poem(self, number: int) -> str:
        """生成运势诗句"""
        poems = [
            "金风玉露一相逢，便胜却人间无数",
            "山重水复疑无路，柳暗花明又一村",
            "长风破浪会有时，直挂云帆济沧海",
            "宝剑锋从磨砺出，梅花香自苦寒来",
            "会当凌绝顶，一览众山小",
            "千淘万漉虽辛苦，吹尽狂沙始到金",
            "欲穷千里目，更上一层楼",
            "不经一番寒彻骨，怎得梅花扑鼻香",
            "路漫漫其修远兮，吾将上下而求索",
            "天行健，君子以自强不息"
        ]

        seed = self._calculate_daily_seed(number)
        poem_index = seed % len(poems)
        return poems[poem_index]

    def divine(self, number: int, market_indicators: Optional[Dict] = None) -> Dict[str, Any]:
        """
        主占卜方法

        Args:
            number: 用户输入的数字
            market_indicators: 可选的市场技术指标

        Returns:
            完整的玄学分析结果
        """
        # 计算基础数值
        daily_seed = self._calculate_daily_seed(number)
        life_number = self._get_life_number(number)

        # 获取各项分析
        hexagram = self._get_hexagram(number)
        element = self._get_five_element(number)
        lucky_hours = self._get_lucky_hours(number, daily_seed)
        lunar_fortune = self._analyze_lunar_fortune()
        direction = self._analyze_direction(number, daily_seed)
        market_bagua = self._analyze_market_bagua(number, market_indicators)
        lucky_items = self._generate_lucky_items(number)
        fortune_poem = self._generate_fortune_poem(number)

        # 计算综合运势分数
        base_score = 50

        # 易经卦象影响
        if hexagram[2] == "大吉":
            base_score += 20
        elif hexagram[2] == "吉":
            base_score += 10
        elif hexagram[2] == "凶":
            base_score -= 15

        # 黄道吉日影响
        base_score += (lunar_fortune["fortune_score"] - 50) * 0.5

        # 生命灵数影响
        if life_number in [1, 6, 8, 9]:
            base_score += 10
        elif life_number in [4, 7]:
            base_score -= 5

        # 确保分数在0-100之间
        fortune_score = max(0, min(100, int(base_score)))

        # 生成总体建议
        if fortune_score >= 80:
            overall_verdict = "大吉大利"
            overall_suggestion = "天时地利人和，宜大胆操作，把握良机"
        elif fortune_score >= 60:
            overall_verdict = "吉"
            overall_suggestion = "运势不错，可适度进取，注意风险控制"
        elif fortune_score >= 40:
            overall_verdict = "平"
            overall_suggestion = "运势平平，宜稳健操作，不急不躁"
        else:
            overall_verdict = "凶"
            overall_suggestion = "运势欠佳，宜观望为主，保存实力"

        return {
            "timestamp": self.today.isoformat(),
            "input_number": number,
            "life_number": life_number,
            "fortune_score": fortune_score,
            "overall_verdict": overall_verdict,
            "overall_suggestion": overall_suggestion,
            "hexagram": {
                "name": hexagram[0],
                "meaning": hexagram[1],
                "fortune": hexagram[2]
            },
            "five_elements": {
                "element": element[0],
                "property": element[1],
                "color": element[2],
                "direction": element[3]
            },
            "lunar_calendar": lunar_fortune,
            "lucky_hours": lucky_hours,
            "directions": direction,
            "market_bagua": market_bagua,
            "lucky_items": lucky_items,
            "fortune_poem": fortune_poem,
            "daily_advice": {
                "宜": self._generate_suitable_actions(fortune_score),
                "忌": self._generate_avoid_actions(fortune_score)
            }
        }

    def _generate_suitable_actions(self, score: int) -> List[str]:
        """生成适宜的行动"""
        if score >= 70:
            return ["开仓", "加仓", "追涨", "突破买入", "设置止盈"]
        elif score >= 40:
            return ["小仓试探", "低吸", "分批建仓", "观察等待"]
        else:
            return ["观望", "学习研究", "复盘总结", "调整心态"]

    def _generate_avoid_actions(self, score: int) -> List[str]:
        """生成应避免的行动"""
        if score >= 70:
            return ["过度恐慌", "频繁止损", "犹豫不决"]
        elif score >= 40:
            return ["重仓押注", "追高", "情绪化交易", "逆势操作"]
        else:
            return ["开新仓", "加仓", "抄底", "对抗趋势", "借贷投资"]


# 测试代码
if __name__ == "__main__":
    fortune_teller = FortuneTeller()

    # 测试不同数字
    test_numbers = [888, 666, 123, 7, 42]

    for num in test_numbers:
        print(f"\n{'='*50}")
        print(f"测试数字: {num}")
        result = fortune_teller.divine(num, {"rsi": 65, "macd": 0.5})

        print(f"综合运势: {result['fortune_score']}分 - {result['overall_verdict']}")
        print(f"易经卦象: {result['hexagram']['name']} - {result['hexagram']['meaning']}")
        print(f"五行属性: {result['five_elements']['element']}")
        print(f"黄道吉日: {result['lunar_calendar']['verdict']}")
        print(f"幸运时段: {', '.join(result['lucky_hours'])}")
        print(f"市场八卦: {result['market_bagua']['卦象']} - {result['market_bagua']['市场状态']}")
        print(f"诗签: {result['fortune_poem']}")