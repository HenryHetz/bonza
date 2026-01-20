// RiskSlider.js

export class RiskSlider {
  constructor(scene, x, y, name, minText, maxText) {
    this.scene = scene
    this.axis = 'x'

    this.nameBack = 'slider_name_back'
    this.imageBar = 'volume_bar'
    this.imageButton = 'slider_button'
    this.length = 300
    this.min = -this.length / 2
    this.max = this.length / 2

    this.container = scene.add.container(x, y)


    this.nameBackImage = scene.add
      .image(0, -20, this.nameBack)
      .setOrigin(0.5)
    this.bar = scene.add.image(0, 0, this.imageBar)
    // .setRotation(Phaser.Math.DegToRad(90))
    this.button = scene.add.image(0, 0, this.imageButton).setInteractive()

    // .setRotation(Phaser.Math.DegToRad(90))
    this.text = scene.add
      .text(this.bar.x, this.bar.y - 20, name, {
        fontFamily: this.scene.labelFontFamily,
        fontSize: '20px',
        color: this.scene.textColors.white,
      })
      .setOrigin(0.5)

    this.minText = scene.add
      .text(this.bar.x - this.length / 2 - 6, this.bar.y - 20, minText, {
        // fontFamily: 'AvenirNextCondensedBold',
        fontFamily: this.scene.labelFontFamily,
        fontSize: '26px',
        color: this.scene.textColors.black,
      })
      .setOrigin(0, 0.5)
      .setAlign('left')

    this.maxText = scene.add
      .text(this.bar.x + this.length / 2 + 6, this.bar.y - 20, maxText, {
        // fontFamily: 'AvenirNextCondensedBold',
        fontFamily: this.scene.labelFontFamily,
        fontSize: '26px',
        color: this.scene.textColors.black,
      })
      .setOrigin(1, 0.5)
      .setAlign('right')

    this.container.add([
      this.nameBackImage,
      this.bar,
      this.text,
      // this.button,
      this.minText,
      this.maxText,
      this.button,
    ])
  }
}
