import {
  generateMinPayoutArray,
  generateMaxPayoutArray,
  generateStepsArray,
} from './RiskTunerData'

import { RiskSlider } from './RiskSlider'
import { RiskChart } from './RiskChart'
import {
  normalize,
  getDiscreteValue,
  getSliderValue,
  setSliderValue,
} from './RiskTunerUtils'

import { ButtonGraphics } from '../ButtonGraphics'

export class RiskTunerPanel {
  constructor(scene, riskSetting) {
    this.scene = scene

    // dev
    this.isVisible = false

    // --- Генерируем массивы дискретных значений
    this.settingArrays = {
      minPayout: generateMinPayoutArray(),
      maxPayout: generateMaxPayoutArray(),
      steps: generateStepsArray(),
    }

    // let customs = 1
    // for (let key of Object.keys(this.settingArrays)) {
    //   console.log(key, this.settingArrays[key].length)
    //   customs *= this.settingArrays[key].length
    // }
    // console.log('Вариантов кастома:', customs)
    // --- Основные состояния
    this.defaultRiskSetting = { ...riskSetting }
    this.currentRiskSetting = { ...riskSetting }
    this.draftRiskSetting = { ...riskSetting }
    this.previousDraftValues = { ...riskSetting }

    // --- Контейнер для всего UI
    this.container = scene.add.container(0, 0).setDepth(20).setVisible(this.isVisible)

    this.createUI()
    this.createEvents()
  }

  createUI() {
    const { scene, container } = this

    // color: labelColor,
    // font: labelFont

    // --- Фон (теперь интерактивный, вместо старого vail)

    this.bg = scene.add
      .image(0, 0, 'tuner_bg')
      .setOrigin(0)
      .setAlpha(1)
      .setInteractive()

    // this.bg = scene.add.rectangle(0, 0, 640, 1120, 0x000000, 0.8).setOrigin(0);

    // --- Заголовок
    // this.naming = scene.add
    //   .image(scene.sceneCenterX, scene.gridUnit * 1.8, 'risk_tuner')
    //   .setOrigin(0.5)

    // --- Заголовок текстом
    this.naming = scene.add
      .text(scene.sceneCenterX, 120, 'RISK_TUNER', {
        fontFamily: this.scene.mainFontFamily,
        fontSize: '40px',
        fill: this.scene.textColors.black, // black
      })
      .setOrigin(0.5)

    // Картинка датчика / тахометр
    this.tachometer = scene.add.image(scene.sceneCenterX, 260, 'risk_tuner_panel')
      .setOrigin(0.5)
      .setScale(1.5)
    // --- Нотация
    this.notation = scene.add
      .text(scene.sceneCenterX - 140, 380, '', {
        // fontSize: '24px',
        // color: '#FDD41D',
        // fontFamily: 'AvenirNextCondensedBold',
        fontFamily: this.scene.labelFontFamily,
        fontSize: '20px',
        color: this.scene.textColors.dark_gray,
      })
      .setOrigin(0, 0)

    this.notation.update = (setting) => {
      const lines = [
        `Steps: ${setting.steps}`,
        `Min: ${setting.minPayout}`,
        `Max: ${setting.maxPayout}`,
        // `EDGE_1%`, // ${scene.houseEdge}
      ]
      this.notation.setText(lines)
    }

    const blockY = 7 * scene.gridUnit
    const verticalIndent = 80

    // --- Чарт
    this.chart = new RiskChart(scene, 180, blockY)


    // --- Слайдеры
    this.slider1 = new RiskSlider(
      scene,
      320,
      blockY + 2 * verticalIndent,
      'MIN',
      this.settingArrays.minPayout[0],
      this.settingArrays.minPayout[this.settingArrays.minPayout.length - 1]
    )
    this.slider2 = new RiskSlider(
      scene,
      320,
      blockY + 3 * verticalIndent,
      'MAX',
      this.settingArrays.maxPayout[0],
      this.settingArrays.maxPayout[this.settingArrays.maxPayout.length - 1]
    )
    this.slider3 = new RiskSlider(
      scene,
      320,
      blockY + 1 * verticalIndent,
      'STEPS',
      this.settingArrays.steps[0],
      this.settingArrays.steps[this.settingArrays.steps.length - 1]
    )
    // пресеты

    const presetContainer = scene.add
      .container(0, 10 * scene.gridUnit)
      .setDepth(20)
      .setVisible(0)

    const startX = 140
    const indent = 90

    for (let index = 0; index < 5; index++) {
      const button = scene.add
        .image(startX + indent * index, 0, 'button_hell')
        .setOrigin(0.5)
        .setScale(0.6)
      presetContainer.add(button)
    }
    // --- Кнопки
    this.buttonClose = scene.add
      .image(640 - scene.buttonIndent + 20, scene.buttonY, 'button_close')
      .setOrigin(0.5)
      .setScale(1)
      .setInteractive()

    this.labelClose = scene.add
      .text(
        this.buttonClose.x,
        this.buttonClose.y - scene.buttonNameSpacing,
        'CLOSE',
        {
          // fontFamily: 'AvenirNextCondensedBold',
          // fontSize: '18px',
          // color: '#13469A',
        }
      )
      .setOrigin(0.5, 0)
      .setAlpha(0)


    // reset button
    this.buttonReset = scene.add
      .image(scene.sceneCenterX - 120, scene.buttonY, 'button_square')
      .setOrigin(0.5)
      .setScale(1)
      .setInteractive()
    // .setFlipX(true)
    // .setScale(1)

    this.labelReset = scene.add
      .text(
        this.buttonReset.x,
        this.buttonReset.y,
        'RE-\nSET',
        {
          fontFamily: this.scene.mainFontFamily,
          fontSize: '24px',
          fill: this.scene.textColors.black, // black
        }
      )
      .setOrigin(0.5)

    // random button
    this.buttonRandom = scene.add
      .image(scene.sceneCenterX + 120, scene.buttonY, 'button_square')
      .setOrigin(0.5)
      .setScale(1)
      .setInteractive()
    // .setFlipX(true)
    // .setScale(1)

    this.labelRandom = scene.add
      .text(
        this.buttonRandom.x,
        this.buttonRandom.y,
        'RAN\nDOM',
        {
          fontFamily: this.scene.mainFontFamily,
          fontSize: '24px',
          fill: this.scene.textColors.black, // black
        }
      )
      .setOrigin(0.5)



    // Главная кнопка действия
    this.buttonActionAlpha = 1

    this.buttonAction = scene.add
      .image(scene.sceneCenterX, scene.buttonY, 'button_set_gray')
      .setOrigin(0.5)
      .setInteractive()
      .setAlpha(this.buttonActionAlpha)

    // this.buttonAction = new ButtonGraphics(
    //   this.scene,
    //   scene.sceneCenterX,
    //   scene.buttonY,
    //   'yellow'
    // ).setAlpha(0.6)

    // this.buttonAction.enableHitbox()
    // this.buttonAction.on('pointerdown', () => this.onCash?.())

    this.buttonActionLabel = this.scene.add
      .text(this.buttonAction.x, this.buttonAction.y, 'SET', {
        // font: '40px walibi',
        // fill: 'black',
        fontFamily: this.scene.mainFontFamily,
        fontSize: '40px',
        fill: this.scene.textColors.black, // black
      })
      .setOrigin(0.5)
      .setAlign('center')



    // --- Добавляем в контейнер
    container.add([
      this.bg,
      this.naming,
      this.tachometer,
      this.notation,
      this.chart.graphics,
      this.buttonClose,
      this.labelClose,
      this.buttonReset,
      this.labelReset,
      this.buttonRandom,
      this.labelRandom,
      this.buttonAction,
      this.buttonActionLabel,
      this.slider1.container,
      this.slider2.container,
      this.slider3.container,
      presetContainer,
    ])
  }

