export function base64Encode(str: string) {
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let out = '', i = 0, len = str.length, c1, c2, c3;
    
    while (i < len) {
      c1 = str.charCodeAt(i++) & 0xff;
      if (i === len) {
        out += CHARS.charAt(c1 >> 2);
        out += CHARS.charAt((c1 & 0x3) << 4);
        out += '==';
        break;
      }
      c2 = str.charCodeAt(i++);
      if (i === len) {
        out += CHARS.charAt(c1 >> 2);
        out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
        out += CHARS.charAt((c2 & 0xF) << 2);
        out += '=';
        break;
      }
      c3 = str.charCodeAt(i++);
      out += CHARS.charAt(c1 >> 2);
      out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
      out += CHARS.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
      out += CHARS.charAt(c3 & 0x3F);
    }
    return out;
}

// 梅登海德坐标转经纬度
export const gridToLatLng = (grid: string) => {
  // 验证输入格式
  const gridRegex = /^[A-R]{2}[0-9]{2}([a-x]{2})?$/i
  if (!gridRegex.test(grid)) {
    throw new Error('无效的梅登海德网格坐标')
  }

  // 转换为大写以统一处理
  grid = grid.toUpperCase()
  
  // 计算经度
  const lon = (grid.charCodeAt(0) - 65) * 20 - 180 + 
              (grid.charCodeAt(2) - 48) * 2 +
              (grid.length === 6 ? (grid.charCodeAt(4) - 97 + 0.5) / 12 : 1)
              
  // 计算纬度
  const lat = (grid.charCodeAt(1) - 65) * 10 - 90 + 
              (grid.charCodeAt(3) - 48) +
              (grid.length === 6 ? (grid.charCodeAt(5) - 97 + 0.5) / 24 : 0.5)

  return {
    latitude: lat,
    longitude: lon
  }
}