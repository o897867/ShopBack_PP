//+------------------------------------------------------------------+
//|                                            OneClickTrading.mq5    |
//|                                                                  |
//+------------------------------------------------------------------+
#property copyright "Trading Tool"
#property version   "1.00"
#property strict

#include <Trade\Trade.mqh>

// 输入参数
input string   Symbol_Buy = "EURUSD";          // 开多单的品种
input string   Symbol_Sell = "GBPUSD";         // 开空单的品种
input double   Lot_Size = 0.1;                 // 手数
input int      Slippage = 10;                  // 滑点
input double   Target_Profit = 100.0;          // 目标盈利金额（美元）
input int      Magic_Number = 123456;          // 魔术数字
input bool     Enable_Hotkeys = true;          // 启用快捷键
input string   Hotkey_Info = "Q=全平 W=开多空 E=检查盈利 C=平指定品种"; // 快捷键说明

// 全局变量
CTrade trade;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
    trade.SetExpertMagicNumber(Magic_Number);
    trade.SetDeviationInPoints(Slippage);
    
    // 创建按钮
    CreateButton("BtnCloseAll", "一键全平", 10, 30, 150, 30, clrRed);
    CreateButton("BtnOpenBoth", "开多空单", 10, 70, 150, 30, clrBlue);
    CreateButton("BtnCheckProfit", "检查盈利", 10, 110, 150, 30, clrGreen);
    
    // 显示快捷键提示
    if(Enable_Hotkeys)
    {
        CreateLabel("LblHotkey", "快捷键: Q=全平 W=开多空 E=检查盈利 C=平指定品种", 10, 150);
        string trade_info = "多单品种: " + Symbol_Buy + " | 空单品种: " + Symbol_Sell;
        CreateLabel("LblTradeInfo", trade_info, 10, 170);
    }
    
    Print("交易工具初始化成功");
    return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
    // 删除按钮
    ObjectDelete(0, "BtnCloseAll");
    ObjectDelete(0, "BtnOpenBoth");
    ObjectDelete(0, "BtnCheckProfit");
    ObjectDelete(0, "LblHotkey");
    ObjectDelete(0, "LblTradeInfo");
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
    // 自动检查盈利并平仓
    CheckAndCloseProfitPositions();
}

//+------------------------------------------------------------------+
//| ChartEvent function                                              |
//+------------------------------------------------------------------+
void OnChartEvent(const int id,
                  const long &lparam,
                  const double &dparam,
                  const string &sparam)
{
    // 按钮点击事件
    if(id == CHARTEVENT_OBJECT_CLICK)
    {
        if(sparam == "BtnCloseAll")
        {
            CloseAllPositions();
            ObjectSetInteger(0, "BtnCloseAll", OBJPROP_STATE, false);
        }
        else if(sparam == "BtnOpenBoth")
        {
            OpenBuyAndSell();
            ObjectSetInteger(0, "BtnOpenBoth", OBJPROP_STATE, false);
        }
        else if(sparam == "BtnCheckProfit")
        {
            CheckAndCloseProfitPositions();
            ObjectSetInteger(0, "BtnCheckProfit", OBJPROP_STATE, false);
        }
    }
    
    // 快捷键事件
    if(Enable_Hotkeys && id == CHARTEVENT_KEYDOWN)
    {
        HandleHotkey(lparam);
    }
}

//+------------------------------------------------------------------+
//| 创建标签函数                                                      |
//+------------------------------------------------------------------+
void CreateLabel(string name, string text, int x, int y)
{
    ObjectCreate(0, name, OBJ_LABEL, 0, 0, 0);
    ObjectSetInteger(0, name, OBJPROP_XDISTANCE, x);
    ObjectSetInteger(0, name, OBJPROP_YDISTANCE, y);
    ObjectSetString(0, name, OBJPROP_TEXT, text);
    ObjectSetInteger(0, name, OBJPROP_COLOR, clrYellow);
    ObjectSetInteger(0, name, OBJPROP_FONTSIZE, 9);
    ObjectSetInteger(0, name, OBJPROP_CORNER, CORNER_LEFT_UPPER);
}

//+------------------------------------------------------------------+
//| 处理快捷键                                                        |
//+------------------------------------------------------------------+
void HandleHotkey(long key_code)
{
    switch(key_code)
    {
        case 81:  // Q键 - 一键全平
            Print("快捷键触发: Q - 一键全平");
            CloseAllPositions();
            break;
            
        case 87:  // W键 - 开多空单
            Print("快捷键触发: W - 开多空单");
            OpenBuyAndSell();
            break;
            
        case 69:  // E键 - 检查盈利
            Print("快捷键触发: E - 检查盈利");
            CheckAndCloseProfitPositions();
            break;
            
        case 67:  // C键 - 关闭指定品种所有订单
            Print("快捷键触发: C - 关闭指定品种订单");
            CloseSymbolPositions(Symbol_Buy);
            CloseSymbolPositions(Symbol_Sell);
            break;
    }
}