  createEvents() {
    const { scene } = this
    // слушаем
    scene.events.on('gameEvent', (data) => {
      // if (data.mode === 'RISK_SETTING_PENDING')
      // this.currentRiskSetting = { ...data.setting }
      if (data.mode === 'RISK_SETTING_CHANGED')
        this.currentRiskSetting = { ...data.current }
    })

    // --- Слайдеры активируем
    scene.input.setDraggable([
      this.slider1.button,
      this.slider2.button,
      this.slider3.button,
    ])

    // --- Карта слайдеров
    this.sliderSettingsMap = new Map([
      [this.slider1, this.settingArrays.minPayout],
      [this.slider2, this.settingArrays.maxPayout],
      [this.slider3, this.settingArrays.steps],
    ])

    // --- Слушатель drag
    scene.input.on('drag', (pointer, gameObject) => {
      const slider = [this.slider1, this.slider2, this.slider3].find(
        (s) => s.button === gameObject
      )
      if (!slider) return

      const local = slider.container.getLocalPoint(pointer.x, pointer.y)
      slider.button.x = Phaser.Math.Clamp(local.x, slider.min, slider.max)

      const sliderValue = getSliderValue(slider)
      const settingArray = this.sliderSettingsMap.get(slider)
      const discreteValue = getDiscreteValue(settingArray, sliderValue)

      let key
      if (slider === this.slider1) key = 'minPayout'
      else if (slider === this.slider2) key = 'maxPayout'
      else if (slider === this.slider3) key = 'steps'
      if (!key) return

      // === Проверка на изменение ===
      if (this.previousDraftValues[key] === discreteValue) return

      // === Обновляем draft и previous ===
      this.draftRiskSetting[key] = discreteValue
      this.previousDraftValues[key] = discreteValue

      // === Обновляем UI ===
      this.notation.update(this.draftRiskSetting)
      this.updateChart(this.draftRiskSetting)
      this.updateSetButton()
    })

    // --- Кнопки
    this.buttonClose.on('pointerdown', () => {
      this.show(false)
    })

    this.buttonReset.on('pointerdown', () => {
      this.resetDraft()
    })

    this.buttonRandom.on('pointerdown', () => {
      const randomSetting = {
        minPayout:
          this.settingArrays.minPayout[
          Phaser.Math.Between(
            0,
            this.settingArrays.minPayout.length - 1
          )
          ],
        maxPayout:
          this.settingArrays.maxPayout[
          Phaser.Math.Between(
            0,
            this.settingArrays.maxPayout.length - 1
          )
          ],
        steps:
          this.settingArrays.steps[
          Phaser.Math.Between(0, this.settingArrays.steps.length - 1)
          ],
      }
      this.draftRiskSetting = { ...randomSetting }
      this.previousDraftValues = { ...randomSetting }

      this.setSliders(this.draftRiskSetting)
      this.notation.update(this.draftRiskSetting)
      this.updateChart(this.draftRiskSetting)
      this.updateSetButton()
    })

    this.buttonAction.on('pointerdown', () => {
      if (this.isDraftChanged()) {
        this.applyDraft()
      }
    })
  }

