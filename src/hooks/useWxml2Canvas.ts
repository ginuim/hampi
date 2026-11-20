import Wxml2Canvas from '@/utils/wxml2canvas'

export function useWxml2Canvas() {
  const wxml2canvas = (config: any): Promise<string> => {
    return new Promise((resolve, reject) => {
      const poster = new Wxml2Canvas({
        ...config,
        success(res) {
          resolve(res.tempFilePath)
        },
        fail(err) {
          reject(err)
        }
      })
      
      poster.draw()
    })
  }

  return {
    wxml2canvas
  }
} 