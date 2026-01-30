// нужен: краш, кэш-аут, взятие последней плашки - фанфары (crash, cashout, complete)
// бонус: вход, игра, выход, добавление бонуса по ходу
// может дать на последних ударах больше паузы?

import { DEFAULT_RISK_SETTING } from '../constants/riskConstants'
import { DEFAULT_AUTOBET_SETTING } from '../constants/autobetConstants'
import { DEFAULT_GAME_CONFIG } from '../constants/defaultGameConfig'

import { Background } from '../comps/Background'
import { RiskTunerPanel } from '../comps/RiskTuner/RiskTunerPanel'
import { AutoPanel } from '../comps/Auto/AutoPanel'
import { BetValues } from '../comps/Bet/BetValues'

import { RiskSettingNotice } from '../comps/RiskSettingNotice'
import { BonzaMode } from '../comps/BonzaMode'
import { CountdownCounter } from '../comps/CountdownCounter'
import { MoneyCounter } from '../comps/MoneyCounter'
import { ModeLabel } from '../comps/ModeLabel'

import { Ball } from '../comps/Ball'
import { Platforms } from '../comps/Platforms'
import { FSM } from '../comps/FSM'
import { GameControlPanel } from '../comps/GameControlPanel'

// dev
import EmoChat from '../comps//EmoChat.js';
import { DevUI } from '../comps/DevUI'
import { CameraManager } from '../comps/Camera/CameraManager'
import { CashoutChart } from '../comps/CashoutChart.js'

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game')
  }
  preload() { }
  init() {
    this.bonzaCount = 0 // dev
    this.isBonza = this.bonzaCount > 0

    this.pendingBonzaAmount = 0
    this.bonusCount = 0
    this.bonusCountAmount = 0

    this.bonzaProbabilities = 0.25 // 0.25 / dev -> server
    this.minBonzaRandom = 0.5 // для RNG - min X >=2 ?

    this.paused = true;
    // dev 
    this.isDev = true
    this.timeScale = 1
    // this.timeScale = -0.9 // dev
    this.gameSpeed = DEFAULT_GAME_CONFIG.gameSpeed
    if (this.gameSpeed > 1) {
      let value = this.gameSpeed - this.timeScale
      this.setTimeScale(value)
    }
    //this.setTimeScale(-0.8) // dev
    //this.time.timeScale = this.timeScale
    this.duration = 500 // это не duration, а половина цикла

    this.houseEdge = 5.00 // его не должно быть в локале!

    // GAME STATE
    this.isCrashed = false
    this.roundCounter = 0
    this.bounceCount = 0
    this.quickMode = false
    this.elapsedSec = 0
    this.roundTime = []

    // DIMENSIONS
    this.gridUnit = 80
    this.sceneCenterX = this.cameras.main.centerX
    this.ballX = this.sceneCenterX
    this.ballY = 280 // 160
    this.hitPointY = 480 // 440
    // изменить калькуляцию!!!
    // this.baseDistanceY = 230
    // this.distanceY = this.baseDistanceY + 60
    this.buttonY = 11.5 * this.gridUnit

    // STAKES & BALANCE
    this.betValues = BetValues
    this.initialBet = DEFAULT_GAME_CONFIG.initialBet
    this.currentBetValue = this.initialBet
    this.pendingBetValue = null
    this.initialDeposit = DEFAULT_GAME_CONFIG.initialDeposit
    this.currentDeposit = this.initialDeposit
    this.stakeValue = 0

    // FLAGS
    this.hasBet = false
    this.hasCashOut = false
    this.cashOutAllowed = false
    this.betAllowed = false

    // AUTOBET & RISK SETTINGS
    this.defaultRiskSetting = DEFAULT_RISK_SETTING
    this.currentRiskSetting = { ...DEFAULT_RISK_SETTING }

    this.defaultAutoSetting = DEFAULT_AUTOBET_SETTING
    this.currentAutoSetting = { ...DEFAULT_AUTOBET_SETTING }

    // TWEENS (DEV)
    this.rnd = Phaser.Math.RND
    this.smallShakeX = 5
    this.medShakeX = 20

    // Camera
    this.camWidget = null
    this.camNeedTap = false
    this.camHint = null

    // colors
    this.standartColors = {
      white: 0xFFFFFF, // 0xffffff
      red: 0xFF0037, // 0xFF0037
      blue: 0x05edff, // 6CFFFF // #3DB6FF
      yellow: 0xfcd912, // orange: 0xFF9B0F yellow: 0xfcd912
      black: 0x000000,
      gray: 0xD9D9D9,
      wrapper: 0x212838,
      dark_red: 0x920000,
      dark_gray: 0x262626, // 262626 0x3d3d3d
      // dark_red: 0x960020,
    };

    // text
    this.textColors = {
      white: '#FBFAF8',
      red: '#FF0037', // '#E60000' '#920000ff'
      gray: '#bcbcbcff', // '#cccccc' 'rgba(101, 101, 101, 1)'
      yellow: '#fcd912',
      blue: '#05edff',
      black: '#000000',
      dark_gray: '#262626',
    }

    // UI SETTINGS
    this.buttonNameSpacing = 56
    this.buttonIndent = 100

    this.labelColor = this.textColors.white
    this.labelFontFamily = 'AvenirBlack'
    this.labelFont = '14px AvenirBlack'

    this.mainFontColor = this.textColors.black
    this.mainFont = '40px JapanRobot'
    this.mainFontFamily = 'JapanRobot'


  }
  createVail() {
    this.vail = this.add.graphics();

    this.vail.__width = 640; // this.sceneCenterX * 2
    this.vail.__height = 1120;
    this.vail.__x = 0;
    this.vail.__y = 0;
    this.vail.__color = this.standartColors.black;

    this.vail.fillStyle(this.vail.__color, 0.8);
    this.vail.fillRect(this.vail.__x, this.vail.__y, this.vail.__width, this.vail.__height);
    this.vail.setDepth(0)
    // this.vail.setVisible(0)
  }
  create() {
    // this.game.events.on('blur', () => this.onAppBlur())
    // this.game.events.on('focus', () => this.onAppFocus())

    // dev
    this.cam = this.cameras.main
    // this.cam.postFX.enabled = true;

    // console.log(Phaser.VERSION);
    // console.log(this.cam.postFX);

    // const cm = this.cam.postFX.addColorMatrix()
    // cm.desaturateLuminance();
    // cm.hue(110);
    // cm.saturate(0.35);
    // // this.cam.postFX.addGlow()

    // console.log(this.cam.postFX.enabled); // должно быть true
    // console.log(this.cam.postFX.list);

    this.crt = this.plugins.get('rexCrtPipeline').add(this.cam, {
      warpX: 0.2,
      warpY: 0.2,
      scanLineStrength: 0.2,
      scanLineWidth: 1024
    })
    this.crt.active = false;

    this.background = new Background(this)
    // dev
    this.fpsCounter = this.add.text(20, 1000, '', {
      font: '16px monospace',
      fill: this.textColors.white,
    }).setDepth(100);

    this.bonusCounter = this.add.text(200, 1000, 'BC:', {
      font: '16px monospace',
      fill: this.textColors.white,
    }).setDepth(100);

    this.timeCounter = this.add.text(620, 1000, '0.00', {
      font: '16px monospace',
      fill: this.textColors.white,
    }).setDepth(100).setAlign('right').setOrigin(1, 0);

    this.devUI = new DevUI(this)
    // this.cashoutChart = new CashoutChart(this)

    // this.liveOps = new LiveOpsManager(this) // нужно изучить

    // вынести в отдельный модуль и переключать на блок Х
    // this.header = this.add
    //   .image(320, 0, 'header')
    //   .setOrigin(0.5, 0)
    //   .setAlpha(0)
    //   .setScale(1)
    //   .setDepth(200)

    this.header = this.add.text(320, 12, 'BONZA', {
      fontSize: '50px',
      // color: index === 0 ? scene.textColors.red : scene.textColors.black,
      color: this.textColors.red,
      fontFamily: 'JapanRobot',
    })
      .setOrigin(0.5, 0)
      .setDepth(100)
      .setAlpha(0)

    this.headerBonza = this.add.image(320, 6, 'header_bonza')
      .setOrigin(0.5, 0)
      .setAlpha(1)
      .setScale(1)
      .setDepth(0)


    this.createParticles() // эммитер передается в Ball

    this.bonzaMode = new BonzaMode(this)
    this.countdownCounter = new CountdownCounter(this)
    this.moneyCounter = new MoneyCounter(this, this.initialDeposit)
    this.modeLabel = new ModeLabel(this)

    this.ball = new Ball(this, this.emitter,) // this.bounceHandler.bind(this)
    this.platforms = new Platforms(this)

    this.riskTuner = new RiskTunerPanel(this, this.defaultRiskSetting)
    this.riskSettingNotice = new RiskSettingNotice(this)

    this.autoSetting = new AutoPanel(this, this.defaultAutoSetting)

    this.gameControlPanel = new GameControlPanel(this, {
      onCash: () => this.handleButtonClick(),
      onTuner: () => this.riskTuner.show(true),
      onAuto: () => this.autoSetting.show(true, this.currentAutoSetting),
      onSettings: () => this.toggleCRT(),
      onSpeed: () => this.setTimeScale(1),
    })

    if (!this.sounds) this.createSounds()

    setTimeout(() => {
      // this.sounds.jingle.play()
    }, 1000)

    this.fsm = new FSM()
    this.setupFSMHandlers()

    this.createEvents()

    this.handleRiskSettings(this.currentRiskSetting)

    // dev
    setTimeout(() => {
      // this.emoChat = new EmoChat(this)
    }, 1000);

    // dev
    const cameraOpts = {
      x: 290,
      y: 120,
      w: 320,
      h: 360,
      depth: 300,
    }
    this.cameraManager = new CameraManager(this, cameraOpts)
    // this.cameraManager.start() // метод работает, но нужно настраивать стоп и запись
    // console.log('this.cameraManager', this.cameraManager.widget)

    if (this.cameraManager.widget)
      this.add
        .image(
          this.cameraManager.widget.x + this.cameraManager.widget.w / 2,
          this.cameraManager.widget.y + this.cameraManager.widget.h / 2,
          'camera_frame'
        )
        .setOrigin(0.5)
        .setAlpha(1)
        .setScale(1)
        .setDepth(this.cameraManager.widget.depth + 1)
  }
  // toggle
  toggleCRT() {
    this.crt.active = !this.crt.active;
    // this.crt.enabled = on;
  }
  setTimeScale(value) {
    this.timeScale += value
    if (this.timeScale > 3) this.timeScale = 1

    this.gameSpeed = this.timeScale
    // анимации
    this.tweens.timeScale = this.timeScale
    // таймеры delayedCall / addEvent
    this.time.timeScale = this.timeScale

    this.gameSpeed = this.timeScale // вообще надо менять скорость 1-2-3
    if (this.gameSpeed == 2) this.gameSpeed = 2
    else if (this.gameSpeed == 3) this.gameSpeed = 3
    else this.gameSpeed = 1


    this.events.emit('gameEvent', {
      mode: 'SPEED_CHANGED',
      speed: this.gameSpeed,
    })

    // console.log('Time Scale:', this.timeScale, this.gameSpeed)
  }
  // при переключении вкладки
  onAppBlur() {
    // 1) заморозить time/tweens
    this.tweens.pauseAll()
    this.time.paused = true

    // 2) зафиксировать состояние FSM как PAUSED_IN_BACKGROUND
    this.roundPaused = true

    // 3) если хотите — запретить действия UI
    this.events.emit('gameEvent', { mode: 'PAUSE' })
  }
  onAppFocus() {
    // либо: продолжить
    this.time.paused = false
    this.tweens.resumeAll()
    this.roundPaused = false
    this.events.emit('gameEvent', { mode: 'RESUME' })

    // либо (часто лучше для демо/честности): завершить/сбросить раунд
    // this.forceResetRound('background')
  }
  handleButtonClick() {
    // console.log('handleButtonClick')
    const state = this.fsm.getState()
    // console.log('handleButtonClick', state)
    if (state === 'COUNTDOWN' && !this.hasBet) {
      this.handleBet()
      return
    }

    if (
      state === 'START' &&
      this.cashOutAllowed &&
      this.hasBet &&
      !this.hasCashOut
    ) {
      this.handleCashout('manual')
      return
    }
  }
  handleBet() {
    this.hasBet = true
    this.setBetAllowed(false)

    // dev
    if (!this.isBonza) {
      this.currentDeposit -= this.currentBetValue
      if (this.currentDeposit <= 0)
        this.currentDeposit = this.initialDeposit + this.currentDeposit
    }



    this.events.emit('gameEvent', {
      mode: 'BET',
      bet: this.currentBetValue,
      deposit: this.currentDeposit,
    })
  }
  handleCashout(method) {
    console.log('handleCashout method', method)
    // dev
    this.timeCashout = new Date().getTime()
    // console.log('cashoutHandler timeNow', timeNow)

    this.setCashOutAllowed(false)

    this.hasCashOut = true
    // this.sounds.cashout.play()
    // если выход после 0, то нужно что-то менять...
    if (this.stakeValue <= 0) {
      // что-то странное
      this.stakeValue = this.currentBetValue //
    }

    this.currentDeposit += this.stakeValue // добавляем к депозиту

    this.events.emit('gameEvent', {
      mode: 'CASHOUT',
      hasCashOut: this.hasCashOut,
      stakeValue: this.stakeValue,
      deposit: this.currentDeposit,
      method,
    })

    this.stakeValue = 0

    // finish?
    // this.fsm.toFinish()
    this.fsm.toCashout()
  }
  createEvents() {
    // первый раунд ждём ручного старта
    this.events.once('gameEvent', (ev) => {
      // console.error('[DEBUG] Первый старт', ev?.mode) // временно
      if (ev?.mode === 'RISK_SETTING_CHANGED') this.fsm.toCountdown()
    })
    this.events.on('riskTuner:apply', (newRiskSetting) => {
      // console.log('[GameScene] riskTuner:apply', newRiskSetting)
      // вторая проверка...
      const d = { ...newRiskSetting }
      const c = this.currentRiskSetting

      if (
        d.minPayout === c.minPayout &&
        d.maxPayout === c.maxPayout &&
        d.steps === c.steps
      )
        return

      this.pendingRiskSetting = { ...newRiskSetting }
      this.events.emit('gameEvent', {
        mode: 'RISK_SETTING_PENDING',
        setting: this.pendingRiskSetting,
      })
    })
    this.events.on('autoBetting:apply', (newSetting) => {
      // console.log('[GameScene] autoBetting:apply', newSetting)
      this.handleAutoSetting(newSetting)
      // this.pendingAutoSetting = { ...newSetting }
      // this.events.emit('gameEvent', {
      //   mode: 'AUTO_SETTING_PENDING',
      //   // betValue: this.currentBetValue,
      // })
    })
    this.events.on('betChanged', (value) => {
      // console.log('[GameScene] betChanged', value, this.betAllowed)
      if (this.betAllowed) {
        this.currentBetValue = value
        // console.log('[GameScene] betChanged', value)
        this.events.emit('gameEvent', {
          mode: 'BET_CHANGED',
          betValue: this.currentBetValue,
        })
      }
    })

    // dev
    this.events.on('gameEvent', (data) => {
      if (data.mode === 'BONZA') {
        if (this.hasBet && !this.hasCashOut) {
          if (!this.isBonza) this.pendingBonzaAmount += data.amount
          else this.bonzaCount += data.amount

          this.bonusCountAmount += data.amount
          console.log('new bonza', this.bonzaCount, this.pendingBonzaAmount)
          // this.sounds.jingle.play()
        }

      }
    })
    // this.game.events.on(Phaser.Core.Events.BLUR, () => this.scene.pause())
    // this.game.events.on(Phaser.Core.Events.FOCUS, () => this.scene.resume())
  }
  createSounds() {
    this.sounds = {
      // fone: this.sound.add('fone1', {
      //   // volume: 0.01,
      //   loop: true,
      //   delay: 5000,
      // }),
      cashout: this.sound.add('cashout', {
        volume: 0.2,
      }),
      crash: this.sound.add('crash', {
        volume: 0.1,
      }),
      coin: this.sound.add('coin', {
        volume: 0.2,
      }),
      domino: this.sound.add('domino', {
        volume: 1, // detune: 1000
      }),
      shuffle: this.sound.add('shuffle', {
        volume: 1, // detune: 1000
      }),
      hit: this.sound.add('hit', {
        volume: 2, detune: 500
      }),
      jingle: this.sound.add('jingle', {
        volume: 0.2, detune: 0
      }),
      puck: this.sound.add('puck', {
        volume: 0.2, detune: 0
      }),
    }
  }
  createParticles() {
    this.emitter = this.add.particles(
      0,
      0, // стартовая позиция, не важна — мы двигаем emitter потом
      'yellow',
      {
        speed: 500,
        lifespan: 500,
        scale: { start: 2, end: 0 },
        blendMode: 'ADD',
        emitting: false,
      }
    )
  }
  // createGradientTexture(key, color, width, height) {
  //   const canvas = this.textures.createCanvas(key, width, height)
  //   const ctx = canvas.getContext()

  //   const gradient = ctx.createLinearGradient(0, 0, 0, height)
  //   gradient.addColorStop(0, `rgba(${color}, 0.5)`)
  //   gradient.addColorStop(1, `rgba(${color}, 0)`)

  //   ctx.fillStyle = gradient
  //   ctx.fillRect(0, 0, width, height)
  //   canvas.refresh()
  // }
  update(time, deltaMs) {
    this.fpsCounter.setText(`FPS: ${this.game.loop.actualFps.toFixed(0)}`);

    if (this.paused) return; //
    const dt = Math.min(deltaMs / 1000, 0.05);
    this.elapsedSec += dt;
    this.timeCounter.setText(this.elapsedSec.toFixed(2));
    // const timeNow = new Date().getTime();
  }

  // FSM setup
  setupFSMHandlers() {
    this.fsm.onChange((state) => {
      // console.log('FSM state:', state)
      switch (state) {
        case 'COUNTDOWN':
          this.countdown()
          break

        case 'START':
          this.startRound()
          break

        case 'CRASH':
          this.playCrash()
          // this.time.delayedCall(800, () => this.fsm.toFinish())
          break

        case 'CASHOUT':
          this.playCashout()
          // this.time.delayedCall(400, () => this.fsm.toFinish())
          break

        case 'FINISH':
          this.finish()
          break
      }
      // нужен: краш, кэш-аут, взятие последней плашки - фанфары (crash, cashout, complete)
      // бонус: вход, игра, выход, добавление бонуса по ходу
    })
  }
  // round machine
  countdown() {
    // console.time('Time to betting')
    this.events.emit('gameEvent', {
      mode: 'COUNTDOWN',
      betValue: this.currentBetValue,
    })

    this.setBetAllowed(true)
    this.hasCashOut = false
    this.hasBet = false
    this.stakeValue = 0

    if (this.pendingRiskSetting)
      this.handleRiskSettings(this.pendingRiskSetting)

    // if (this.pendingAutoSetting) this.handleAutoSetting(this.pendingAutoSetting)
    if (this.currentAutoSetting.rounds > 0) this.quickMode = true
    else this.quickMode = false // можно флаг менять в настройках

    let countDown = 4 // стандарт
    if (this.quickMode) countDown = 1 // можно при currentAutoSetting делать старт после GO?
    // не выбирать ставку в авто режиме? Как в слотах
    // у меня логика такая: краш это не слот, здесь можно играть ставкой в паузах

    // let roundPrepareDelay = countDown * 1000 - 4000
    let roundStartDelay = this.duration * (countDown * 2 + 0.5)

    let text = ''
    // countDown
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        countDown--
        text = countDown.toFixed(0).toString()

        if (countDown === 0) {
          text = 'GO!'
          // спрятать GO
          this.time.addEvent({
            delay: 300,
            callback: () => {
              this.events.emit('gameEvent', {
                mode: 'COUNTDOWN_UPDATE',
                text: this.payTable[0].multiplier.toFixed(2),
                show: 1,
                // text: '',
                // show: false,
              })
            },
          })
        }
        this.events.emit('gameEvent', {
          mode: 'COUNTDOWN_UPDATE',
          text: text,
          show: true,
        })
      },
      repeat: countDown - 1,
    })
    // round start after...
    this.time.addEvent({
      // delay: roundPrepareDelay,
      callback: () => {
        this.roundPrepare(roundStartDelay)
      },
    })
  }
  roundPrepare(roundStartDelay) {
    // console.log('roundPrepare', roundStartDelay)
    this.events.emit('gameEvent', {
      mode: 'ROUND_PREPARE',
    })

    this.time.addEvent({
      delay: roundStartDelay, // this.duration * roundStartDelay
      callback: () => {
        this.initCrashIndex() // хранить на сервере, запрашивать isCrash каждое касание (за 100 мс)
        // console.log('crashIndex', this.crashIndex)
        // dev

        if (this.crashIndex >= this.payTable.length) console.log('проход до финиша')
        else console.log('crashIndex', this.crashIndex, 'X' + this.payTable[this.crashIndex].multiplier.toFixed(2))

        this.isCrashed = false
        this.bounceCount = 0
        this.roundCounter++

        this.elapsedSec = 0;
        this.timeCounter.setText(this.elapsedSec.toFixed(2));

        // if (this.pendingAutoSetting)
        //   this.handleAutoSetting(this.pendingAutoSetting)

        // автоигра
        if (this.currentAutoSetting.rounds > 0 && !this.hasBet) {
          this.currentAutoSetting.rounds-- // слишком просто?
          // console.log('currentAutoSetting', this.currentAutoSetting.rounds)
          // if (this.currentAutoSetting.rounds === 0)
          this.handleAutoSetting(this.currentAutoSetting)
          this.handleBet()
        }

        this.fsm.toRound()
      },
    })
  }
  startRound() {
    // console.timeEnd('Time to betting')
    // console.time('Round time')
    // console.log('startRound', this.stakeValue)
    this.paused = false;

    this.events.emit('gameEvent', {
      mode: 'START',
      hasBet: this.hasBet,
    })

    this.fallStarter()
  }
  fallStarter() {
    let mode = 'usu'
    let duration = this.duration
    let amount = 1

    const fallTime = 100
    const drillTime = 200

    // console.log('this.bonzaCount', this.bonzaCount)

    if (this.bonzaCount > 0) {
      mode = 'bonza' // mode: bonza ? 'bonza' : 'usu', // dev
      const bonza = this.crashIndex === 0 ? false : true
      amount = this.rnd.between(1, 5) // нужно брать по весу, больше больших

      if (amount > this.crashIndex) amount = this.crashIndex
      // amount = 5 // dev
      duration = fallTime + amount * drillTime + 400
      // duration = 3000
      this.time.delayedCall(fallTime, () => {
        this.onHit(1)
        // если краш мы дальше не идём...

        for (let index = 1; index < amount; index++) {
          this.time.delayedCall(drillTime * index + drillTime, () => {
            if (this.isCrashed) return
            this.onHit(1)
            // this.platforms.removeBlock(index)
          })
        }
      })
      this.time.delayedCall(duration, () => {
        if (this.isCrashed) return
        this.onBounce(amount)
      })
    } else {
      // не бонза
      this.time.delayedCall(duration, () => {
        if (this.hasCashOut) {
          const timeNow = new Date().getTime()
          const timeDiff = timeNow - this.timeCashout
          console.log('timeDiff after cashout', timeDiff)
        }
        if (this.paused) return

        this.onHit(1)
        this.time.delayedCall(0, () => {
          this.onBounce(1)
        })
      })

    }

    // if (this.bonzaCount > 0) this.bonzaCount--

    this.events.emit('gameEvent', {
      mode: 'FALL',
      bonzaCount: this.bonzaCount,
      isBonza: this.isBonza, // всё это не нужно так делать!!!

      load: {
        mode: mode,
        amount: amount,
        duration: duration,
        fallTime,
        drillTime,
        speed: this.gameSpeed,
      }

    })

    // this.time.delayedCall(duration, () => {
    //   this.onHit(amount, this.duration)
    // })
  }
  onHit(amount) {
    // console.log('scene onHit')

    this.checkCrash(this.bounceCount)
    // ещё надо чекать последнюю платформу
    // if (this.isCrashed) this.fsm.toFinish()
    if (this.isCrashed) this.fsm.toCrash()
    else {
      const multiplier = this.payTable[this.bounceCount].multiplier
      const nextMultiplier = this.payTable[this.bounceCount + amount] ?
        this.payTable[this.bounceCount + amount].multiplier : undefined

      this.stakeValue = this.currentBetValue * multiplier

      this.events.emit('gameEvent', {
        mode: 'HIT',
        count: this.bounceCount,
        multiplier: multiplier,
        nextMultiplier,
        stakeValue: this.stakeValue,
        hasBet: this.hasBet,
        amount: amount,
        isBonza: this.isBonza,
        // bonzaCount: this.bonzaCount
      })

      if (this.bounceCount === 0 && !this.cashOutAllowed)
        this.setCashOutAllowed(true)

      // if (this.currentAutoSetting.cashout > 0) this.checkAutoCashout(multiplier)

      this.bounceCount += amount

      // if (this.bonzaCount === 0) this.isBonza = false

      // если нет продолжения нужно делать фейрверк

      // dev
      // if (multiplier >= this.smallShakeX && multiplier < this.medShakeX)
      //   this.cameras.main.shake(100, 0.002)
      // if (multiplier >= this.medShakeX) this.cameras.main.shake(100, 0.002)

      // отскок и новое падение следом
      // this.time.delayedCall(bounceDelay, () => {
      //   this.onBounce(amount)
      // })
      //
      // this.sounds.hit.play()
    }
  }
  onBounce(amount) {
    // console.log('onBounce')
    if (this.paused) return
    if (this.bonzaCount === 0) this.isBonza = false
    // dev - bad
    // if (this.hasBet && this.hasCashOut) {
    //   this.fsm.toFinish()
    //   return
    // }

    // запросы на сервер? Что здесь?

    this.events.emit('gameEvent', {
      mode: 'BOUNCE',
      count: this.bounceCount,
      // multiplier: multiplier,
      // nextMultiplier,
      // stakeValue: this.stakeValue,
      // hasBet: this.hasBet,
      amount: amount,
      isBonza: this.isBonza,
      // bonzaCount: this.bonzaCount
    })

    // // здесь нет multiplier, не проверить авто-кэш-аут? 
    // const multiplier = this.payTable[this.bounceCount - 1].multiplier // dev
    // if (this.currentAutoSetting.cashout > 0) this.checkAutoCashout(multiplier)

    // if (this.paused) return
    // а как же бонза?

    let delayBeforeFall = this.duration
    if (this.bonzaCount > 0) delayBeforeFall = 1000
    this.time.delayedCall(delayBeforeFall, () => {
      // dev
      // здесь не должно быть проверки?
      const multiplier = this.payTable[this.bounceCount - 1].multiplier // dev
      if (this.currentAutoSetting.cashout > 0) this.checkAutoCashout(multiplier)
      if (this.paused) return // dev

      this.fallStarter()
    })

    // this.events.emit('gameEvent', {
    //   mode: 'FALL',
    //   load: {
    //     mode: 'usu', // bonza usu

    //   }
    // })

    // this.time.delayedCall(this.duration, () => {
    //   this.onHit()
    // })
  }
  playCrash() {
    console.log('playCrash')
    this.paused = true;
    this.setCashOutAllowed(false)

    this.events.emit('gameEvent', {
      mode: 'CRASH',
      isCrashed: this.isCrashed,
      hasBet: this.hasBet,
      hasCashOut: this.hasCashOut,
      stakeValue: this.stakeValue,
      count: this.bounceCount,
    })

    // пауза перед финишем
    this.time.addEvent({
      delay: 100,
      callback: () => {
        // console.timeEnd('Round time')
        this.fsm.toFinish()
      },
    })
  }
  playCashout() {
    console.log('playCashout')
    this.paused = true;
    this.setCashOutAllowed(false)

    this.time.addEvent({
      delay: 100,
      callback: () => {
        // console.timeEnd('Round time')
        this.fsm.toFinish()
      },
    })
  }
  finish() {
    // console.log('this.cashOutAllowed', this.cashOutAllowed)
    this.paused = true;
    // this.sounds.crash.play()

    this.setCashOutAllowed(false)

    if (this.bonzaCount > 0) this.bonzaCount--
    if (this.pendingBonzaAmount) this.handleBonza()

    this.events.emit('gameEvent', {
      mode: 'FINISH',
      isCrashed: this.isCrashed,
      hasBet: this.hasBet,
      hasCashOut: this.hasCashOut,
      // cashOutAllowed: this.cashOutAllowed,
      stakeValue: this.stakeValue,
      count: this.bounceCount,
    })

    this.time.addEvent({
      delay: this.duration,
      callback: () => {
        // console.timeEnd('Round time')
        this.fsm.toCountdown()
      },
    })

    // dev
    this.roundTime.push(this.elapsedSec);
    const avgTime = this.roundTime.reduce((acc, val) => acc + val, 0) / this.roundTime.length;
    console.log('Rounds:', this.roundTime.length, 'Average Round Time:', avgTime.toFixed(2), 'seconds');
  }

  // вспомогательные методы
  setCashOutAllowed(state) {
    if (this.cashOutAllowed === state) return
    this.cashOutAllowed = state

    this.events.emit('gameEvent', {
      mode: 'CASHOUT_ALLOWED',
      cashOutAllowed: state,
      hasBet: this.hasBet,
    })
  }
  setBetAllowed(state) {
    if (this.betAllowed === state) return
    this.betAllowed = state

    this.events.emit('gameEvent', {
      mode: 'BET_ALLOWED',
      betAllowed: state,
    })
  }
  handleAutoSetting(settings) {
    this.currentAutoSetting = { ...settings }
    this.pendingAutoSetting = null

    this.events.emit('gameEvent', {
      mode: 'AUTO_SETTING_CHANGED',
      default: this.defaultAutoSetting,
      current: this.currentAutoSetting,
    })
  }
  checkCrash() {
    // console.log('checkCrash', this.bounceCount)
    // логика проверки краша:
    // до касания платформы делаем запрос на сервер с номером подходящей платформы
    // медленно опускаем шар до получения ответа
    // ответ получен, шар летит по расписанию
    // или небольшая задержка - вот этого хотелось бы избежать
    // isCrash?
    // если да, крашим
    if (this.bounceCount >= this.crashIndex) {
      // console.log('CRASH!')
      this.isCrashed = true
    }
  }
  checkAutoCashout(multiplier) {
    // console.log('checkAutoCashout', multiplier, this.currentAutoSetting.cashout)
    if (
      this.cashOutAllowed &&
      this.hasBet &&
      !this.hasCashOut &&
      this.currentAutoSetting.cashout <= multiplier
    )
      this.handleCashout('auto')
  }

  // dispatch
  handleBonza(amount) {
    this.bonzaCount += this.pendingBonzaAmount
    this.pendingBonzaAmount = 0
    this.isBonza = true

    this.bonusCount++
    this.bonusCounter.setText('BC:' + this.bonusCount + '/' + this.bonusCountAmount)
    // event
  }
  handleRiskSettings(settings) {
    if (this.isDev) this.handleRiskSettings_local(settings)
    else this.handleRiskSettings_server(settings)
  }
  initCrashIndex() {
    if (this.isDev) this.initCrashIndex_local()
    else this.initCrashIndex_server()
  }

  // local
  handleRiskSettings_local(settings) {
    this.currentRiskSetting = { ...settings }
    const tables = this.generateCrashTable(this.currentRiskSetting)
    this.crashTable = tables.crashTable // живёт на сервере
    this.payTable = tables.payTable // нужен на клиенте
    this.pendingRiskSetting = null

    this.events.emit('gameEvent', {
      mode: 'RISK_SETTING_CHANGED',
      default: this.defaultRiskSetting,
      current: this.currentRiskSetting,
      crashTable: this.crashTable,
      payTable: this.payTable
    })
  }
  generateCrashTable(crashSetting) { // old
    // console.log('generateCrashTable', crashSetting, this.houseEdge)

    const ratio = Math.pow(
      crashSetting.maxPayout / crashSetting.minPayout,
      1 / (crashSetting.steps - 1)
    )
    // console.log('ratio', ratio)

    const RTP = 1 - this.houseEdge / 100

    let acc = 0

    const crashTable = []
    const payTable = []

    for (let i = 0; i <= crashSetting.steps; i++) {
      let multiplier, base, real_multyplier
      if (i === 0) {
        multiplier = 0
        base = 0
      } else if (i === crashSetting.steps) {
        multiplier = crashSetting.maxPayout
        base = RTP / multiplier
      }
      else if (i === 1) {
        multiplier = crashSetting.minPayout
        base = RTP / multiplier
      } else {
        multiplier = crashSetting.minPayout * Math.pow(ratio, i - 1)
        base = RTP / multiplier
      }

      crashTable.push({
        step: i,
        multiplier,
        probability: undefined,
        acc: undefined,
        base,
      })

      if (i > 0) {
        payTable.push({
          step: i,
          multiplier,
        })
      }
    }

    for (let i = crashTable.length - 1; i >= 0; i--) {
      // console.log(i, 'обратка', i, crashTable[i].multiplier)
      if (i < crashTable.length - 1 && i !== 0) {
        crashTable[i].probability = crashTable[i].base - crashTable[i + 1].base
      } else {
        crashTable[i].probability = crashTable[i].base
      }
      crashTable[i].acc = 1 - acc
      acc += crashTable[i].probability
      if (i === 0) crashTable[i].probability = 1 - acc
    }

    // console.table(crashTable)
    // console.table(payTable)
    // dev
    // this.checkMath(crashTable)

    // dev
    // this.generateCrashTable_(crashSetting)
    return { crashTable, payTable }
  }
  _generateCrashTable(crashSetting) { // new
    console.log('generateCrashTable', crashSetting, this.houseEdge)

    const ratio = Math.pow(
      crashSetting.maxPayout / crashSetting.minPayout,
      1 / (crashSetting.steps - 1)
    )
    console.log('ratio', ratio)

    const RTP = 1 - this.houseEdge / 100

    let acc = 0

    const crashTable = []

    for (let i = 1; i <= crashSetting.steps; i++) {
      let multiplier, base, real_multyplier

      multiplier = crashSetting.minPayout * Math.pow(ratio, i - 1)
      base = RTP / multiplier

      crashTable.push({
        step: i,
        multiplier,
        // real_multyplier,
        probability: undefined,
        acc: undefined,
        base,
      })
    }
    // console.table(crashTable)

    for (let i = crashTable.length - 1; i >= 0; i--) {
      // console.log(i, 'обратка', i, crashTable[i].multiplier)
      if (i < crashTable.length - 1 && i !== 0) {
        crashTable[i].probability = crashTable[i].base - crashTable[i + 1].base
      } else {
        crashTable[i].probability = crashTable[i].base
      }
      crashTable[i].acc = 1 - acc
      acc += crashTable[i].probability
      if (i === 0) crashTable[i].probability = 1 - acc
    }

    console.table(crashTable)
    // dev
    // this.checkMath(crashTable)
    return crashTable
  }
  checkMath(crashTable) {
    const roundCount = 1000000
    const result = []
    let RTP = 0

    for (let index = 1; index < crashTable.length; index++) {
      const playerChoice = crashTable[index].multiplier
      let winCount = 0
      let x1 = 0

      for (let ind = 0; ind < roundCount; ind++) {
        let acc = 0
        let multiplier = 0
        let random = Math.random() // первый на х1 краш

        for (let i = 0; i < crashTable.length; i++) {
          // можно один раз зафиксировать асс и не считать
          // let half = this.crashTable[i].probability * 0.5 // половина
          // if (i === 0) acc += this.crashTable[i].probability
          // else acc += half
          // acc += this.crashTable[i].probability

          if (random < crashTable[i].acc) {
            multiplier = crashTable[i].multiplier
            if (playerChoice <= multiplier) {
              winCount++
            }
            if (multiplier === 0) x1++
            break
          }
          // if (i > 0) acc += half
        }
      }
      let rtp = ((winCount * playerChoice) / roundCount) * 100
      RTP += rtp
      result.push({
        index,
        Crashes: x1,
        playerChoice,
        winCount,
        win: winCount * playerChoice,
        'RTP %': rtp,
      })
    }
    console.table(result)
    console.log('ave RTP', RTP / (crashTable.length - 1))
  }
  initCrashIndex_local() { // old
    let random = Math.random()
    console.log('random', random)
    // random = 0.999999999 // dev 
    if (this.bonzaCount > 0) {
      // random *= 2 // bonza 2 - больше 1 часто, значит максимум
      random = Phaser.Math.FloatBetween(this.minBonzaRandom, 1) // bonza 1
      console.log('bonza random', random)
    }

    let multiplier = null
    let index = 0
    let acc = 0
    function getCrashIndex(crashTable) {
      for (let i = 0; i < crashTable.length; i++) {
        // acc += crashTable[i].probability
        if (random < crashTable[i].acc) {
          acc = crashTable[i].acc
          multiplier = crashTable[i].multiplier
          index = i
          return i
        }
      }
    }
    this.crashIndex = getCrashIndex(this.crashTable) // следующий будет краш!


    return this.crashIndex
  }

  // server
  async handleRiskSettings_server(settings) {
    this.currentRiskSetting = { ...settings }
    try {
      this.crashTable = await this._fetchCrashTable(this.currentRiskSetting)
      // console.error('[DEBUG] Первый старт', ev?.mode) // временно
    } catch (e) {
      console.error('[GameScene] crash-table failed:', e)
      // fallback: оставим старую таблицу, либо прервём раунд — на твой выбор
      this.crashTable = this.crashTable
    }
    this.pendingRiskSetting = null

    this.events.emit('gameEvent', {
      mode: 'RISK_SETTING_CHANGED',
      default: this.defaultRiskSetting,
      current: this.currentRiskSetting,
      crashTable: this.crashTable,
    })
  }
  async _fetchCrashTable(crashSetting) {
    const res = await fetch('/api/crash-table', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        minPayout: crashSetting.minPayout,
        maxPayout: crashSetting.maxPayout,
        steps: crashSetting.steps,
      }),
    })
    const data = await res.json()
    if (!data.ok) throw new Error(data.error || 'Crash table error')
    // else console.table(data.table)
    return data.table
  }
  async _fetchCrashIndex(table) {
    const res = await fetch('/api/crash-index', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table }),
    })
    const data = await res.json()
    if (!data.ok) throw new Error(data.error || 'Crash index error')
    return data.crashIndex
  }
  async initCrashIndex_server() {
    try {
      if (!Array.isArray(this.crashTable) || this.crashTable.length === 0) {
        // на всякий случай — если таблица ещё не подтянулась
        this.crashTable = await this._fetchCrashTable(this.currentRiskSetting)
      }
      const idx = await this._fetchCrashIndex(this.crashTable) // отправлять таблицу на сервер? глупо, там есть экземпляр
      this.crashIndex = idx
      // console.log('this.crashIndex', this.crashIndex)
      return this.crashIndex
    } catch (e) {
      console.error('[GameScene] initCrashIndex failed:', e)
      // безопасный fallback: задаём быстрый краш (например, 1), чтобы игрок не «фармил»
      this.crashIndex = 1
      return this.crashIndex
    }
  }

}
