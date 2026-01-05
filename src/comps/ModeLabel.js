export class ModeLabel {
  constructor(scene, initial = 0) {
    this.scene = scene
    this.currentValue = initial
    this.x = 15
    this.y = 44

    this.label = this.scene.add
      .text(this.x, this.y - 25, 'MODE', {
        // fontFamily: 'AvenirNextCondensedBold',
        // fontSize: '18px',
        color: this.scene.labelColor,
        font: this.scene.labelFont
      })
      .setOrigin(0, 0.5)
      .setAlign('left')
      .setAlpha(1)
      .setDepth(210)

    this.counter = scene.add
      .text(this.x, this.y, 'COM', {
        // font: '24px walibi',
        // fill: 'white',
        fontFamily: 'JapanRobot',
        fontSize: '24px',
        fill: scene.textColors.red,
        // stroke: this.textColors.white,
        // strokeThickness: 6
      })
      .setOrigin(0, 0.5)
      .setAlign('left')
      .setAlpha(1)
      .setDepth(210)

    this.createEvents()
  }

  createEvents() {
    this.scene.events.on('gameEvent', (data) => {
      if (data.mode === 'BONZA') {
        // нужно показывать изменение состояния сцены, бонусный режим
      }
      if (data.mode === 'FALL') {
        this.set(data.load.mode)
        // if (data.load.mode === 'common') this.fall()
        // if (data.load.mode === 'bonza') this.rush(load.depth)
      }
    })
  }

  change(value, isCashout = false) {
    // проверка на NaN нужна, чтобы избежать ошибок
    // if (isNaN(value)) {
    //   // console.warn('Invalid value for MoneyCounter:', value)
    //   return
    // }

    // const from = this.currentValue
    // const to = value
    // this.currentValue = value

    // if (isCashout) {
    //   this.scene.tweens.add({
    //     targets: { v: from },
    //     v: to,
    //     duration: 1000,
    //     ease: 'Sine.easeOut',
    //     onUpdate: (tw, obj) => {
    //       // const val = obj.v;      // или fixed(2) для X
    //       // const text = val >= 1000 ? val.toFixed(0) : val >= 100 ? val.toFixed(1) : val.toFixed(2)
    //       // const value = obj.v.toFixed(2)
    //       this.set(obj.v)
    //     },
    //     onComplete: () => {
    //       this.set(to)
    //     }
    //   })
    // } else this.set(this.currentValue)

  }

  set(text) {
    this.counter.setText(text)
  }
}
