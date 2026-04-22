"""
每日择卦 API — 六十四卦交易占卜
不依赖外部 AI API，所有数据内置。
"""
from fastapi import APIRouter, Request
from datetime import datetime

router = APIRouter(prefix="/api/fortune", tags=["fortune"])

# ─── 六十四卦数据 ────────────────────────────────────────────────────────────

GUA_LIST = [
    {"id":1,  "char":"乾", "name":"乾卦",  "sub":"天行健，君子以自强不息",     "verdict":"天象大利，阳气旺盛如公牛冲阵。今日市场趋势清晰，顺势者昌，逆势者亡。宜大胆入场，犹豫者将含泪看别人数钱。",           "action":"激进做多", "position":"重仓 7成", "stoploss":"跌破前低即斩", "time":"09:30 开盘即战", "luck":88, "tag":"大吉"},
    {"id":2,  "char":"坤", "name":"坤卦",  "sub":"地势坤，君子以厚德载物",     "verdict":"大地包容万物，今日宜守不宜攻。如耕牛犁田，一步一脚印。盲目追涨的结果就是站在山顶望风景。",                         "action":"轻仓观望", "position":"轻仓 3成", "stoploss":"亏5%离场",    "time":"14:00 午后", "luck":62, "tag":"平"},
    {"id":3,  "char":"屯", "name":"屯卦",  "sub":"云雷屯，君子以经纶",         "verdict":"万物初生，险象环生。行情如刚出壳的小鸡，方向未定，胡乱下单只会成为别人眼中的韭菜。耐心等待破壳时刻。",             "action":"等待确认", "position":"观望 1成", "stoploss":"此卦不追涨", "time":"等突破再入", "luck":42, "tag":"险"},
    {"id":4,  "char":"蒙", "name":"蒙卦",  "sub":"山下出泉，君子以果行育德",   "verdict":"童蒙求我，非我求童蒙。今日市场信号混乱如迷雾，你看多他看空，谁也不知道往哪走。此时最聪明的操作是……不操作。",       "action":"旁观学习", "position":"空仓 0成", "stoploss":"今日不入场", "time":"今日不宜", "luck":30, "tag":"凶"},
    {"id":5,  "char":"需", "name":"需卦",  "sub":"云上于天，君子以饮食宴乐",   "verdict":"等待时机，云层之上自有阳光。今日行情需要耐心，就像等外卖一样，催也没用，到点自然来。",                             "action":"等待做多", "position":"轻仓 2成", "stoploss":"破支撑即走", "time":"10:30 后入场", "luck":58, "tag":"平"},
    {"id":6,  "char":"讼", "name":"讼卦",  "sub":"天与水违行，君子以谋始",     "verdict":"争讼之象，多头空头互掐。今日市场多空分歧极大，容易被反复打脸。建议看戏不参与，保住本金就是胜利。",                   "action":"空仓看戏", "position":"空仓 0成", "stoploss":"不入场", "time":"不宜交易", "luck":28, "tag":"凶"},
    {"id":7,  "char":"师", "name":"师卦",  "sub":"地中有水，君子以容民畜众",   "verdict":"行军打仗，纪律为先。今日宜严格执行交易计划，如果你没有计划就别进场——没有纪律的交易者只是在赌博。",               "action":"按计划操作", "position":"中仓 5成", "stoploss":"严守止损线", "time":"全天皆可", "luck":65, "tag":"吉"},
    {"id":8,  "char":"比", "name":"比卦",  "sub":"地上有水，先王以建万国",     "verdict":"亲比辅助，跟随主力。今日适合跟随大资金方向，不要逆势单挑机构，大象跳舞时，散户要学会让路。",                       "action":"跟随主力", "position":"中仓 5成", "stoploss":"主力转向即出", "time":"09:45 确认后", "luck":70, "tag":"吉"},
    {"id":9,  "char":"小畜", "name":"小畜卦", "sub":"风行天上，君子以懿文德", "verdict":"小有积蓄，不宜过激。今日行情小打小闹，不会有大行情。薅点小羊毛可以，妄想一夜暴富就算了。",                           "action":"小仓短线", "position":"轻仓 3成", "stoploss":"盈3%止盈", "time":"尾盘15:00", "luck":60, "tag":"平"},
    {"id":10, "char":"履", "name":"履卦",  "sub":"上天下泽，君子以辨上下",     "verdict":"踩着老虎尾巴而不被咬，全靠走路姿势正确。今日高风险行情，严格止损是你唯一的护身符。",                               "action":"谨慎做多", "position":"轻仓 2成", "stoploss":"亏3%秒出", "time":"避开波动时段", "luck":52, "tag":"平"},
    {"id":11, "char":"泰", "name":"泰卦",  "sub":"天地交，泰；后以财成天地之道", "verdict":"天地交泰，万物通达。今日是难得的大吉之日，多空和谐，趋势如虹。此时不进场，更待何时？但也别太贪心。",             "action":"积极做多", "position":"重仓 7成", "stoploss":"移动止损", "time":"全天皆宜", "luck":90, "tag":"大吉"},
    {"id":12, "char":"否", "name":"否卦",  "sub":"天地不交，否；君子以俭德辟难", "verdict":"天地不交，万物不通。今日行情如便秘，涨不上去也跌不下来，就是让你难受。最好的策略是：关掉软件，去散步。",           "action":"全部空仓", "position":"空仓 0成", "stoploss":"不入场", "time":"今日不宜", "luck":18, "tag":"大凶"},
    {"id":13, "char":"同人", "name":"同人卦", "sub":"天与火，同人；君子以类族辨物", "verdict":"与人同心，其利断金。今日跟随市场共识方向，不要标新立异逆势操作。众人皆涨你做空，下场你懂的。",               "action":"顺势跟涨", "position":"中仓 5成", "stoploss":"群体转向即出", "time":"10:00 确认", "luck":75, "tag":"吉"},
    {"id":14, "char":"大有", "name":"大有卦", "sub":"火在天上，大有；君子以遏恶扬善", "verdict":"大丰收之象！火星高照财神，今日行情将大放异彩。管好你的贪念，该止盈时就止盈，别把煮熟的鸭子飞了。",           "action":"做多拿趋势", "position":"重仓 8成", "stoploss":"盈利10%止盈", "time":"开盘全天", "luck":92, "tag":"大吉"},
    {"id":15, "char":"谦", "name":"谦卦",  "sub":"地中有山，君子以裒多益寡",   "verdict":"谦虚使人进步，今日不要盲目自信。行情可能和你预判相反，降低仓位，保持谦逊，留得青山在。",                         "action":"降低仓位", "position":"轻仓 3成", "stoploss":"亏5%出场", "time":"午后谨慎", "luck":55, "tag":"平"},
    {"id":16, "char":"豫", "name":"豫卦",  "sub":"雷出地奋，豫；先王以作乐崇德", "verdict":"欢欣鼓舞，市场情绪高涨。今日做多情绪浓厚，FOMO情绪满溢。赚钱了记得开心，但别忘了止盈单。",                       "action":"顺势做多", "position":"中仓 6成", "stoploss":"情绪反转即出", "time":"09:30-11:30", "luck":78, "tag":"吉"},
    {"id":17, "char":"随", "name":"随卦",  "sub":"泽中有雷，随；君子以向晦入宴息", "verdict":"随时而动，因势利导。今日最佳策略是顺着市场走，不要预判，不要固执，市场说往哪走就往哪走，它是老大。",             "action":"跟随趋势", "position":"中仓 5成", "stoploss":"趋势破坏出场", "time":"确认方向后", "luck":68, "tag":"吉"},
    {"id":18, "char":"蛊", "name":"蛊卦",  "sub":"山下有风，蛊；君子以振民育德", "verdict":"积弊已深，需要整顿。今日可能出现大新闻、利空消息。提前降仓位，给自己留条退路，别做最后一个知道消息的人。",           "action":"降仓防风险", "position":"轻仓 2成", "stoploss":"消息出即走", "time":"消息公布前", "luck":35, "tag":"险"},
    {"id":19, "char":"临", "name":"临卦",  "sub":"泽上有地，临；君子以教思无穷", "verdict":"临近突破，机会将至。今日行情蓄势待发，等待关键位置突破信号。突破即进，假突破即走，别犹豫。",                       "action":"等突破进场", "position":"中仓 5成", "stoploss":"假突破即出", "time":"等待突破时", "luck":72, "tag":"吉"},
    {"id":20, "char":"观", "name":"观卦",  "sub":"风行地上，观；先王以省方观民", "verdict":"冷静观察，看清方向再动手。今日行情需要先观察再操作，进场前先看三根K线，别看见动静就冲进去。",                     "action":"先观察后入", "position":"观望为主", "stoploss":"看清再入场", "time":"观察1小时后", "luck":58, "tag":"平"},
    {"id":21, "char":"噬嗑", "name":"噬嗑卦", "sub":"雷电噬嗑，先王以明罚敕法", "verdict":"雷电交加，行情将有大波动。今日是高手收割韭菜的好日子。如果你不确定自己是高手，那你可能就是那把韭菜。",             "action":"谨慎高抛低吸", "position":"轻仓 2成", "stoploss":"严格止损", "time":"波动后再入", "luck":45, "tag":"险"},
    {"id":22, "char":"贲", "name":"贲卦",  "sub":"山下有火，贲；君子以明庶政", "verdict":"文采斐然，外表光鲜。今日行情看起来很美，但注意华而不实的陷阱。漂亮的K线背后可能是主力出货的烟雾弹。",               "action":"谨防诱多", "position":"轻仓观望", "stoploss":"看清再入场", "time":"避开诱多时段", "luck":48, "tag":"险"},
    {"id":23, "char":"剥", "name":"剥卦",  "sub":"山附于地，剥；上以厚下安宅", "verdict":"剥落之象，一层一层往下掉。今日行情可能持续下跌，就像剥洋葱，剥一层哭一层。坚决空仓，等到尘埃落定。",                 "action":"坚决空仓", "position":"空仓 0成", "stoploss":"不入场", "time":"等跌完再说", "luck":15, "tag":"大凶"},
    {"id":24, "char":"复", "name":"复卦",  "sub":"雷在地中，复；先王以至日闭关", "verdict":"一阳来复，黑暗过后是黎明。今日可能是反弹起点，但确认信号再入，不要刀口舔血抄底，被割了别哭。",                     "action":"轻仓试探抄底", "position":"轻仓 2成", "stoploss":"新低即出", "time":"低点确认后", "luck":55, "tag":"平"},
    {"id":25, "char":"无妄", "name":"无妄卦", "sub":"天下雷行，无妄；先王以茂对时育万物", "verdict":"无端之灾，莫名其妙的行情。今日可能出现意外消息或黑天鹅，做好最坏打算，严控仓位，别太自信。",               "action":"超轻仓防黑天鹅", "position":"轻仓 1成", "stoploss":"出问题秒出", "time":"全天谨慎", "luck":38, "tag":"险"},
    {"id":26, "char":"大畜", "name":"大畜卦", "sub":"天在山中，大畜；君子以多识前言往行", "verdict":"大量积蓄，蓄势待发。今日是布局的好时机，大资金在默默吸筹。跟着聪明钱方向走，静待爆发时刻。",               "action":"逢低布局", "position":"中仓 5成", "stoploss":"破布局区出", "time":"全天分批入", "luck":72, "tag":"吉"},
    {"id":27, "char":"颐", "name":"颐卦",  "sub":"山下有雷，颐；君子以慎言语节饮食", "verdict":"颐养之道，细水长流。今日不宜贪婪，小赚即走，落袋为安。就像吃饭，七分饱最健康，撑死了也是白搭。",               "action":"小赚止盈", "position":"轻仓 3成", "stoploss":"盈5%即走", "time":"尾盘止盈", "luck":60, "tag":"平"},
    {"id":28, "char":"大过", "name":"大过卦", "sub":"泽灭木，大过；君子以独立不惧", "verdict":"大过其分，物极必反。今日行情可能已经过度，无论涨跌都面临回调压力。独立判断，不随大流，高抛低吸。",               "action":"反向操作", "position":"轻仓 2成", "stoploss":"止损要快", "time":"高点看空低点看多", "luck":42, "tag":"险"},
    {"id":29, "char":"坎", "name":"坎卦",  "sub":"水洊至，习坎；君子以常德行", "verdict":"险水重重，暗流涌动。今日做单如逆水行舟，稍有不慎满盘皆输。若必须出手，严格止损，小赚即走，别恋战。",               "action":"严守止损", "position":"轻仓 2成", "stoploss":"亏3%秒离", "time":"避开开盘1小时", "luck":32, "tag":"凶"},
    {"id":30, "char":"离", "name":"离卦",  "sub":"明两作，离；大人以继明照四方", "verdict":"烈日当空，光明普照。今日行情一目了然，趋势清晰如明镜。顺势而为，该拿的利润别轻易跑路，太阳出来晒被子。",             "action":"持仓拿趋势", "position":"重仓 6成", "stoploss":"移动止损跟涨", "time":"全天皆宜", "luck":82, "tag":"大吉"},
    {"id":31, "char":"咸", "name":"咸卦",  "sub":"山上有泽，咸；君子以虚受人", "verdict":"感应相通，市场共鸣。今日情绪面与技术面高度配合，入场时机成熟。但感情用事是交易大忌，理性第一。",                   "action":"理性做多", "position":"中仓 5成", "stoploss":"情绪化则止损", "time":"10:00 确认", "luck":70, "tag":"吉"},
    {"id":32, "char":"恒", "name":"恒卦",  "sub":"雷风恒，君子以立不易方",     "verdict":"恒久不变，坚持就是胜利。今日趋势延续，长线持有者迎来收获时刻。不要被短线波动吓跑，钻石手才能拿到利润。",             "action":"长线持有", "position":"重仓 7成", "stoploss":"趋势不变不动", "time":"全天持有", "luck":80, "tag":"大吉"},
    {"id":33, "char":"遯", "name":"遯卦",  "sub":"天下有山，遯；君子以远小人", "verdict":"识时务者为俊杰，果断撤退是一种智慧。今日形势不利于多头，与其硬撑，不如优雅离场，保住子弹等下次机会。",               "action":"止盈撤退", "position":"清仓离场", "stoploss":"有赚就跑", "time":"开盘后快速撤", "luck":40, "tag":"险"},
    {"id":34, "char":"大壮", "name":"大壮卦", "sub":"雷在天上，大壮；君子以非礼弗履", "verdict":"气势磅礴，阳刚大盛。今日多头力量强劲，但过于强壮容易过激。7成仓位拿趋势，留余地给回调，别把仓位用尽。",           "action":"做多留余地", "position":"重仓 7成", "stoploss":"回调超5%减仓", "time":"全天", "luck":85, "tag":"大吉"},
    {"id":35, "char":"晋", "name":"晋卦",  "sub":"明出地上，晋；君子以自昭明德", "verdict":"旭日东升，蒸蒸日上。今日行情如日中天，上升趋势明确。大胆做多，但要设好止盈目标，天上不会永远是艳阳天。",             "action":"积极做多", "position":"重仓 6成", "stoploss":"设好止盈目标", "time":"09:30-14:00", "luck":83, "tag":"大吉"},
    {"id":36, "char":"明夷", "name":"明夷卦", "sub":"明入地中，明夷；君子以莅众", "verdict":"光明受损，黑暗当道。今日利空消息压顶，市场如黑云压城。暂时韬光养晦，保住本金，黑暗过后终会迎来黎明。",             "action":"清仓保本", "position":"空仓 0成", "stoploss":"不入场", "time":"等消息消化后", "luck":20, "tag":"大凶"},
    {"id":37, "char":"家人", "name":"家人卦", "sub":"风自火出，家人；君子以言有物而行有恒", "verdict":"家庭和睦，各司其职。今日市场各板块轮动有序，做好自己熟悉的领域，不要跨界乱炒，专注是最大优势。",             "action":"专注熟悉品种", "position":"中仓 5成", "stoploss":"超出能力圈即出", "time":"全天稳健操作", "luck":68, "tag":"吉"},
    {"id":38, "char":"睽", "name":"睽卦",  "sub":"上火下泽，睽；君子以同而异", "verdict":"背道而驰，多空极度分裂。今日市场可能出现反常走势，与你预期完全相反。降低仓位，保持敬畏，市场比你聪明。",             "action":"降仓保守", "position":"轻仓 2成", "stoploss":"第一时间止损", "time":"避免频繁操作", "luck":35, "tag":"险"},
    {"id":39, "char":"蹇", "name":"蹇卦",  "sub":"山上有水，蹇；君子以反身修德", "verdict":"步履维艰，寸步难行。今日做单如跋山涉水，每一步都很痛苦。与其强行入场，不如回头检讨自己的交易系统。",               "action":"暂停交易", "position":"空仓反思", "stoploss":"今日不入场", "time":"闭关修炼", "luck":22, "tag":"凶"},
    {"id":40, "char":"解", "name":"解卦",  "sub":"雷雨作，解；君子以赦过宥罪", "verdict":"解除困难，柳暗花明。昨日的阴霾今日散去，市场重拾上升动力。积极把握反弹机会，但仍需小心，步子不要太大。",               "action":"把握反弹", "position":"中仓 5成", "stoploss":"反弹不成即出", "time":"确认反弹后", "luck":65, "tag":"吉"},
    {"id":41, "char":"损", "name":"损卦",  "sub":"山下有泽，损；君子以惩忿窒欲", "verdict":"有所损失，才有所得。今日行情可能先跌后涨，不要见跌就慌。控制情绪，等待抄底机会，有耐心的人才能笑到最后。",             "action":"等回调买入", "position":"轻仓 3成", "stoploss":"回调过深出场", "time":"等回调确认", "luck":55, "tag":"平"},
    {"id":42, "char":"益", "name":"益卦",  "sub":"风雷益，君子以见善则迁",     "verdict":"增益之卦，利上加利。今日财运双星拱照，做多就涨，止盈就对了。不要贪心想着翻倍，落袋的才是真的钱。",                 "action":"做多落袋安", "position":"中仓 6成", "stoploss":"盈8%止盈", "time":"全天皆宜", "luck":82, "tag":"大吉"},
    {"id":43, "char":"夬", "name":"夬卦",  "sub":"泽上于天，夬；君子以施禄及下", "verdict":"决断之时，不可犹豫。今日出现关键突破信号，必须果断出手。机会不等人，该进就进，该出就出，优柔寡断必吃亏。",           "action":"果断突破入场", "position":"重仓 7成", "stoploss":"假突破即斩", "time":"突破那一刻", "luck":86, "tag":"大吉"},
    {"id":44, "char":"姤", "name":"姤卦",  "sub":"天下有风，姤；后以施命诰四方", "verdict":"意外相遇，防不胜防。今日可能出现意外利空，搞得你措手不及。重仓者今日要小心，降低仓位过一天好日子。",               "action":"降仓防意外", "position":"轻仓 2成", "stoploss":"意外出现秒出", "time":"全天谨慎", "luck":40, "tag":"险"},
    {"id":45, "char":"萃", "name":"萃卦",  "sub":"泽上于地，萃；君子以除戎器", "verdict":"聚集之象，资金汇聚。今日主力资金可能大规模入场，跟着聪明钱走，抱团取暖。注意辨别真假聚集。",                       "action":"跟随主力聚集", "position":"中仓 5成", "stoploss":"主力离场即出", "time":"资金确认后", "luck":72, "tag":"吉"},
    {"id":46, "char":"升", "name":"升卦",  "sub":"地中生木，升；君子以顺德积小以高大", "verdict":"步步高升，节节攀爬。今日趋势向上且稳健，如竹子生长，一节一节往上。稳扎稳打，逢回调加仓，享受慢牛乐趣。",         "action":"逢回调加仓", "position":"中仓 6成", "stoploss":"回调超3%停加", "time":"回调时入场", "luck":78, "tag":"吉"},
    {"id":47, "char":"困", "name":"困卦",  "sub":"泽无水，困；君子以致命遂志", "verdict":"身陷囹圄，进退两难。今日行情把你困在套牢区，越挣扎越深陷。此刻最好的操作是承认错误，割肉离场，明日东山再起。",         "action":"割肉止损", "position":"清仓离场", "stoploss":"立刻止损", "time":"越早越好", "luck":18, "tag":"大凶"},
    {"id":48, "char":"井", "name":"井卦",  "sub":"木上有水，井；君子以劳民劝相", "verdict":"取之不尽的水井，持续稳定。今日适合稳健操作，不追求暴利，做好每一单基本操作，日积月累才是正道。",                   "action":"稳健操作", "position":"中仓 4成", "stoploss":"严格止损", "time":"全天", "luck":62, "tag":"平"},
    {"id":49, "char":"革", "name":"革卦",  "sub":"泽中有火，革；君子以治历明时", "verdict":"革故鼎新，大变局来临。今日市场将发生重大转折，趋势可能完全反转。提前准备，随时调整方向，固执只会被市场教育。",         "action":"准备反转", "position":"轻仓 2成", "stoploss":"转折确认后建仓", "time":"等信号确认", "luck":50, "tag":"平"},
    {"id":50, "char":"鼎", "name":"鼎卦",  "sub":"木上有火，鼎；君子以正位凝命", "verdict":"鼎立天下，稳若泰山。今日行情稳健，适合稳定持仓，不需要频繁操作。做好你的交易系统，收获是水到渠成的事。",             "action":"稳定持仓", "position":"中仓 5成", "stoploss":"计划止损", "time":"全天持有", "luck":70, "tag":"吉"},
    {"id":51, "char":"震", "name":"震卦",  "sub":"洊雷，震；君子以恐惧修省",   "verdict":"雷霆万钧，变局骤至。今日黑天鹅或出没，市场剧烈震荡。不要逞强，空仓保命，留得子弹在，来日方长。",                   "action":"全仓空仓", "position":"空仓 0成", "stoploss":"今日不入场", "time":"今日凶，勿交易", "luck":25, "tag":"凶"},
    {"id":52, "char":"艮", "name":"艮卦",  "sub":"兼山，艮；君子以思不出其位", "verdict":"泰山静默，以静制动。今日市场磨人心志，上下拉锯不停。你的最大优势是不动，空仓也是一种极佳的仓位。",                   "action":"按兵不动", "position":"空仓 0成", "stoploss":"今日无需止损", "time":"等待明日", "luck":48, "tag":"险"},
    {"id":53, "char":"渐", "name":"渐卦",  "sub":"山上有木，渐；君子以居贤德善俗", "verdict":"循序渐进，水到渠成。今日行情需要耐心，不会一步到位。分批建仓，慢慢等待，急躁只会让你频繁进出损耗本金。",             "action":"分批建仓", "position":"轻仓分批", "stoploss":"每批独立止损", "time":"分3次入场", "luck":65, "tag":"吉"},
    {"id":54, "char":"归妹", "name":"归妹卦", "sub":"泽上有雷，归妹；君子以永终知敝", "verdict":"冲动是魔鬼，今日行情容易让人冲动操作。像看到美女就冲动一样，冷静下来想想再说，冲动下单十有九亏。",             "action":"冷静不冲动", "position":"轻仓 2成", "stoploss":"冲动单全部止损", "time":"冷静后再入场", "luck":38, "tag":"险"},
    {"id":55, "char":"丰", "name":"丰卦",  "sub":"雷电皆至，丰；君子以折狱致刑", "verdict":"丰收之象，盈溢四方。今日行情极度亢奋，赚钱效应全面爆发。大胆入场，但记住丰收之后往往是寒冬，留好止盈单。",           "action":"积极做多", "position":"重仓 8成", "stoploss":"止盈10%", "time":"全天收割", "luck":90, "tag":"大吉"},
    {"id":56, "char":"旅", "name":"旅卦",  "sub":"山上有火，旅；君子以明慎用刑", "verdict":"旅途漂泊，人地两生。今日行情进入陌生区域，高低点不明确。就像第一次去陌生城市，先观察环境，不要乱跑。",               "action":"轻仓探路", "position":"轻仓 2成", "stoploss":"探路亏3%出", "time":"谨慎入场", "luck":42, "tag":"险"},
    {"id":57, "char":"巽", "name":"巽卦",  "sub":"随风入，巽；君子以申命行事", "verdict":"清风徐来，波纹不兴。今日行情温和，宜小步前进。如春风化雨，慢慢渗入，切忌追涨杀跌，润物细无声才是王道。",             "action":"小步加仓", "position":"中仓 5成", "stoploss":"回撤3%减半", "time":"10:30 温和入", "luck":66, "tag":"吉"},
    {"id":58, "char":"兑", "name":"兑卦",  "sub":"丽泽，兑；君子以朋友讲习",   "verdict":"喜悦之象，财星高照。今日市场人心向好，做多情绪浓厚。小赚不嫌少，落袋为安，切莫贪心把到嘴的肉再吐出来。",             "action":"做多落袋安", "position":"中仓 5成", "stoploss":"盈5%止盈", "time":"尾盘15:00", "luck":75, "tag":"吉"},
    {"id":59, "char":"涣", "name":"涣卦",  "sub":"风行水上，涣；先王以享于帝", "verdict":"涣散之象，人心浮动。今日多空信心皆散，成交量萎缩，方向不明。在方向明确前，不要白白耗费精力和资金。",                 "action":"等待方向", "position":"空仓等待", "stoploss":"方向明确再入", "time":"等成交量放大", "luck":44, "tag":"险"},
    {"id":60, "char":"节", "name":"节卦",  "sub":"泽上有水，节；君子以制数度议德行", "verdict":"节制有度，不可过分。今日提醒你控制贪婪，不要满仓梭哈，不要加杠杆赌身家。节制是交易者最重要的美德。",             "action":"严控仓位", "position":"中仓 4成", "stoploss":"严格执行计划", "time":"全天", "luck":60, "tag":"平"},
    {"id":61, "char":"中孚", "name":"中孚卦", "sub":"泽上有风，中孚；君子以议狱缓死", "verdict":"诚信居中，信号可靠。今日技术信号较为可信，按照系统交易信号操作，不要过度解读，相信你的交易系统。",               "action":"按信号操作", "position":"中仓 5成", "stoploss":"信号失效即出", "time":"信号触发时", "luck":70, "tag":"吉"},
    {"id":62, "char":"小过", "name":"小过卦", "sub":"山上有雷，小过；君子以行过乎恭", "verdict":"小有过失，无伤大雅。今日行情小幅偏离预期，但大方向没有问题。不要因为小亏就慌乱，坚持计划，小错不断是进步。",         "action":"小仓纠偏", "position":"轻仓 3成", "stoploss":"小亏即纠正", "time":"谨慎操作", "luck":52, "tag":"平"},
    {"id":63, "char":"既济", "name":"既济卦", "sub":"水在火上，既济；君子以思患而预防", "verdict":"大功告成，但居安思危。今日或许已经到达阶段性高点，应该考虑获利了结，不要等到既成的利润又亏掉。",                 "action":"止盈离场", "position":"逐步清仓", "stoploss":"盈利保护", "time":"今日止盈", "luck":72, "tag":"吉"},
    {"id":64, "char":"未济", "name":"未济卦", "sub":"火在水上，未济；君子以慎辨物居方", "verdict":"事情还没完，行情尚未结束。今日不要急于盖棺定论，市场仍有变数。保持灵活，不要押注单一方向，做好两手准备。",         "action":"双向准备", "position":"轻仓灵活", "stoploss":"随时调整方向", "time":"保持灵活", "luck":55, "tag":"平"},
]


