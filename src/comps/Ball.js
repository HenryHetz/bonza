import { BallTrail } from './BallTrail.js';

export class Ball {
  constructor(scene, emitter, bounceHandler) {
    this.scene = scene
    this.diameter = 110
    this.x = scene.sceneCenterX // this.scene.ballX
    this.y = scene.ballY + this.diameter / 2 // this.scene.ballY + this.diameter / 2
    this.hitPointY = this.scene.hitPointY // точка удара - и достаточно!
    this.distanceY = this.hitPointY - this.y // scene.distanceY 

    this.fujiY = 320 + this.diameter / 2

    this.duration = scene.duration
    this.emitter = emitter
    this.bounceHandler = bounceHandler
    this.depth = 20

    this.color = this.scene.standartColors.red // красный цвет
    // this.ball = scene.add
    //   .image(this.x, this.y, 'ball')
    //   .setOrigin(0.5, 1)
    //   .setScale(0.8)
    //   .setAlpha(0)

    this.ball = scene.add
      .ellipse(this.x, this.y, this.diameter, this.diameter, this.color)
      .setOrigin(0.5, 1)
      .setAlpha(0)
      .setDepth(this.depth)

    // dev чтобы шар превращался в квадрат
    // this.ball = scene.add.graphics().setDepth(this.depth).setAlpha(1)
    // this.r = this.diameter / 2
    // this.redraw()

    // scene.tweens.add({
    //   targets: this.r,
    //   r: 0,
    //   delay: 500,
    //   duration: 1000,
    //   ease: 'Linear',
    //   onUpdate: () => this.redraw()
    // });

    this.isActive = false
    this.bounceTween = null

    this.createEvents()
    this.createEffects()

    // dev
    this.trail = new BallTrail(scene, {
      x: this.x,
      y: this.y,
      width: this.diameter,
    });
  }
  createEffects() {
    // Создаем emitter на старте сцены
    this.ballTrailEmitter = this.scene.add.particles(
      0,
      0,
      'red', // Твоя текстура трейла
      {
        follow: this.ball, // Привязываем к шару!
        speed: { min: 10, max: 100 },
        // angle: { min: 1800, max: 3600 },
        // x: { min: -100, max: 100 },
        lifespan: 1000,
        alpha: { start: 0.5, end: 0 },
        scale: { start: 5, end: 0 },
        quantity: 1,
        frequency: 25,
        blendMode: 'ADD',
        emitting: false,
      }
    )
    // старый эмиттер в пигги
    // this.tail = this.scene.add.particles('red');
    // this.tailEmitter = this.tail.createEmitter({
    //   speed: { min: 10, max: 50 },
    //   lifespan: 3000,
    //   gravityY: -50,
    //   quantity: 1,
    //   // scale: { start: 0.6, end: 0, ease: 'Power3' }, // большой размер частиц
    //   scale: { start: 2, end: 0, ease: 'Power3' }, // малый размер частиц
    //   blendMode: 'ADD', // ADD, COLOR_DODGE,
    //   active: true,
    // });
    // пульсация
    this.pulseTween = this.scene.tweens.add({
      targets: this.ball,
      scale: { from: 1, to: 1.05 },
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      duration: 50,
      paused: true,
    })
    // свечение
  }
  updateEffects(multiplier) {
    // console.log('updateEffects', multiplier)
    if (
      multiplier >= this.scene.smallShakeX &&
      !this.ballTrailEmitter.emitting
    ) {
      // this.ballTrailEmitter.emitting = true
      // this.pulseTween.resume()
    }
    if (multiplier >= this.scene.medShakeX && this.pulseTween.paused) {
      // console.log('updateEffects pulseTween')
      // this.pulseTween.resume()
    }
  }
  update() {
    // console.log('ball update')
    // this.ballTrailEmitter.setPosition(this.ball.x, this.ball.y)
  }
  createEvents() {
    this.scene.events.on('gameEvent', (data) => {
      this.handleEvent(data)
    })
    this.scene.events.on('update', this.update, this)
  }
  handleEvent(data) {
    if (data.mode === 'COUNTDOWN') {
    }
    if (data.mode === 'ROUND_PREPARE') {
      this.ball.setFillStyle(this.scene.standartColors.red)
      // this.ball.alpha = 1
      this.isActive = true
      this.reset()
    }
    if (data.mode === 'START') {
      // this.fall() // 
    }
    if (data.mode === 'FALL') {
      this.fallHandler(data.load) // 
    }
    if (data.mode === 'HIT') {
      this.bounce() // всё надо синхронизировать 
      // this.fall(this.bounceHandler)
      this.updateEffects(data.multiplier)
    }
    if (data.mode === 'FINISH') {
      this.stop()
    }
    if (data.mode === 'CASHOUT') {
      this.cashoutHandler(data)
    }
  }
  cashoutHandler(data) {
    // console.log('cashoutHandler', data)
    // this.stopTween() - надо иначе
    this.isActive = false
    // this.ball.setFillStyle(this.scene.standartColors.dark_gray) // white
    // this.ball.alpha = 0
  }
  reset() {
    // this.clearTint()
    // this.ball.y = this.y
    this.scene.tweens.add({
      targets: this.ball,
      y: this.y,
      alpha: 1,
      duration: 1000,
      ease: 'Quad.easeOut',
    })
  }
  up() {
    this.scene.tweens.add({
      targets: this.ball,
      delay: 0,
      alpha: 0,
      duration: 0,
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.ball,
          delay: 100,
          y: this.fujiY, // уходит в фуджи
          duration: 0,
        })
      },
    })
  }
  fallAndBounce(callback) {
    const scene = this.scene;
    const y0 = this.y;

    const creep = 10;
    const drop = this.distanceY;
    const overshoot = 6;
    const t = this.duration;

    scene.tweens.killTweensOf(this.ball);

    scene.tweens.timeline({
      targets: this.ball,
      tweens: [
        // 1. Медленное сползание
        {
          y: y0 + creep,
          duration: t * 0.25,
          ease: 'Sine.easeInOut'
        },

        // 2. Резкое ускорение вниз
        {
          y: y0 + drop,
          duration: t * 0.35,
          ease: 'Quart.easeIn'
        },

        // 3. УДАР (компрессия)
        {
          y: y0 + drop + overshoot,
          duration: t * 0.05,
          ease: 'Quad.easeIn',

          onComplete: () => {
            // 💥 МОМЕНТ УДАРА
            if (callback) callback();
            // логика краша / расчёт / фиксация
            console.log('HIT', scene.elapsedSec);
          }
        },

        // 4. Резкий отскок
        {
          y: y0 + drop * 0.35,
          duration: t * 0.15,
          ease: 'Back.easeOut'
        },

        // 5. Медленное замирание
        {
          y: y0,
          duration: t * 0.20,
          ease: 'Sine.easeOut'
        }
      ]
    });
  }
  fallHandler(load) {
    // console.log('fallHandler', load.mode, load.depth)
    if (load.mode === 'common') this.fall()
    if (load.mode === 'bonza') this.rush(load.amount)
  }
  rush(amount) {
    this.stopTween()

    this.trail.start();

    this.bounceTween =
      this.scene.tweens.add({
        targets: this.ball,
        y: this.hitPointY,
        duration: 200, // this.duration / 2
        //   yoyo: true,
        ease: 'Quad.easeIn', // 'Sine.easeIn'
        onUpdate: (tween) => {
          // рисовать след
          // onUpdate твина
          this.trail.render(this.ball.y);
          // this.trail.render(this.ball.x, this.ball.y - this.diameter / 2);
          // this.drawShadow(this.ball.y, tween.progress)
          // if (!patternSwitched && tween.progress > 0.95) {
          // }
        },
        onComplete: () => {
          this.shake()


          for (let index = 1; index <= amount; index++) {
            // пробиваем
            const y = this.hitPointY + index * (180 / 5)
            this.scene.tweens.add({
              targets: this.ball,
              y: y,
              delay: 200 * (index - 1),
              duration: 100,
              ease: 'Back.easeIn', // 'Sine.easeIn' 'Back.easeIn'
              onComplete: () => {
                this.trail.render(this.ball.y);
                // this.trail.stop();
                // this.shake()
                // dev
                this.scene.platforms.removeBlock()

              },
            })
          }

          // this.trail.stop();
        },
      })
  }
  shake() {
    this.scene.cameras.main.shake(10, 0.005)
    this.trail.render(this.ball.y);
  }
  drawShadow(y, progress) {
    // console.log('drawShadow', y, progress)
  }
  fall(callback) {
    this.stopTween()
    // if (!this.isActive) return
    // this.trail.start();
    // console.log('ball fall start', this.scene.elapsedSec.toFixed(2))

    this.bounceTween =
      this.scene.tweens.add({
        targets: this.ball,
        y: this.y + 20,
        duration: this.duration * 0.6, // this.duration / 2
        //   yoyo: true,
        ease: 'Quad.easeIn', // 'Sine.easeIn'

        onComplete: () => {
          // this.trail.start();
          // console.log('ball fall faze 2', this.scene.elapsedSec.toFixed(2))

          this.scene.tweens.add({
            targets: this.ball,
            y: this.y + this.distanceY,
            // delay: this.duration / 2,
            duration: this.duration * 0.4, // this.duration / 2
            //   yoyo: true,
            ease: 'Quad.easeIn', // 'Sine.easeIn'
            onUpdate: (tween) => {
              // this.trail.render(this.ball.y);
            },
            onComplete: () => {
              // this.trail.stop();
              // this.trail.render(this.ball.y);
              if (callback) callback()
              // this.bounce(callback)
              // const timeNow = new Date().getTime();
              // console.log('ball hit', this.scene.elapsedSec)
            },
          })
        },
      })

  }
  bounce(callback) {
    // stop falling
    this.trail.stop();
    this.stopTween()
    this.ball.y = this.y + this.distanceY

    // var 1
    // this.bouncing =
    //   this.scene.tweens.add({
    //     targets: this.ball,
    //     y: this.y + 20,
    //     duration: this.duration * 0.6, // this.duration
    //     ease: 'Qubic.easeOut', // Quart
    //     onComplete: () => {
    //       // setTimeout(() => {
    //       //   if (callback) callback()
    //       // }, this.duration / 2);
    //       this.scene.tweens.add({
    //         targets: this.ball,
    //         y: this.y,
    //         duration: this.duration * 0.4, // this.duration
    //         // yoyo: true,
    //         ease: 'Quad.easeOut', // Qubic
    //         // onYoyo: () => { },
    //         onComplete: () => {
    //           if (callback) callback()
    //           // this.fall(callback)
    //           // console.log('apogei',)
    //         },
    //       })
    //       // if (callback) callback()
    //       // console.log('bounce',)
    //     },
    //   })

    // var 2
    this.bouncing =
      this.scene.tweens.add({
        targets: this.ball,
        y: this.y,
        duration: this.duration, // this.duration
        ease: 'Quart.easeOut', // Quart
        onComplete: () => {
          if (callback) callback()
        },
      })
  }
  stop() {
    this.stopTween()
    // this.emitter.explode(30, this.ball.x, this.ball.y)
    this.up()
    // dev
    this.ballTrailEmitter.emitting = false
    if (this.pulseTween) this.pulseTween.pause()
  }
  stopTween() {
    if (this.bounceTween) this.bounceTween.stop()
  }
  setBounceTween(tween) {
    this.bounceTween = tween
  }

  setTint(color) {
    // this.ball.setTint(color)
  }

  clearTint() {
    // this.ball.clearTint()
  }

  getX() {
    return this.ball.x
  }

  getY() {
    return this.ball.y
  }

  redraw() {
    const w = this.diameter;
    const h = this.diameter;

    this.ball.clear();
    this.ball.fillStyle(this.color, 1);

    // если ваша позиция - центр:
    const x = this.x - w / 2;
    const y = this.y - h / 2;

    this.ball.fillRoundedRect(this.x - this.diameter / 2, this.y - this.diameter, w, h, this.r);

    console.log('ball', this.x, this.y, this.ball)
  }
}