//+------------------------------------------------------------------+
//| 创建按钮函数                                                      |
//+------------------------------------------------------------------+
void CreateButton(string name, string text, int x, int y, int width, int height, color clr)
{
    ObjectCreate(0, name, OBJ_BUTTON, 0, 0, 0);
    ObjectSetInteger(0, name, OBJPROP_XDISTANCE, x);
    ObjectSetInteger(0, name, OBJPROP_YDISTANCE, y);
    ObjectSetInteger(0, name, OBJPROP_XSIZE, width);
    ObjectSetInteger(0, name, OBJPROP_YSIZE, height);
    ObjectSetString(0, name, OBJPROP_TEXT, text);
    ObjectSetInteger(0, name, OBJPROP_COLOR, clrWhite);
    ObjectSetInteger(0, name, OBJPROP_BGCOLOR, clr);
    ObjectSetInteger(0, name, OBJPROP_BORDER_COLOR, clrBlack);
    ObjectSetInteger(0, name, OBJPROP_BORDER_TYPE, BORDER_RAISED);
    ObjectSetInteger(0, name, OBJPROP_CORNER, CORNER_LEFT_UPPER);
    ObjectSetInteger(0, name, OBJPROP_FONTSIZE, 10);
    ObjectSetInteger(0, name, OBJPROP_SELECTABLE, false);
}

//+------------------------------------------------------------------+
//| 一键全部平仓                                                      |
//+------------------------------------------------------------------+
void CloseAllPositions()
{
    int total = PositionsTotal();
    int closed = 0;
    
    Print("开始平仓，当前持仓数: ", total);
    
    for(int i = total - 1; i >= 0; i--)
    {
        ulong ticket = PositionGetTicket(i);
        if(ticket > 0)
        {
            if(PositionSelectByTicket(ticket))
            {
                if(trade.PositionClose(ticket))
                {
                    closed++;
                    Print("成功平仓订单: ", ticket);
                }
                else
                {
                    Print("平仓失败，订单: ", ticket, " 错误: ", GetLastError());
                }
            }
        }
    }
    
    Print("平仓完成，成功平仓: ", closed, " 笔");
    Comment("已平仓 ", closed, " 笔订单");
}

//+------------------------------------------------------------------+
//| 同时开多空单（不同品种）                                          |
//+------------------------------------------------------------------+
void OpenBuyAndSell()
{
    double ask_buy = SymbolInfoDouble(Symbol_Buy, SYMBOL_ASK);
    double bid_sell = SymbolInfoDouble(Symbol_Sell, SYMBOL_BID);
    
    bool buy_result = false;
    bool sell_result = false;
    
    // 开多单 - 品种A
    if(trade.Buy(Lot_Size, Symbol_Buy, ask_buy, 0, 0, "多单-" + Symbol_Buy))
    {
        Print("成功开多单: ", Symbol_Buy, " 价格: ", ask_buy);
        buy_result = true;
    }
    else
    {
        Print("开多单失败，品种: ", Symbol_Buy, " 错误: ", GetLastError());
    }
    
    // 开空单 - 品种B
    if(trade.Sell(Lot_Size, Symbol_Sell, bid_sell, 0, 0, "空单-" + Symbol_Sell))
    {
        Print("成功开空单: ", Symbol_Sell, " 价格: ", bid_sell);
        sell_result = true;
    }
    else
    {
        Print("开空单失败，品种: ", Symbol_Sell, " 错误: ", GetLastError());
    }
    
    // 显示结果
    string result_msg = "";
    if(buy_result && sell_result)
    {
        result_msg = "已开 " + Symbol_Buy + " 多单 + " + Symbol_Sell + " 空单";
    }
    else if(buy_result)
    {
        result_msg = "已开 " + Symbol_Buy + " 多单（空单失败）";
    }
    else if(sell_result)
    {
        result_msg = "已开 " + Symbol_Sell + " 空单（多单失败）";
    }
    else
    {
        result_msg = "开仓失败";
    }
    
    Comment(result_msg);
    Print(result_msg);
}

//+------------------------------------------------------------------+
//| 检查盈利并平仓                                                    |
//+------------------------------------------------------------------+
void CheckAndCloseProfitPositions()
{
    double total_profit = 0;
    int position_count = 0;
    
    // 计算总盈利
    for(int i = 0; i < PositionsTotal(); i++)
    {
        ulong ticket = PositionGetTicket(i);
        if(ticket > 0)
        {
            if(PositionSelectByTicket(ticket))
            {
                total_profit += PositionGetDouble(POSITION_PROFIT);
                total_profit += PositionGetDouble(POSITION_SWAP);
                position_count++;
            }
        }
    }
    
    Comment("持仓数: ", position_count, " | 总盈利: $", DoubleToString(total_profit, 2));
    
    // 如果达到目标盈利，全部平仓
    if(total_profit >= Target_Profit && position_count > 0)
    {
        Print("达到目标盈利 $", total_profit, "，开始平仓...");
        CloseAllPositions();
        Alert("已达到目标盈利 $", DoubleToString(total_profit, 2), "，已全部平仓！");
    }
}

//+------------------------------------------------------------------+
//| 关闭指定品种的所有持仓                                            |
//+------------------------------------------------------------------+
void CloseSymbolPositions(string symbol)
{
    int total = PositionsTotal();
    int closed = 0;
    
    Print("开始平仓品种: ", symbol);
    
    for(int i = total - 1; i >= 0; i--)
    {
        ulong ticket = PositionGetTicket(i);
        if(ticket > 0)
        {
            if(PositionSelectByTicket(ticket))
            {
                string pos_symbol = PositionGetString(POSITION_SYMBOL);
                if(pos_symbol == symbol)
                {
                    if(trade.PositionClose(ticket))
                    {
                        closed++;
                        Print("成功平仓 ", symbol, " 订单: ", ticket);
                    }
                    else
                    {
                        Print("平仓失败，订单: ", ticket, " 错误: ", GetLastError());
                    }
                }
            }
        }
    }
    
    Print(symbol, " 平仓完成，成功平仓: ", closed, " 笔");
    Comment("已平仓 ", symbol, " ", closed, " 笔订单");
}

//+------------------------------------------------------------------+