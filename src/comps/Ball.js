import { on } from 'ws';
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

    this.easeBackInOut = (v) => Phaser.Math.Easing.Back.InOut(v, 0.5) // 0.7
    this.easeBackIn = (v) => Phaser.Math.Easing.Back.In(v, 0.4) // 0.7
    this.easeNewOut = (v) => Phaser.Math.Easing.Quadratic.Out(v, 0.9) // 0.7 
    this.easeNewIn = (v) => Phaser.Math.Easing.Quadratic.In(v, 0.9) // 0.7
    // Sine Quintic

    this.duration = scene.duration
    this.emitter = emitter
    this.bounceHandler = bounceHandler
    this.depth = 20
    this.isCircle = true

    this.color = this.scene.standartColors.red // красный цвет
    this.darkColor = this.scene.standartColors.dark_red
    // this.ball = scene.add
    //   .image(this.x, this.y, 'ball')
    //   .setOrigin(0.5, 1)
    //   .setScale(0.8)
    //   .setAlpha(0)

    // this.ball_1 = scene.add
    //   .ellipse(this.x, this.y, this.diameter, this.diameter, this.color)
    //   .setOrigin(0.5, 1)
    //   .setAlpha(1)
    //   .setDepth(this.depth)
    // console.log('drawCircle', this.x, this.y, this.ball)

    // dev чтобы шар превращался в квадрат
    this.ball = scene.add.graphics().setDepth(this.depth).setAlpha(1)
    // this.drawSquare()
    this.drawCircle()

    // scene.tweens.add({
    //   targets: this.r,
    //   r: 0,
    //   delay: 500,
    //   duration: 1000,
    //   ease: 'Linear',
    //   onUpdate: () => this.drawSquare()
    // });

    this.state = 'idle'
    this.isActive = false
    this.ballTween = null

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
      // this.ball.setFillStyle(this.scene.standartColors.red)
      // this.ball.alpha = 1
      this.isActive = true
      this.reset()
      // как переключаться между режимами?
      this.checkShape(this.scene.bonzaCount)
    }
    if (data.mode === 'START') {
      // this.fall() // 
    }
    if (data.mode === 'FALL') {
      this.fallHandler(data.load) // 
    }
    if (data.mode === 'HIT') {
      // this.onHit(data) // всё надо синхронизировать 
      // this.fall(this.bounceHandler)
      // this.updateEffects(data.multiplier)
    }
    if (data.mode === 'BOUNCE') {
      this.onBounce(data) // всё надо синхронизировать 
      // this.fall(this.bounceHandler)
      // this.updateEffects(data.multiplier)
    }
    if (data.mode === 'FINISH') {
      // this.stop(data)
      this.state = 'idle'
    }
    if (data.mode === 'CASHOUT') {
      this.cashoutHandler(data)
    }
    if (data.mode === 'CRASH') {
      this.crashHandler(data)
    }
    if (data.mode === 'CRASH') {
      this.crashHandler(data)
    }

  }
  checkShape(mode) {
    if (mode && this.isCircle) this.transToSquare()
    if (!mode && !this.isCircle) this.transToCircle()
  }
  transToSquare() {
    this.isCircle = false
    this.drawSquare()
  }
  transToCircle() {
    this.isCircle = true
    this.drawCircle()
  }
  crashHandler(data) {
    // console.log('crashHandler', data)
    this.isActive = false

    this.stopTween()
    this.removeTrail(0, 0)
    this.hide()
  }
  cashoutHandler(data) {
    console.log('cashoutHandler', data)
    // надо медленно останавливать шар, если он уже падает на платформу
    // коснулся - пересчёт ситуации краш или нет
    // не коснулся - просто рассыпался/растворился
    // this.stopTween()
    if (data.method === 'auto') {
      // this.hide()
      // this.pulse()
      return
    }

    if (this.state === 'falling') {
      this.stopTween()
      this.removeTrail(200, 0)
      // посчитаем, коснётся ли шар платформы за оставшееся время
      const distToGo = this.hitPointY - this.ball.y
      const totalDist = this.distanceY
      const timeToGo = (distToGo / totalDist) * this.duration
      console.log('cashoutHandler distToGo', distToGo)
      // вообще нам надо понимать когда пришёл ответ от сервера о кэшауте
      // а потом показывать краш или нет
      // dev
      let ballMoveDistance = 100
      if (distToGo < ballMoveDistance) ballMoveDistance = distToGo

      // return
      this.ballTween =
        this.scene.tweens.add({
          targets: this.ball,
          y: this.ball.y + ballMoveDistance,
          alpha: 0,
          duration: this.duration,
          ease: 'Quad.easeOut',
          onComplete: () => {
            // dev
            if (ballMoveDistance < 100) {
              // искры показать...
              // this.emitter.explode(30, this.ball.x, this.ball.y)

            }
            this.hide()
          }
        })
    } else {
      // this.ballTween =
      this.scene.tweens.add({
        targets: this.ball,
        alpha: 0,
        duration: this.duration,
        ease: 'Quad.easeOut',
        onComplete: () => {
          this.hide()

        }
      })
    }

  }
  pulse() {
    this.stopTween()
    this.ballTween =
      this.scene.tweens.add({
        targets: this.ball,
        // scale: 1.1,
        alpha: 0.8,
        duration: 50,
        ease: 'Quad.easeOut',
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          this.ball.scale = 1
        }
      })
  }
  stop(data) {
    // console.log('ball stop', data.isCrashed)
    this.stopTween()
    // здесь нужно поработать
    // if (data.isCrashed) {
    //   this.removeTrail(0, 0)
    // } else this.removeTrail(100, 0)
    // // this.emitter.explode(30, this.ball.x, this.ball.y)
    // this.hide()

    // dev
    // this.ballTrailEmitter.emitting = false
    // if (this.pulseTween) this.pulseTween.pause()
  }
  reset() {
    // this.clearTint()
    // this.ball.y = this.y
    this.stopTween()
    this.removeTrail(0, 0)
    // if (this.scene.isBonza) this.ball.y = this.y
    // else this.ball.y = this.fujiY

    this.ball.y = this.y

    this.ballTween =
      this.scene.tweens.add({
        targets: this.ball,
        // y: this.y,
        alpha: 1,
        duration: 500,
        ease: 'Quad.easeOut',
      })
  }
  hide() {
    this.stopTween()
    this.ballTween =
      this.scene.tweens.add({
        targets: this.ball,
        delay: 0,
        alpha: 0,
        duration: 0,
        // y: this.y,
        onComplete: () => {
          if (this.scene.isBonza) this.ball.y = this.y
          else this.ball.y = this.fujiY
          // this.stopTween()
          // this.ballTween =
          //   this.scene.tweens.add({
          //     targets: this.ball,
          //     // delay: 100,
          //     y: this.y, // 
          //     duration: 0,
          //   })
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
    if (load.mode === 'usu') this.fall()
    if (load.mode === 'bonza') this.rush(load)
  }
  bonza(amount) {
    this.stopTween()
    this.fall(() => {
      // маленький отскок

      this.ballTween =
        this.scene.tweens.add({
          targets: this.ball,
          y: this.ball.y - 50,
          x: this.x + 10,
          duration: 400, // this.duration
          ease: 'Qubic.easeOut', // Quart
          onComplete: () => {

          },
        })
    })

  }
  miniFall(time, distance,) {
    this.stopTween()

    this.ballTween =
      this.scene.tweens.add({
        targets: this.ball,
        y: this.ball.y + distance,
        // delay: load.drillTime * (index),
        duration: time, // this.duration / 2
        ease: 'Back.easeIn', // 'Sine.easeIn' 'Back.easeIn'
        onComplete: () => {
          this.scene.platforms.removeBlock()
        },
      })
  }
  rush(load) {
    this.state = 'rushing'

    this.stopTween()
    this.trail.start();
    this.ball.alpha = 1

    this.ballTween =
      this.scene.tweens.add({
        targets: this.ball,
        y: this.hitPointY,
        duration: load.fallTime, // this.duration / 2
        ease: 'Quad.easeIn', // 'Sine.easeIn'
        onUpdate: (tween) => {
          // рисовать след
          this.trail.render(this.ball.y - 60);
        },
        onComplete: () => {
          if (load.speed === 3) {
            const startY = this.ball.y
            const y = this.hitPointY + load.amount * (180 / 5)
            // this.trail.start()

            // пробиваем
            this.ballTween =
              this.scene.tweens.add({
                targets: this.ball,
                y: y, // var 1
                duration: load.drillTime, // this.duration / 2
                // ease: 'Back.easeIn', // 'Sine.easeIn' 'Back.easeIn'
                // ease: 'Sine.easeIn',
                onComplete: () => {
                  this.trail.render(this.ball.y - 60, this.y - 200);
                  for (let index = 1; index <= load.amount; index++) {
                    this.scene.platforms.removeBlock()
                  }
                  this.removeTrail(load.drillTime * 2, 0)
                },
              })
            return
          } else {
            // надо закрашивать первую платформу в серый
            // или красный
            // она - самое напряжение игрока
            // dev
            this.scene.platforms.setDarkBlock(0)

            for (let index = 1; index <= load.amount; index++) {
              // пробиваем
              const y = this.hitPointY + index * (180 / 5)
              this.scene.tweens.add({
                targets: this.ball,
                y: y, // var 1
                // alpha: 0.99, // var 2
                delay: load.drillTime * (index),
                duration: load.drillTime, // this.duration / 2
                ease: 'Back.easeIn', // 'Sine.easeIn' 'Back.easeIn'
                // ease: 'Sine.easeIn',
                onStart: () => {
                  // this.scene.platforms.setDarkBlock(index)
                },
                onComplete: () => {
                  // dev
                  if (!this.scene.isCrashed) this.scene.platforms.removeBlock()

                },
              })
            }

            this.removeTrail(load.drillTime * 2)
            this.shake()
          }
        },
      })
  }
  removeTrail(duration, delay = 0) {
    // плавно убрать длину хвоста
    this.scene.tweens.add({
      targets: this.trail,
      alpha: 0.8,
      delay: delay,
      duration: duration, // this.duration / 2
      // ease: 'Back.easeIn', // 'Sine.easeIn' 'Back.easeIn'
      onUpdate: (tween) => {
        // рисовать след
        const len = (this.ball.y - 20 - this.y + 180) * (1 - tween.progress)
        // console.log('rush onUpdate', tween.progress, len)
        this.trail.render(this.ball.y - 20, this.ball.y - 20 - len);
      },
      onComplete: () => {
        this.trail.alpha = 1
        this.trail.stop()
      },
    })
  }
  shake() {
    // const time = Phaser.Math.Between(0.005, 0.001)
    const intensity = Phaser.Math.Between(0.002, 0.005)
    const duration = Phaser.Math.Between(20, 60)
    this.scene.cameras.main.shake(duration, 0.005)
    // this.trail.render(this.ball.y);
  }
  fall(callback) {
    // this.state = 'falling'
    this.stopTween()
    // if (!this.isActive) return
    // this.trail.start();
    // console.log('ball fall start', this.scene.elapsedSec.toFixed(2))
    this.ball.alpha = 1

    this.ballTween =
      this.scene.tweens.add({
        targets: this.ball,
        y: this.y + 20,
        duration: this.duration * 0.6, // this.duration / 2
        //   yoyo: true,
        ease: 'Quad.easeIn', // 'Sine.easeIn'

        onComplete: () => {
          // this.trail.start();
          // console.log('ball fall faze 2', this.scene.elapsedSec.toFixed(2))
          this.state = 'falling'

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

              // const timeNow = new Date().getTime();
              // console.log('ball hit', this.scene.elapsedSec)
            },
          })
        },
      })

  }
  onBounce(data) {
    this.state = 'bouncing'
    // console.log('ball onBounce', data)
    // stop falling
    // this.trail.stop();
    this.stopTween()
    // this.ball.y = this.y + this.distanceY

    // var 2
    let delay = 0
    let duration = this.duration
    let ease = 'Quad.easeOut'
    if (data.isBonza) {
      // delay = 50
      duration = 200 // надо передавать из сцены
      ease = this.easeBackIn
    }

    this.ballTween =
      this.scene.tweens.add({
        targets: this.ball,
        y: this.y,
        delay: delay,
        duration: duration, // this.duration
        ease: ease, // Quart
        onComplete: () => {
          if (data.isBonza) {
            // немного подлетим
            this.stopTween()
            this.ballTween =
              this.scene.tweens.add({
                targets: this.ball,
                y: this.y - 100,
                // delay: delay,
                duration: 500, // this.duration
                yoyo: true,
                ease: this.easeNewOut, // Quad Quart
                onComplete: () => {
                  // this.ball.y = this.y
                },
              })
          }
        },
      })
  }

  stopTween() {
    if (this.ballTween) this.ballTween.stop()
  }
  setBounceTween(tween) {
    this.ballTween = tween
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

  drawSquare() {
    const w = this.diameter;
    const h = this.diameter;
    const r = 10

    this.ball.clear();
    this.ball.fillStyle(this.color, 1);

    // если ваша позиция - центр:
    const x = this.x - w / 2;
    const y = 0 - h;

    this.ball.fillRoundedRect(x, y, w, h, r);

    // console.log('drawSquare', this.x, this.y, x, y)
  }
  drawCircle() {
    const w = this.diameter;
    const h = this.diameter;
    const r = this.diameter / 2

    this.ball.clear();
    this.ball.fillStyle(this.color, 1);

    // если ваша позиция - центр:
    const x = this.x - w / 2;
    const y = 0 - h;

    this.ball.fillRoundedRect(x, y, w, h, r);

    // console.log('drawCircle', this.x, this.y, x, y)
  }
}



// var 1 onBounce
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
//       // console.log('onBounce',)
//     },
//   })
