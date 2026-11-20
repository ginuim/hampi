/**
 * 请求封装模块
 */

// 基础请求路径
const BASE_URL = 'https://api.example.invalid';

/**
 * 获取请求头
 * @returns {Object} 包含 session_key 的请求头对象
 */
const getHeaders = () => {
  const openid = uni.getStorageSync('openid') || '';
  const sessionKey = uni.getStorageSync('session_key') || '';
  return {
    'Content-Type': 'application/json',
    'session_key': sessionKey,
    openid
  };
};

/**
 * 请求封装
 * @param {Object} options 请求配置
 * @returns {Promise} 请求Promise对象
 */
const request = (options = {}) => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: options.url.startsWith('http') ? options.url : BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        ...getHeaders(),
        ...(options.header || {})
      },
      success: (res) => {
        // 请求成功但业务状态可能有错误
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          // 处理HTTP错误
          reject({
            errMsg: `请求失败: ${res.statusCode}`,
            ...res
          });
        }
      },
      fail: (err) => {
        // 请求失败
        reject(err);
      }
    });
  });
};

/**
 * GET请求
 * @param {String} url 请求地址
 * @param {Object} data 请求参数
 * @param {Object} options 其他配置
 */
const get = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'GET',
    data,
    ...options
  });
};

/**
 * POST请求
 * @param {String} url 请求地址
 * @param {Object} data 请求参数
 * @param {Object} options 其他配置
 */
const post = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'POST',
    data,
    ...options
  });
};

/**
 * PUT请求
 * @param {String} url 请求地址
 * @param {Object} data 请求参数
 * @param {Object} options 其他配置
 */
const put = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'PUT',
    data,
    ...options
  });
};

/**
 * DELETE请求
 * @param {String} url 请求地址
 * @param {Object} data 请求参数
 * @param {Object} options 其他配置
 */
const del = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'DELETE',
    data,
    ...options
  });
};

// 默认导出
export default {
  request,
  get,
  post,
  put,
  delete: del
}; 