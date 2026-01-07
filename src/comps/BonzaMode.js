export class BonzaMode {
  constructor(scene) {
    this.scene = scene
    this.x = 80
    this.y = 140

    this.amount = 0

    this.logo = scene.add.image(this.x, this.y, 'stamp').setScale(1.2).setAlpha(0)

    this.counter = scene.add
      .text(this.x + 40, this.y - 40, this.amount, {
        // font: '60px japan', // walibi
        fill: this.scene.textColors.white,
        fontFamily: 'JapanRobot', // JapanRobot AvenirBlack
        fontSize: '40px',
        // fill: this.scene.textColors.red, // black
        // stroke: this.scene.textColors.black, // red
        // strokeThickness: 8
      })
      .setOrigin(0.5)
      .setAlpha(0)

    this.createEvents()
  }

  createEvents() {
    this.scene.events.on('gameEvent', (data) => {
      if (data.mode === 'BONZA') {
        this.show(1)
        console.log(this.scene.hasBet, this.scene.hasCashOut)
        if (this.scene.hasBet && !this.scene.hasCashOut) {
          this.amount++
          this.set(this.amount)
          this.counter.alpha = 1
        }
      }
      if (data.mode === 'COUNTDOWN_UPDATE') {
        // this.set(data.text)
        // this.show(data.show)
      }

      if (data.mode === 'ROUND_PREPARE') {
        // after the bonus end
        // this.show(0)
        // this.counter.alpha = 0
        // this.amount = 0
        // this.set(this.amount)
      }

      if (data.mode === 'HIT') {
        // console.log(data.count, 'nextMultiplier', data.nextMultiplier)
        // this.setNextMulty(data.nextMultiplier)
      }

      if (data.mode === 'FINISH') {
        // console.log('ROUND_PREPARE',)
        // this.set('')
        // this.show(0)
      }
    })
    // this.scene.events.on('gameEvent', (data) => {
    //   if (data.mode === 'HIT') {
    //     console.log(data.count, 'nextMultiplier', data.nextMultiplier)
    //     this.setNextMulty(data.nextMultiplier)
    //   }
    // })
  }
  setNextMulty(m) {
    let text = ''
    if (!m) {
      this.set(text)
      this.show(0)
      return
    }
    text = m >= 1000 ? m.toFixed(0) : m >= 100 ? m.toFixed(1) : m.toFixed(2)

    if (this.counter.alpha === 0) this.show(1)

    this.scene.tweens.add({
      targets: this.counter,
      // alpha: 0,
      scaleX: 1.05,
      // delay: 1000,
      duration: 100,
      yoyo: true,
      onComplete: () => {
        this.set(text)
        this.counter.setScale(1)
      }
    })
  }
  set(value) {
    this.counter.setText(value.toFixed(0))
  }
  show(value) {
    // this.counter.setAlpha(value)
    this.logo.setAlpha(value)
  }
}