def _hash_code(s: str) -> int:
    """djb2 hash variant with XOR, matching the TypeScript implementation."""
    h = 5381
    for ch in s:
        h = ((h << 5) + h) ^ ord(ch)
        h &= 0xFFFFFFFF  # keep as 32-bit unsigned
    return h


def _get_daily_gua(user_id: str) -> dict:
    """Get a fixed daily gua for this user (same user + same day = same gua)."""
    now = datetime.now()
    date_str = f"{now.year}{now.month}{now.day}"
    seed = _hash_code(f"{user_id}-{date_str}")
    idx = seed % len(GUA_LIST)
    return GUA_LIST[idx]


def _get_reroll_gua(user_id: str) -> dict:
    """Get a random gua (different each call) using userId + timestamp."""
    import time
    seed = _hash_code(f"{user_id}-{time.time_ns()}")
    idx = seed % len(GUA_LIST)
    return GUA_LIST[idx]


def _get_user_id(request: Request) -> str:
    """Extract user identifier from request: cookie → auth header → IP."""
    session_id = request.cookies.get("session-id")
    if session_id:
        return session_id

    auth = request.headers.get("authorization")
    if auth:
        return auth.replace("Bearer ", "")

    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()

    if request.client:
        return request.client.host

    return "anonymous"


@router.get("")
async def get_fortune(request: Request, reroll: int = 0):
    """
    GET /api/fortune         → 返回当前用户今日卦象（每天固定）
    GET /api/fortune?reroll=1 → 重新随机（每次不同）
    """
    user_id = _get_user_id(request)

    if reroll == 1:
        gua = _get_reroll_gua(user_id)
    else:
        gua = _get_daily_gua(user_id)

    masked_id = user_id[:8] + "***" if len(user_id) > 8 else user_id
    today_str = datetime.now().strftime("%Y年%m月%d日")

    return {
        "gua": gua,
        "userId": masked_id,
        "date": today_str,
        "cached": reroll != 1,
    }
