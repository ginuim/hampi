interface Wxml2CanvasConfig {
  width: number
  height: number
  backgroundColor: string
  blocks?: Array<{
    x: number
    y: number
    width: number
    height: number
    backgroundColor: string
  }>
  texts?: Array<{
    text: string
    x: number
    y: number
    fontSize: number
    color: string
    textAlign: string
    width: number
    lineHeight: number
  }>
  images?: Array<{
    url: string
    x: number
    y: number
    width: number
    height: number
    borderRadius?: number
  }>
  success?: (res: { tempFilePath: string }) => void
  fail?: (error: any) => void
}

class Wxml2Canvas {
  private config: Wxml2CanvasConfig
  private ctx: any
  private canvas: any
  private canvasId: string

  constructor(config: Wxml2CanvasConfig) {
    this.config = config
    this.canvasId = `poster-canvas-${Date.now()}`
    this.initCanvas()
  }

  private initCanvas() {
    const { width, height } = this.config
    this.canvas = wx.createCanvas()
    this.canvas.width = width
    this.canvas.height = height
    this.ctx = this.canvas.getContext('2d')
  }

  private async drawBackground() {
    const { backgroundColor, width, height } = this.config
    this.ctx.fillStyle = backgroundColor
    this.ctx.fillRect(0, 0, width, height)
  }

  private async drawBlocks() {
    if (!this.config.blocks) return
    
    for (const block of this.config.blocks) {
      this.ctx.fillStyle = block.backgroundColor
      this.ctx.fillRect(block.x, block.y, block.width, block.height)
    }
  }

  private async drawTexts() {
    if (!this.config.texts) return

    for (const text of this.config.texts) {
      this.ctx.font = `${text.fontSize}px sans-serif`
      this.ctx.fillStyle = text.color
      this.ctx.textAlign = text.textAlign as CanvasTextAlign
      this.ctx.textBaseline = 'top'

      // 处理文本换行
      const words = text.text.split('')
      let line = ''
      let y = text.y

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i]
        const metrics = this.ctx.measureText(testLine)
        const testWidth = metrics.width

        if (testWidth > text.width && i > 0) {
          this.ctx.fillText(line, text.x, y)
          line = words[i]
          y += text.lineHeight
        } else {
          line = testLine
        }
      }
      this.ctx.fillText(line, text.x, y)
    }
  }

  private async drawImages() {
    if (!this.config.images) return

    for (const image of this.config.images) {
      try {
        const img = await this.loadImage(image.url)
        
        if (image.borderRadius) {
          this.ctx.save()
          this.ctx.beginPath()
          this.ctx.moveTo(image.x + image.borderRadius, image.y)
          this.ctx.lineTo(image.x + image.width - image.borderRadius, image.y)
          this.ctx.quadraticCurveTo(image.x + image.width, image.y, image.x + image.width, image.y + image.borderRadius)
          this.ctx.lineTo(image.x + image.width, image.y + image.height - image.borderRadius)
          this.ctx.quadraticCurveTo(image.x + image.width, image.y + image.height, image.x + image.width - image.borderRadius, image.y + image.height)
          this.ctx.lineTo(image.x + image.borderRadius, image.y + image.height)
          this.ctx.quadraticCurveTo(image.x, image.y + image.height, image.x, image.y + image.height - image.borderRadius)
          this.ctx.lineTo(image.x, image.y + image.borderRadius)
          this.ctx.quadraticCurveTo(image.x, image.y, image.x + image.borderRadius, image.y)
          this.ctx.closePath()
          this.ctx.clip()
        }

        this.ctx.drawImage(img, image.x, image.y, image.width, image.height)
        
        if (image.borderRadius) {
          this.ctx.restore()
        }
      } catch (error) {
        console.error('Failed to load image:', error)
        if (this.config.fail) {
          this.config.fail(error)
        }
      }
    }
  }

  private loadImage(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const img = this.canvas.createImage()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = url
    })
  }

  public async draw() {
    try {
      await this.drawBackground()
      await this.drawBlocks()
      await this.drawTexts()
      await this.drawImages()

      // 使用 draw 方法并等待绘制完成
      this.ctx.draw(false, () => {
        setTimeout(() => {
          wx.canvasToTempFilePath({
            x: 0,
            y: 0,
            width: this.config.width,
            height: this.config.height,
            destWidth: this.config.width,
            destHeight: this.config.height,
            fileType: 'png',
            canvasId: this.canvasId,
            success: (res) => {
              if (this.config.success) {
                this.config.success({ tempFilePath: res.tempFilePath })
              }
            },
            fail: (error) => {
              console.error('Draw error:', error)
              if (this.config.fail) {
                this.config.fail(error)
              }
            }
          })
        }, 300)
      })
    } catch (error) {
      console.error('Draw error:', error)
      if (this.config.fail) {
        this.config.fail(error)
      }
    }
  }
}

export default Wxml2Canvas 