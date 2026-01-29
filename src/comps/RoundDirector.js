// comps/RoundDirector.js
// dev

export class RoundDirector {
    constructor(scene) {
        this.scene = scene

        // фазы раунда (не путать с BONZA mode)
        this.state = 'IDLE' // IDLE | COUNTDOWN | START | CRASH | CASHOUT | FINISH
        this.finishReason = null // 'CRASH' | 'CASHOUT' | null

        // чтобы не плодить параллельные таймеры
        this.timers = new Set()
    }

    // ------------------------
    // public API (Scene вызывает это)
    // ------------------------

    startCountdown() {
        this._goto('COUNTDOWN')
    }

    placeBet() {
        // просто проксируем текущую сценовую механику
        this.scene.handleBet()
    }

    cashout(method = 'manual') {
        // делаем кэш-аут и уводим в CASHOUT-фазу
        this.scene.handleCashout(method)
        if (this.state === 'START') this._goto('CASHOUT')
    }

    // ------------------------
    // internal state machine
    // ------------------------

    _goto(next) {
        if (this.state === next) return
        const prev = this.state
        this.state = next
        // можно включить лог для дебага:
        // console.log('[RoundDirector]', prev, '->', next)

        switch (next) {
            case 'COUNTDOWN':
                this._onCountdown()
                break
            case 'START':
                this._onStart()
                break
            case 'CRASH':
                this.finishReason = 'CRASH'
                this._onCrash()
                break
            case 'CASHOUT':
                this.finishReason = 'CASHOUT'
                this._onCashout()
                break
            case 'FINISH':
                this._onFinish()
                break
            default:
                break
        }
    }

    // ------------------------
    // phase handlers (перенесено из GameScene)
    // ------------------------

    _onCountdown() {
        const s = this.scene

        s.events.emit('gameEvent', {
            mode: 'COUNTDOWN',
            betValue: s.currentBetValue,
        })

        s.setBetAllowed(true)
        s.hasCashOut = false
        s.hasBet = false
        s.stakeValue = 0

        if (s.pendingRiskSetting) s.handleRiskSettings(s.pendingRiskSetting)

        s.quickMode = s.currentAutoSetting.rounds > 0

        let countDown = s.quickMode ? 1 : 4
        const roundStartDelay = s.duration * (countDown * 2 + 0.5)

        // тикер
        this._addTimer(
            s.time.addEvent({
                delay: 1000,
                callback: () => {
                    countDown--
                    let text = countDown.toFixed(0).toString()

                    if (countDown === 0) {
                        text = 'GO!'
                        this._addTimer(
                            s.time.addEvent({
                                delay: 300,
                                callback: () => {
                                    s.events.emit('gameEvent', {
                                        mode: 'COUNTDOWN_UPDATE',
                                        text: s.payTable[0].multiplier.toFixed(2),
                                        show: 1,
                                    })
                                },
                            })
                        )
                    }

                    s.events.emit('gameEvent', {
                        mode: 'COUNTDOWN_UPDATE',
                        text,
                        show: true,
                    })
                },
                repeat: countDown - 1,
            })
        )

        // prepare -> start
        this._addTimer(
            s.time.addEvent({
                callback: () => this._roundPrepare(roundStartDelay),
            })
        )
    }

    _roundPrepare(roundStartDelay) {
        const s = this.scene

        s.events.emit('gameEvent', { mode: 'ROUND_PREPARE' })

        this._addTimer(
            s.time.addEvent({
                delay: roundStartDelay,
                callback: () => {
                    s.initCrashIndex()

                    s.isCrashed = false
                    s.bounceCount = 0
                    s.roundCounter++

                    s.elapsedSec = 0
                    s.timeCounter.setText(s.elapsedSec.toFixed(2))

                    // автоигра
                    if (s.currentAutoSetting.rounds > 0 && !s.hasBet) {
                        s.currentAutoSetting.rounds--
                        s.handleAutoSetting(s.currentAutoSetting)
                        s.handleBet()
                    }

                    this._goto('START')
                },
            })
        )
    }

    _onStart() {
        const s = this.scene
        s.paused = false

        s.events.emit('gameEvent', {
            mode: 'START',
            hasBet: s.hasBet,
        })

        this._fallStarter()
    }