  updateChart(setting) {
    const targetBars = this.makeChartBarsFromSettings(setting)
    this.chart.animateTo(targetBars)
  }

  isDraftChanged() {
    const d = this.draftRiskSetting
    const c = this.currentRiskSetting
    return (
      d.minPayout !== c.minPayout ||
      d.maxPayout !== c.maxPayout ||
      d.steps !== c.steps
    )
  }

  updateSetButton() {
    // this.buttonAction.setAlpha(this.isDraftChanged() ? 1 : this.buttonActionAlpha)

    if (this.isDraftChanged()) {
      this.buttonAction.setTexture('button_set_red')
      // this.buttonActionLabel.setText('SET')
    } else {
      this.buttonAction.setTexture('button_set_gray')
      // this.buttonActionLabel.setText('NO CHANGES')
    }
  }

  applyDraft() {
    this.currentRiskSetting = { ...this.draftRiskSetting }
    this.scene.events.emit('riskTuner:apply', this.currentRiskSetting)
    this.show(false)
  }

  resetDraft() {
    this.draftRiskSetting = { ...this.defaultRiskSetting }
    this.previousDraftValues = { ...this.defaultRiskSetting }

    this.setSliders(this.draftRiskSetting)
    this.notation.update(this.draftRiskSetting)
    this.updateChart(this.draftRiskSetting)
    this.updateSetButton()
  }

  getNormalizedFromArray(array, value) {
    const index = array.indexOf(value)
    if (index === -1) return 0
    return index / (array.length - 1)
  }

  setSliders(setting) {
    const minNorm = this.getNormalizedFromArray(
      this.settingArrays.minPayout,
      setting.minPayout
    )
    const maxNorm = this.getNormalizedFromArray(
      this.settingArrays.maxPayout,
      setting.maxPayout
    )
    const stepsNorm = this.getNormalizedFromArray(
      this.settingArrays.steps,
      setting.steps
    )

    setSliderValue(this.slider1, minNorm)
    setSliderValue(this.slider2, maxNorm)
    setSliderValue(this.slider3, stepsNorm)
  }

  show(state) {
    this.container.setVisible(state)
    if (state) {
      this.draftRiskSetting = { ...this.currentRiskSetting }
      this.previousDraftValues = { ...this.currentRiskSetting }

      this.setSliders(this.draftRiskSetting)
      this.notation.update(this.draftRiskSetting)
      this.updateChart(this.draftRiskSetting)
      this.updateSetButton()
    }
  }

  makeChartBarsFromSettings(setting) {
    const minIndex = this.settingArrays.minPayout.indexOf(setting.minPayout)
    const maxIndex = this.settingArrays.maxPayout.indexOf(setting.maxPayout)

    const chartHeight = this.chart.chartHeight
    const minStart = 0.05 * chartHeight
    const minFinish = 0.15 * chartHeight
    const maxStart = 0.3 * chartHeight
    const maxFinish = 1 * chartHeight

    const normMin = minIndex / (this.settingArrays.minPayout.length - 1)
    const normMax = maxIndex / (this.settingArrays.maxPayout.length - 1)

    const firstBarHeight = minStart + normMin * (minFinish - minStart)
    const lastBarHeight = maxStart + normMax * (maxFinish - maxStart)

    const curveFactor = 1.3 + 20 / setting.steps

    const bars = []
    for (let i = 0; i < this.chart.barsCount; i++) {
      const t = i / (this.chart.barsCount - 1)
      const curvedT = Math.pow(t, curveFactor)
      const height = firstBarHeight * (1 - curvedT) + lastBarHeight * curvedT
      bars.push(Phaser.Math.Clamp(height / chartHeight, 0, 1))
    }

    return bars
  }
}
