export interface AirlineRule {
  id: string;
  name: string;
  aliases: string[]; // 用于 AI 或正则匹配的别名，如 "EVA Air", "长荣"
  defaultCheckedAllowance: number; // kg
  defaultCarryOnAllowance: number; // kg
  defaultPersonalAllowance: number; // kg
  maxDimensions: string; // 行李尺寸限制，例如 "56x36x23 cm"
  notes: string; // 特殊规定
}

export const AIRLINE_RULES: AirlineRule[] = [
  {
    id: "eva",
    name: "长荣航空 (EVA Air)",
    aliases: ["eva", "eva air", "长荣", "長榮", "br"],
    defaultCheckedAllowance: 23,
    defaultCarryOnAllowance: 7,
    defaultPersonalAllowance: 3, // 电脑包等通常不限重，但有个隐形规范
    maxDimensions: "56x36x23 cm",
    notes: "经济舱通常包含1件23kg托运行李。登机箱不可超过7kg。"
  },
  {
    id: "china_airlines",
    name: "中华航空 (China Airlines)",
    aliases: ["china airlines", "华航", "華航", "ci"],
    defaultCheckedAllowance: 23,
    defaultCarryOnAllowance: 7,
    defaultPersonalAllowance: 3,
    maxDimensions: "56x36x23 cm",
    notes: "经济舱（乐活）包含1件23kg，登机箱7kg。"
  },
  {
    id: "tigerair",
    name: "台湾虎航 (Tigerair Taiwan)",
    aliases: ["tigerair", "tiger", "虎航", "it"],
    defaultCheckedAllowance: 0, // 廉航通常不含托运
    defaultCarryOnAllowance: 10, // 手提+随身合计10kg
    defaultPersonalAllowance: 0, // 合并计算
    maxDimensions: "54x38x23 cm",
    notes: "手提行李与个人随身物品合计不得超过10kg。托运行李需额外购买。"
  },
  {
    id: "airasia",
    name: "亚洲航空 (AirAsia)",
    aliases: ["airasia", "亚航", "亞航", "ak", "d7", "xj"],
    defaultCheckedAllowance: 0,
    defaultCarryOnAllowance: 7,
    defaultPersonalAllowance: 0, // 合计7kg
    maxDimensions: "56x36x23 cm",
    notes: "手提行李(含个人小包)最多2件，总重量不可超过7kg。托运需额外购买。"
  },
  {
    id: "ana",
    name: "全日空 (ANA)",
    aliases: ["ana", "all nippon airways", "全日空", "nh"],
    defaultCheckedAllowance: 23, // 很多时候是2件23kg
    defaultCarryOnAllowance: 10,
    defaultPersonalAllowance: 0, // 合计10kg
    maxDimensions: "55x40x25 cm",
    notes: "经济舱通常包含2件23kg托运行李。随身行李合计不超过10kg。"
  },
  {
    id: "jal",
    name: "日本航空 (JAL)",
    aliases: ["jal", "japan airlines", "日航", "jl"],
    defaultCheckedAllowance: 23, // 通常2件23kg
    defaultCarryOnAllowance: 10,
    defaultPersonalAllowance: 0,
    maxDimensions: "55x40x25 cm",
    notes: "经济舱包含2件23kg托运行李。随身手提行李合计不超过10kg。"
  },
  {
    id: "peach",
    name: "乐桃航空 (Peach Aviation)",
    aliases: ["peach", "乐桃", "樂桃", "mm"],
    defaultCheckedAllowance: 0,
    defaultCarryOnAllowance: 7,
    defaultPersonalAllowance: 0,
    maxDimensions: "50x40x25 cm",
    notes: "随身行李最多2件，合计不得超过7kg。托运行李需购买。"
  },
  {
    id: "cx",
    name: "国泰航空 (Cathay Pacific)",
    aliases: ["cathay", "cathay pacific", "国泰", "國泰", "cx"],
    defaultCheckedAllowance: 23,
    defaultCarryOnAllowance: 7,
    defaultPersonalAllowance: 0, // 合计7kg
    maxDimensions: "56x36x23 cm",
    notes: "轻便飞(Light)票价包含1件23kg托运，登机箱合计7kg。"
  }
];

export const findAirlineRule = (airlineName: string): AirlineRule | undefined => {
  const normalized = airlineName.toLowerCase();
  return AIRLINE_RULES.find(rule => 
    rule.aliases.some(alias => normalized.includes(alias))
  );
};