    _fallStarter() {
        const s = this.scene

        let mode = 'usu'
        let duration = s.duration
        let amount = 1

        const fallTime = 100
        const drillTime = 200

        if (s.bonzaCount > 0) {
            mode = 'bonza'
            amount = s.rnd.between(1, 5)
            if (amount > s.crashIndex) amount = s.crashIndex

            duration = fallTime + amount * drillTime + 400

            this._addTimer(
                s.time.delayedCall(fallTime, () => {
                    this._onHit(amount)
                    for (let i = 1; i < amount; i++) {
                        this._addTimer(
                            s.time.delayedCall(drillTime * i + drillTime, () => {
                                if (s.isCrashed) return
                                this._onHit(amount)
                            })
                        )
                    }
                })
            )

            this._addTimer(
                s.time.delayedCall(duration, () => {
                    if (s.isCrashed) return
                    this._onBounce(amount)
                })
            )
        } else {
            this._addTimer(
                s.time.delayedCall(duration, () => {
                    this._onHit(1)
                    if (s.isCrashed) return
                    this._addTimer(s.time.delayedCall(0, () => this._onBounce(1)))
                })
            )
        }

        s.events.emit('gameEvent', {
            mode: 'FALL',
            bonzaCount: s.bonzaCount,
            isBonza: s.isBonza,
            load: { mode, amount, duration, fallTime, drillTime, speed: s.gameSpeed },
        })
    }

    _onHit(amount) {
        const s = this.scene

        // твоя проверка краша
        s.checkCrash()
        if (s.isCrashed) {
            this._goto('CRASH')
            return
        }

        const multiplier = s.payTable[s.bounceCount].multiplier
        const nextMultiplier = s.payTable[s.bounceCount + amount]
            ? s.payTable[s.bounceCount + amount].multiplier
            : undefined

        s.stakeValue = s.currentBetValue * multiplier

        s.events.emit('gameEvent', {
            mode: 'HIT',
            count: s.bounceCount,
            multiplier,
            nextMultiplier,
            stakeValue: s.stakeValue,
            hasBet: s.hasBet,
            amount,
            isBonza: s.isBonza,
        })

        if (s.bounceCount === 0 && !s.cashOutAllowed) s.setCashOutAllowed(true)
        if (s.currentAutoSetting.cashout > 0) s.checkAutoCashout(multiplier)

        s.bounceCount += amount
    }

    _onBounce(amount) {
        const s = this.scene
        if (s.paused) return
        if (s.bonzaCount === 0) s.isBonza = false

        s.events.emit('gameEvent', {
            mode: 'BOUNCE',
            count: s.bounceCount,
            amount,
            isBonza: s.isBonza,
        })

        let delayBeforeFall = s.duration
        if (s.bonzaCount > 0) delayBeforeFall = 1000

        this._addTimer(s.time.delayedCall(delayBeforeFall, () => this._fallStarter()))
    }

    _onCrash() {
        // короткая “драма” под краш, потом finish
        const s = this.scene
        s.setCashOutAllowed(false)
        this._addTimer(s.time.delayedCall(0, () => this._goto('FINISH')))
    }

    _onCashout() {
        // кэш-аут: обычно быстрее, чем краш
        const s = this.scene
        s.setCashOutAllowed(false)
        this._addTimer(s.time.delayedCall(0, () => this._goto('FINISH')))
    }

    _onFinish() {
        const s = this.scene

        s.paused = true
        s.setCashOutAllowed(false)

        if (s.bonzaCount > 0) s.bonzaCount--
        if (s.pendingBonzaAmount) s.handleBonza()

        // важное: оставляем формат FINISH, чтобы Ball/Platforms не ломать
        s.events.emit('gameEvent', {
            mode: 'FINISH',
            reason: this.finishReason, // <- НОВОЕ
            isCrashed: this.finishReason === 'CRASH',
            hasBet: s.hasBet,
            hasCashOut: s.hasCashOut,
            stakeValue: s.stakeValue,
            count: s.bounceCount,
        })

        this._addTimer(
            s.time.addEvent({
                delay: 1000,
                callback: () => {
                    this.finishReason = null
                    this._goto('COUNTDOWN')
                },
            })
        )

        // статистика (как у тебя)
        s.roundTime.push(s.elapsedSec)
        const avgTime = s.roundTime.reduce((a, v) => a + v, 0) / s.roundTime.length
        console.log('Rounds:', s.roundTime.length, 'Average Round Time:', avgTime.toFixed(2), 'seconds')
    }

    // ------------------------
    // timer hygiene
    // ------------------------

    _addTimer(t) {
        if (!t) return t
        this.timers.add(t)
        // Phaser.TimerEvent имеет remove(), delayedCall тоже TimerEvent
        // чистить пока не будем агрессивно; можно добавить reset() позже
        return t
    }
}
