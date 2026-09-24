// src/utils/i18n.ts

// 中英文对照表
export const translations = {
  // 属性名称
  courage: '勇气',
  wisdom: '智慧',
  charisma: '魅力',
  strength: '力量',
  intelligence: '智力',
  dexterity: '敏捷',
  constitution: '体质',
  
  // 物品名称
  torch: '火把',
  key: '钥匙',
  sword: '剑',
  shield: '盾',
  potion: '药水',
  
  // 状态
  hit: '命中',
  miss: '未命中',
  cached: '已缓存',
  fresh: '新鲜数据',
  
  // 通用词汇
  Continue: '继续',
  Update: '更新',
  Save: '保存',
  Edit: '编辑',
  Delete: '删除',
  Start: '开始',
  Create: '创建',
  Choice: '选择',
  Choices: '选择项',
  Story: '故事',
  Node: '节点',
  Content: '内容',
  Title: '标题',
  Description: '描述',
  Requirement: '需求',
  Requirements: '需求项',
  Attributes: '属性',
  Inventory: '背包',
  History: '历史',
  Events: '事件',
  Performance: '性能',
  Metrics: '指标',
  Dashboard: '仪表板',
  Timeline: '时间线',
  Features: '特性',
  Edge: '边缘',
  Location: '位置',
  Time: '时间',
  Model: '模型',
  Tokens: '令牌',
  Optimized: '优化',
  Caching: '缓存',
  Routing: '路由',
  Generated: '生成',
  Generation: '生成',
  Computing: '计算',
  Acceleration: '加速',
  Protection: '保护',
  Platform: '平台',
  Native: '原生',
  Interactive: '互动',
  Narrative: '叙事',
  Branching: '分支',
  Paths: '路径',
  Power: '动力',
  AI: '人工智能',
  Storytelling: '故事讲述',
  Experience: '体验',
  Latency: '延迟',
  Minimal: '最低',
  Dynamically: '动态地',
  Shaped: '塑造',
  Meaningful: '有意义的',
  Ways: '方式',
  MeaningfulWays: '有意义的方式',
};

// 翻译函数
export const t = (key: string): string => {
  return translations[key as keyof typeof translations] || key;
};

// 批量翻译属性对象
export const translateAttributes = (attributes: Record<string, any>): Record<string, any> => {
  const translated: Record<string, any> = {};
  for (const [key, value] of Object.entries(attributes)) {
    const translatedKey = t(key);
    translated[translatedKey] = value;
  }
  return translated;
};

// 批量翻译物品对象
export const translateInventory = (inventory: Record<string, number>): Record<string, number> => {
  const translated: Record<string, number> = {};
  for (const [key, value] of Object.entries(inventory)) {
    if (value > 0) {
      const translatedKey = t(key);
      translated[translatedKey] = value;
    }
  }
  return translated;
};