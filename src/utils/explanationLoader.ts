// explanation 加载器
class ExplanationLoader {
  private cache: Map<string, string> = new Map()
  private loadingPromises: Map<string, Promise<void>> = new Map()
  private baseUrl = 'https://hampi.oss-cn-hangzhou.aliyuncs.com/exam'
  
  /**
   * 加载指定题目的explanation
   * @param questionId 题目ID
   * @returns Promise<string> explanation内容
   */
  async loadExplanation(questionId: string): Promise<string> {
    // 如果已经缓存了，直接返回
    if (this.cache.has(questionId)) {
      return this.cache.get(questionId)!
    }
    
    // 如果正在加载中，等待加载完成
    if (this.loadingPromises.has(questionId)) {
      await this.loadingPromises.get(questionId)
      return this.cache.get(questionId) || ''
    }
    
    // 开始加载
    const loadingPromise = this.fetchExplanation(questionId)
    this.loadingPromises.set(questionId, loadingPromise)
    
    try {
      await loadingPromise
      return this.cache.get(questionId) || ''
    } finally {
      this.loadingPromises.delete(questionId)
    }
  }
  
  /**
   * 批量加载explanations
   * @param questionIds 题目ID数组
   */
  async loadExplanations(questionIds: string[]): Promise<void> {
    const loadPromises = questionIds
      .filter(id => !this.cache.has(id) && !this.loadingPromises.has(id))
      .map(id => this.loadExplanation(id))
    
    await Promise.all(loadPromises)
  }
  
  /**
   * 从远程或本地获取explanation
   */
  private async fetchExplanation(questionId: string): Promise<void> {
    try {
      // 首先尝试从OSS加载
      await this.fetchFromOSS(questionId)
    } catch (error) {
      console.warn(`从OSS加载explanation失败，尝试从本地加载: ${questionId}`, error)
      try {
        // 如果OSS加载失败，从本地加载
        // await this.fetchFromLocal(questionId)
      } catch (localError) {
        console.error(`加载explanation失败: ${questionId}`, localError)
        this.cache.set(questionId, '') // 设置空字符串防止重复请求
      }
    }
  }
  
  /**
   * 从OSS加载explanation
   */
  private async fetchFromOSS(questionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseUrl}/explanations.json`,
        method: 'GET',
        success: (res) => {
          if (res.statusCode === 200 && res.data) {
            const explanations = res.data as Record<string, string>
            // 将所有explanation缓存起来
            Object.entries(explanations).forEach(([id, explanation]) => {
              this.cache.set(id, explanation)
            })
            resolve()
          } else {
            reject(new Error(`HTTP ${res.statusCode}`))
          }
        },
        fail: (error) => {
          reject(error)
        }
      })
    })
  }
  
  /**
   * 从本地加载explanation（开发时fallback）
   */
  // private async fetchFromLocal(questionId: string): Promise<void> {
  //   try {
  //     // 在开发环境下从本地文件加载
  //     const explanations = await import('@/subpkg/exam/data/explanations.json')
  //     Object.entries(explanations).forEach(([id, explanation]) => {
  //       this.cache.set(id, explanation as string)
  //     })
  //   } catch (error) {
  //     throw new Error(`本地加载失败: ${error}`)
  //   }
  // }
  
  /**
   * 获取缓存中的explanation
   */
  getCachedExplanation(questionId: string): string | null {
    return this.cache.get(questionId) || null
  }
  
  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cache.clear()
    this.loadingPromises.clear()
  }
  
  /**
   * 获取缓存统计信息
   */
  getCacheStats(): { cached: number, loading: number } {
    return {
      cached: this.cache.size,
      loading: this.loadingPromises.size
    }
  }
}

// 创建单例实例
export const explanationLoader = new ExplanationLoader()

// 导出便捷函数
export const loadExplanation = (questionId: string) => explanationLoader.loadExplanation(questionId)
export const loadExplanations = (questionIds: string[]) => explanationLoader.loadExplanations(questionIds)
export const getCachedExplanation = (questionId: string) => explanationLoader.getCachedExplanation(questionId) 