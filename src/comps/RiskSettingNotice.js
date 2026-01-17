export class RiskSettingNotice {
  constructor(scene) {
    this.scene = scene
    this.x = this.scene.sceneCenterX
    this.y = 70 // 730

    // this.label = scene.add
    //   .text(this.x, this.y, 'New settings:', {
    //     font: this.scene.labelFont,
    //     // color: labelColor,
    //     color: this.scene.textColors.red
    //   })
    //   .setOrigin(0.5, 0)
    //   .setAlign('center')
    //   .setAlpha(0)

    this.label = scene.add
      .text(this.x, this.y, 'New settings:', {
        font: this.scene.labelFont,
        // color: labelColor,
        color: this.scene.textColors.red
      })
      .setOrigin(0.5, 0)
      .setAlign('center')
      .setAlpha(0)

    // this.autoCashoutLabel = this.scene.add
    //   .text(this.stakeCounter.x, this.stakeCounter.y + 40, '', {
    //     font: labelFont,
    //     // color: labelColor,
    //     color: this.scene.textColors.red
    //   })
    //   .setOrigin(0.5)
    //   .setAlign('center')
    //   .setAlpha(0)


    this.createEvents()
  }

  createEvents() {
    this.scene.events.on('gameEvent', (data) => {
      if (data.mode === 'RISK_SETTING_CHANGED') {
        this.handleEvent(data)
      }
      if (data.mode === 'RISK_SETTING_PENDING') {
        this.set('NEW SET NEXT ROUND...')
        this.show(true)
      }
    })
  }
  handleEvent(data) {
    // console.log('RISK_SETTING_CHANGED', data)
    // default: this.defaultRiskSetting,
    // current: this.currentRiskSetting,

    // старый метод
    if (data) {
      // это кастом или дефолт?
      const diffSettings = () => {
        const d = data.default
        const c = data.current
        return (
          d.minPayout !== c.minPayout ||
          d.maxPayout !== c.maxPayout ||
          d.steps !== c.steps
        )
      }
      let text
      if (diffSettings()) text = 'CUSTOM:'
      else text = 'DEFAULT:'

      this.label.text =
        // 'New settings in the next round...',
        `${text} ${data.current.minPayout} -> ${data.current.maxPayout} | ${data.current.steps}`

      this.label.alpha = 1
      this.scene.tweens.add({
        targets: this.label,
        alpha: 0, // ширина экрана
        duration: 7000,
      })
    }

    // this.set(data.text)
    // this.show(data.show)
  }
  set(value) {
    this.label.setText(value)
  }
  show(value) {
    this.label.setAlpha(value)
  }
}
