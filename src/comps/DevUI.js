export class DevUI {
  constructor(scene) {
    this.scene = scene

    this.create()
    this.createEvents()
  }
  create() {

    // this.scene.add.image(0, 0, 'dev_ui').setOrigin(0).setAlpha(0).setScale(1)

    // this.scene.add
    //   .image(620, 100, 'co')
    //   .setOrigin(1, 0)
    //   .setAlpha(0.8)
    //   .setScale(1)

    // this.scene.add.image(0, 0, 'bot_chat').setOrigin(0).setAlpha(0.2)

    // this.scene.add.image(0, 0, 'grid').setOrigin(0).setAlpha(0).setDepth(100)
    this.createExitsFrame()
    this.createTunerPanel()
    this.createRulesFrame()
  }
  createExitsFrame() {
    // frame
    const width = 140
    const height = 320
    const x = 80
    const y = 340

    const g = this.scene.add.graphics()
    // console.log('frame color', width, height, color)
    // console.log('frame color', this.scene.standartColors.black)
    // параметры стиля
    const strokeWidth = 2
    const strokeColor = this.scene.standartColors.red // color ? color : 
    const alpha = 0

    g.__x = x - width / 2 + strokeWidth / 2;
    g.__y = y + strokeWidth / 2;
    g.__width = width - strokeWidth;
    g.__height = height - strokeWidth;
    g.__color = strokeColor;
    g.__strokeWidth = strokeWidth;

    g.lineStyle(g.__strokeWidth, strokeColor, alpha)
    g.strokeRect(g.__x, g.__y, g.__width, g.__height);

    this.label = this.scene.add
      .text(x, y - 15, 'EXITS', {
        // font: '24px walibi',
        // fill: 'white',
        fontFamily: 'JapanRobot',
        fontSize: '16px',
        // fill: this.scene.textColors.white,
        color: this.scene.labelColor,
        // font: this.scene.labelFont
      })
      .setOrigin(0.5)
      // .setAlign('left')
      .setAlpha(0.8)
    // .setDepth(210)

    this.slogan = this.scene.add.image(x, y + height / 2, 'exits_frame_slogan').setOrigin(0.5).setAlpha(0.7)
  }
  createTunerPanel() {
    const x = 640 - 80
    const y = 160
    this.scene.add.image(x, y, 'risk_tuner_panel').setOrigin(0.5).setAlpha(1)
  }
  createRulesFrame() {
    const x = 640 - 80
    const y = 260
    this.scene.add.image(x, y, 'rules_frame').setOrigin(0.5, 0).setAlpha(0.7)
  }
  createEvents() {
    // this.scene.events.on('gameEvent', (data) => {
    //   if (data.mode === 'CASHOUT') {
    //     this.shake()
    //   }
    //   if (data.mode === 'BET') {
    //     // this.set(data.deposit)
    //   }
    // })
  }
}
