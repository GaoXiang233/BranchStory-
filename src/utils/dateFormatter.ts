// src/utils/dateFormatter.ts

/**
 * 格式化日期时间为中文友好格式
 */
export const formatChineseDateTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return '刚刚';
  } else if (diffMin < 60) {
    return `${diffMin}分钟前`;
  } else if (diffHour < 24) {
    return `${diffHour}小时前`;
  } else if (diffDay < 7) {
    return `${diffDay}天前`;
  } else {
    return date.toLocaleDateString('zh-CN');
  }
};

/**
 * 格式化时间为12小时制或24小时制
 */
export const formatChineseTime = (date: Date, use24Hour: boolean = true): string => {
  if (use24Hour) {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  } else {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  }
};

/**
 * 格式化日期
 */
export const formatChineseDate = (date: Date): string => {
  return date.toLocaleDateString('zh-CN');
};

/**
 * 中文友好的完整日期时间格式
 */
export const formatChineseDateTimeFull = (date: Date): string => {
  return date.toLocaleString('zh-CN');
};