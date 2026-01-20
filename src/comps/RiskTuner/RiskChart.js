// RiskChart.js

export class RiskChart {
  constructor(scene, chartX, chartY) {
    this.scene = scene
    this.chartX = 180
    this.chartY = 7 * scene.gridUnit
    this.barWidth = 32
    this.barGap = 10
    this.chartHeight = 200
    this.barsCount = 7
    this.barColor = this.scene.standartColors.gray
    this.barFrameColor = this.scene.standartColors.black

    this.graphics = scene.add.graphics()

    // Данные для анимации
    this.chartData = []
    for (let i = 0; i < this.barsCount; i++) {
      this.chartData.push({ value: 0 })
    }
  }

  redraw() {
    this.graphics.clear()
    // this.graphics.fillStyle(0xff0000, 1)
    const strokeWidth = 4
    const strokeColor = this.scene.standartColors.black // color ? color : 
    const alpha = 1
    const radius = 4

    for (let i = 0; i < this.chartData.length; i++) {
      const progress = Phaser.Math.Clamp(this.chartData[i].value, 0, 1)
      const barHeight = this.chartHeight * progress
      const x = this.chartX + i * (this.barWidth + this.barGap)
      const y = this.chartY - barHeight

      this.graphics.fillStyle(this.scene.standartColors.red, alpha)
      this.graphics.fillRoundedRect(x, y, this.barWidth, barHeight, radius)

      this.graphics.lineStyle(strokeWidth, strokeColor, alpha)
      this.graphics.strokeRoundedRect(x, y, this.barWidth, barHeight, radius)
    }
  }

  animateTo(targetValues) {
    for (let i = 0; i < this.chartData.length; i++) {
      this.scene.tweens.add({
        targets: this.chartData[i],
        value: targetValues[i],
        duration: 500,
        ease: 'Back.easeOut',
        onUpdate: () => this.redraw(),
      })
    }
  }

  reset() {
    for (let i = 0; i < this.chartData.length; i++) {
      this.chartData[i].value = 0
    }
    this.redraw()
  }
}
