

export class Platforms {
    constructor(scene) {
        this.scene = scene

        this.init()
        this.create()

    }
    init() {
        this.startAmount = 5
        this.centerX = this.scene.sceneCenterX
        this.duration = this.scene.duration
        this.depth = 10
        this.hitPointY = this.scene.hitPointY
        // изменить калькуляцию!!!
        this.groupTotalHeight = 180
        this.blockWidth = 180

        this.easeBackInOut = (v) => Phaser.Math.Easing.Back.InOut(v, 1) // 0.7

        this.payTable = []
        this.lastKnownStep = 0 // индекс шага для рендера чисел (count из событий)
        this.chessPhase = 0

        this.blocks = []
        this.currentPattern = null
        this.currentPatternId = null

        // Паттерны
        this.blockMap = [
            { pattern: [1] }, // одиночный не используем как активный сет
            { pattern: [1, 1] },
            { pattern: [1, 1, 1] },
            { pattern: [1, 1, 1, 1] },
            { pattern: [1, 1, 1, 1, 1] },
            { pattern: [1, 1, 1, 1, 1, 1] },
            // { pattern: [1, 1, 1, 1, 1, 1, 1, 1] },
        ]
        this.compiledMap = this.compileBlockMap(this.blockMap)

        this.initBonusSceme()
        // dev
        this.tokenProbabilities = 0.2
    }
    initBonusSceme() {
        this.bonzaProbabilities = this.scene.bonzaProbabilities // 0.25 норм
        return
        // dev
        const HE = this.scene.houseEdge
        const r = 1 - HE / 100

        const zones = {
            lt2: 1 - r / 2,
            z2_10: r / 2 - r / 10,
            z10_100: r / 10 - r / 100,
            gte100: r / 100
        }

        const ev = (p) => {
            // const p = this.bonzaProbabilities
            // return (50 * Math.pow(p, 6) + 40 * Math.pow(p, 4) + 9 * Math.pow(p, 3) + 1 * Math.pow(p, 2)) / 100
            return (
                zones.lt2 * p ** 6 +
                zones.z2_10 * p ** 4 +
                zones.z10_100 * p ** 3 +
                zones.gte100 * p ** 2
            )
        }
        // console.log('Platforms bonzaProbabilities expected visible blocks:',
        // ev(this.bonzaProbabilities).toFixed(4), (1 / ev(this.bonzaProbabilities)).toFixed(0))
    }
    create() {
        // this.createAssets()
        this.createEvents()
        this.createBlocks()
        this.createLastBlock()
    }
    createBlocks() {
        // Один сет (одна группа) в точке касания
        this.root = this.scene.add
            .container(this.centerX, this.hitPointY)
            .setDepth(this.depth)

        this.setContainer = this.scene.add.container(0, 0)
        this.root.add(this.setContainer)
    }
    createLastBlock() {
        const height = 60

        this.lastBlock = this.scene.add
            .container(this.centerX, this.hitPointY + this.groupTotalHeight)
            .setDepth(this.depth)

        const block = this.createBlockRect(this.blockWidth, height, this.scene.standartColors.dark_gray)

        const text = this.scene.add
            .text(0, height / 2, '', {
                fontSize: '20px',
                // color: index === 0 ? scene.textColors.red : scene.textColors.black,
                color: this.scene.textColors.black,
                // fontFamily: 'AvenirBlack',
                fontFamily: 'JapanRobot',
                fontSize: '24px',
                fill: this.scene.textColors.white,
            })
            .setOrigin(0.5, 0.5)

        const frame = this.createBlockFrame(this.blockWidth, height)

        this.lastBlock.add([block, text, frame])
        this.lastBlock.__text = text

        this.lastBlock.update = () => {
            const lastMulty = this.payTable[this.payTable.length - 1].multiplier

            this.payTable
            this.lastBlock.__text.setText(lastMulty.toFixed(2))
        }

    }
    createAssets() {
        this.scene.createGradientTexture('fadeWhiteRect', '255,255,255', 120, 160)
        this.scene.createGradientTexture('fadeRedRect', '255,0,0', 120, 160)
    }

    createEvents() {
        this.scene.events.on('gameEvent', (data) => this.handleEvent(data))
    }

    handleEvent(data) {
        if (data.mode === 'RISK_SETTING_CHANGED') {
            this.payTable = data.payTable || []
            // this.lastKnownStep = 0

            // if (!this.currentPattern) this.startSet()
            // this.renderMultipliers(0)
            return
        }

        if (data.mode === 'ROUND_PREPARE') {
            this.resetVisuals()
            this.lastKnownStep = 0
            this.startSet()
            this.renderMultipliers(0)
            return
        }

        if (data.mode === 'HIT') {
            // console.log('Platforms HIT data:', data)
            // data.count = текущий шаг, который был выбит
            this.lastKnownStep = data.count
            this.lastKnownMulty = data.multiplier
            this.nextMulty = data.nextMultiplier
            this.chessPhase ^= 1
            // this.onHit(data)
            // dev
            // this.scene.countdownCounter.set(data.count + 1)
            // this.scene.countdownCounter.show(1)
            return
        }
        if (data.mode === 'BOUNCE') {
            // console.log('Platforms HIT data:', data)
            // data.count = текущий шаг, который был выбит
            // this.lastKnownStep = data.count
            // this.lastKnownMulty = data.multiplier
            // this.nextMulty = data.nextMultiplier
            // this.chessPhase ^= 1
            this.onBounce(data)
            // dev
            // this.scene.countdownCounter.set(data.count + 1)
            // this.scene.countdownCounter.show(1)
            return
        }
        if (data.mode === 'CASHOUT') {
            // нужно красить красным блок на котором краш
            // а если он далеко - показывать номер справа
            // или выводить эти блоки... ?
            this.showCrashBlock(data)
            return
        }

        if (data.mode === 'FINISH') {
            this.setRedTop(0)

            return
        }
    }

    // -----------------------
    // Pattern compilation / heights
    // -----------------------

    compileBlockMap(blockMap) {
        const list = blockMap.map((raw) => {
            const id = raw.name || raw.pattern.join('_')
            return {
                id,
                pattern: raw.pattern,
                blocks: raw.pattern.length,
                heightsPx: this.computeHeightsPx(this.groupTotalHeight, raw.pattern),
                weight: raw.weight ?? 1,
                transitions: raw.transitions ?? null,
            }
        })
        const byId = new Map(list.map((p) => [p.id, p]))
        return { list, byId }
    }

    computeHeightsPx(totalHeight, pattern) {
        const sum = pattern.reduce((a, b) => a + b, 0)
        const ideal = pattern.map((k) => (k * totalHeight) / sum)
        const floored = ideal.map((x) => Math.floor(x))
        let used = floored.reduce((a, b) => a + b, 0)
        let rest = totalHeight - used

        if (rest > 0) {
            const fracIdx = ideal
                .map((x, i) => ({ i, frac: x - Math.floor(x) }))
                .sort((a, b) => b.frac - a.frac)
            let p = 0
            while (rest > 0) {
                floored[fracIdx[p % fracIdx.length].i] += 1
                rest -= 1
                p += 1
            }
        }
        return floored
    }

    // -----------------------
    // Set lifecycle
    // -----------------------

    startSet() {
        // стартовый паттерн: любой, но не одиночный
        const startCandidates = this.compiledMap.list.filter((p) => p.blocks === this.startAmount)
        const start = this.weightedPick(startCandidates)
        this.applyPattern(start, { immediate: true })
        this.lastBlock.update()
    }
    removeBlock() {
        if (!this.blocks.length) return
        const top = this.blocks[0]
        top.destroy()
        this.blocks.shift()
        // console.log('Platforms removeBlock, remaining:', this.blocks.length)
    }
    onBounce(data) {
        // if (!this.blocks.length) return
        // console.log(data.count, 'onBounce:', data)
        if (!data.isBonza) {

            const top = this.blocks[0]
            // const singleBlockHeight = this.groupTotalHeight / this.currentPattern.length
            const removedH = top.__height

            // 1) выбиваем верхний
            this.scene.tweens.add({
                targets: top.list[0],
                // y: top.y + 10,
                alpha: 0,
                delay: 0,
                duration: 50,
                onComplete: () => {
                    // top.destroy()
                    this.removeBlock()

                    // this.setNextMulty(data.count + 1)
                    // 4) выбираем новый паттерн (transitions позже)
                    // const next = this.pickNextPattern(this.currentPatternId)
                    // // const next = this.currentPattern // dev
                    // // console.log(this.currentPatternId, 'Next pattern:', next)
                    // // 5) восстанавливаем сет и перерисовываем числа, начиная со следующего шага
                    // this.applyPattern(next, { immediate: true })
                    // this.renderMultipliers(hitStep + 1)
                }
            })

            // 2) удаляем из массива
            // for (let index = 0; index < data.amount; index++) {
            //     this.blocks.shift()
            // }

            // this.blocks.shift()



            let patternSwitched = false

            // 3) подтягиваем оставшиеся вверх (визуально)
            this.scene.tweens.add({
                targets: this.setContainer,
                y: this.setContainer.y - removedH,
                delay: 50,
                duration: 200, //  Math.max(60, Math.floor(this.duration * 0.25))
                // ease: 'Back.easeInOut', // Cubic Back.easeInOut
                ease: this.easeBackInOut,
                onUpdate: (tween) => {
                    // 0.45–0.6 — зона максимальной скорости / минимального внимания
                    // if (!patternSwitched && tween.progress > 0.95) {
                    //     patternSwitched = true
                    //     const next = this.pickNextPattern()
                    //     this.applyPattern(next, { immediate: true })
                    //     this.renderMultipliers(hitStep + 1)
                    // }
                },
                onComplete: () => {
                    this.setContainer.y = 0

                    // не обязательно каждый раз выбирать из карты и менять паттерн!
                    const next = this.pickNextPattern(this.currentPatternId) // this.currentPatternId

                    // 5) восстанавливаем сет и перерисовываем числа, начиная со следующего шага
                    this.applyPattern(next, { immediate: true })
                    this.renderMultipliers(data.count)
                    this.showBonusBlocks(this.blocks)

                },
            })
        } else {
            // console.log('Platforms BONZA HIT data:', this.setContainer.y)
            // console.log(data.count, 'onBounce BONZA:', data)
            // bonza mode - просто обновляем числа сверху вниз
            const singleBlockHeight = this.groupTotalHeight / this.currentPattern.length
            const removedH = singleBlockHeight * data.amount

            this.scene.tweens.add({
                targets: this.setContainer,
                y: this.setContainer.y - removedH,
                delay: 0,
                duration: 200, //  Math.max(60, Math.floor(this.duration * 0.25))
                // ease: 'Back.easeInOut', // Cubic Back.easeInOut
                ease: this.easeBackInOut,
                onUpdate: (tween) => {
                },
                onComplete: () => {
                    this.setContainer.y = 0
                    this.rerenderBlocks(data)
                },
            })
        }
    }
    rerenderBlocks(data) {
        // не обязательно каждый раз выбирать из карты и менять паттерн!
        // if (data.isBonza) {
        //     this.renderMultipliers(data.count + data.amount)
        //     this.showBonusBlocks(this.blocks)
        //     return
        // }
        const next = this.pickNextPattern(this.currentPatternId) // this.currentPatternId
        // console.log('Platforms rerenderBlocks next pattern:', next)
        // 5) восстанавливаем сет и перерисовываем числа, начиная со следующего шага
        this.applyPattern(next, { immediate: true })
        this.renderMultipliers(data.count) // data.count + data.amount
        this.showBonusBlocks(this.blocks)
    }
    applyPattern(patternObj, { immediate = true } = {}) {
        this.currentPattern = patternObj.pattern
        this.currentPatternId = patternObj.id

        // console.log('applyPattern', this.currentPattern)

        this.setContainer.removeAll(true)
        this.blocks = []

        // this.buildAvatarFrames(patternObj)

        // let bonus = 0
        let y = 0
        for (let i = 0; i < patternObj.blocks; i++) {
            const h = patternObj.heightsPx[i]
            const block = this.createBlock(h, i, patternObj.blocks)
            block.y = y
            y += h
            this.setContainer.add(block)
            this.blocks.push(block)
            //dev
            // это нужно проверять из сцены, и вообще должно приходить от сервера
            // но для простоты пусть будет тут
            // все блоки с паттерном — бонус!
            // if (block.__bonus) {
            //     bonus += 1
            // }
        }
        // if (bonus === patternObj.blocks) {
        //     // это нужно проверять из сцены, и вообще должно приходить от сервера
        //     // но для простоты пусть будет тут
        //     // все блоки с паттерном — бонус!
        //     const hasCashOut = this.scene.hasCashout
        //     if (!hasCashOut) {
        //         // this.scene.sounds.jingle.play()
        //         console.log('BONUS achieved! All patterns visible!')
        //     } else {
        //         console.log('BONUS skipped due to cashout')
        //     }
        // }
        // if (bonus > 0) this.scene.sounds.puck.play({})

        if (immediate) {
            this.root.x = this.centerX
            this.root.y = this.hitPointY
            this.setContainer.y = 0
        }
    }
    renderMultipliers(startStep) {
        // console.log('renderMultipliers from step', startStep)
        // startStep = какой индекс payTable показываем на верхнем блоке
        const table = this.payTable
        if (!Array.isArray(table) || table.length === 0) return

        for (let i = 0; i < this.blocks.length; i++) {
            const step = startStep + i
            const b = this.blocks[i]

            const row = table[step]
            if (!row || typeof row.multiplier !== 'number') {
                b.__text.setText('')
                continue
            }

            const m = row.multiplier
            // формат как у тебя в других местах
            let text = m >= 1000 ? m.toFixed(0) : m >= 100 ? m.toFixed(1) : m.toFixed(2)
            // text = 'X_' + text
            // if (m === 1) text = '...' // особый случай для единицы
            b.__text.setText(text)
        }
    }
    pickNextPattern(prevId) {
        const amount = this.multiplierToAmount()
        let candidates = this.compiledMap.list.filter((p) => p.blocks === amount)

        // console.log(this.lastKnownMulty, this.lastKnownStep, 'pickNextPattern amount:', amount, this.payTable.length)
        // console.log('pickNextPattern candidates for amount', amount, ':', candidates)
        return candidates[0] // dev

        if (prevId) {
            const prev = this.compiledMap.byId.get(prevId)
            if (prev?.transitions?.length) {
                const allowed = new Set(prev.transitions)
                const filtered = candidates.filter((p) => allowed.has(p.id))
                if (filtered.length) candidates = filtered
            }
        }

        if (prevId && candidates.length > 1) {
            const filtered = candidates.filter((p) => p.id !== prevId)
            if (filtered.length) candidates = filtered
        }

        return this.weightedPick(candidates)
    }
    multiplierToAmount = () => {
        const stepLeft = this.payTable.length - 1 - this.lastKnownStep
        // console.log('stepLeft', stepLeft)
        if (stepLeft <= 0) return 1

        let amount = 5

        if (this.lastKnownMulty >= 2) amount = 4
        if (this.lastKnownMulty >= 10) amount = 3
        if (this.lastKnownMulty >= 100) amount = 2

        // ближайшее меньшее (или равное) из 6-4-3-2-1
        const STEPS = [5, 4, 3, 2, 1]
        amount = STEPS.find(v => v <= Math.min(amount, stepLeft)) ?? 1

        // dev
        if (stepLeft >= 5 && this.scene.isBonza) amount = 5

        return amount
    }
    __pickNextPattern(prevId) {
        let candidates = this.compiledMap.list.filter((p) => p.blocks >= 2)
        // return candidates[0] // dev

        if (prevId) {
            const prev = this.compiledMap.byId.get(prevId)
            if (prev?.transitions?.length) {
                const allowed = new Set(prev.transitions)
                const filtered = candidates.filter((p) => allowed.has(p.id))
                if (filtered.length) candidates = filtered
            }
        }

        if (prevId && candidates.length > 1) {
            const filtered = candidates.filter((p) => p.id !== prevId)
            if (filtered.length) candidates = filtered
        }

        return this.weightedPick(candidates)
    }

    weightedPick(candidates) {
        // console.log('weightedPick candidates:', candidates)
        const total = candidates.reduce((a, p) => a + (p.weight || 1), 0) || 1
        let r = Math.random() * total
        for (const p of candidates) {
            r -= p.weight || 1
            if (r <= 0) return p
        }
        return candidates[candidates.length - 1]
    }

    // -----------------------
    // Blocks visuals
    // -----------------------
    createBlockRect(width, height, color) {
        const g = this.scene.add.graphics();

        // const isWhite = ((index + this.chessPhase) % 2 === 0);
        // const fillColor = isWhite
        //     ? this.scene.standartColors.white
        //     : this.scene.standartColors.gray;

        g.__width = width;
        g.__height = height;
        g.__x = -width / 2;
        g.__y = 0;
        g.__color = color;

        g.fillStyle(g.__color, 1);
        g.fillRect(g.__x, g.__y, g.__width, g.__height);

        return g;
    }

    createBlockFrame(width, height, color) {
        const g = this.scene.add.graphics()
        // console.log('frame color', width, height, color)
        // console.log('frame color', this.scene.standartColors.black)
        // параметры стиля
        const strokeWidth = 4
        const strokeColor = this.scene.standartColors.black // color ? color : 
        const alpha = 1

        g.__x = -width / 2 + strokeWidth / 2;
        g.__y = 0 + strokeWidth / 2;
        g.__width = width - strokeWidth;
        g.__height = height - strokeWidth;
        g.__color = strokeColor;
        g.__strokeWidth = strokeWidth;

        g.lineStyle(g.__strokeWidth, strokeColor, alpha)
        g.strokeRect(g.__x, g.__y, g.__width, g.__height);
        return g
    }

    createBlock(heightPx, index, blocksCount) {
        const scene = this.scene
        const block = scene.add.container(0, 0)
        // нужен прямоугольник
        // паттерн
        // рамка - без фона
        // текст

        const strokeWidth = 4

        const back = this.createBlockRect(this.blockWidth, heightPx, this.scene.standartColors.dark_gray)

        const isWhite = ((index + this.chessPhase) % 2 === 0);
        const fillColor = isWhite
            ? this.scene.standartColors.white
            : this.scene.standartColors.gray;

        const rect = this.createBlockRect(this.blockWidth, heightPx, fillColor)

        const text = scene.add
            .text(0, heightPx * 0.5, '', {
                fontSize: '20px',
                // color: index === 0 ? scene.textColors.red : scene.textColors.black,
                color: scene.textColors.black,
                fontFamily: 'AvenirBlack',

                // fontFamily: 'JapanRobot',
                // fontSize: '24px',
                // fill: scene.textColors.black,
            })
            .setOrigin(0.5, 0.5)

        const patternRandom = Phaser.Math.FloatBetween(0, 1)
        let isBonus = patternRandom < this.bonzaProbabilities
        const patternIndent = 0
        let pattern = null

        // isBonus = true // dev
        if (blocksCount === 1) isBonus = false

        const stampScale = heightPx / 80 // размер печати
        const stampIndent = isWhite ? -140 : 140

        if (isBonus) {
            block.__bonus = true

            pattern = scene.add.image(-50, heightPx / 2, 'stamp')
                .setOrigin(0.5)
                // .setDisplaySize(this.blockWidth - 100, heightPx)
                .setAlpha(0)
                .setScale(stampScale)

            // pattern = scene.add.image(0, 0, 'avatar', `slice_${blocksCount}_${index}`)
            //     .setOrigin(0.5, 0)
            //     .setDisplaySize(this.blockWidth, heightPx)
            //     .setAlpha(0)

        } else {
            // если не бонусная картинка, то паттерн из стандартных
            block.__bonus = false
            pattern = scene.add.rectangle(
                0,
                heightPx / 2,
                this.blockWidth - patternIndent * 2,
                heightPx - patternIndent * 2,
                0x000000,
            ).setOrigin(0.5).setAlpha(0)
        }
        // ещё + и - для монет!
        // Phaser.Math.Between(0, 100)

        let sign = Phaser.Math.Between(0, 1) ? '+' : '-'
        const tokenRandom = Phaser.Math.FloatBetween(0, 1)
        let isToken = tokenRandom < this.tokenProbabilities
        isToken = false // dev

        const token = scene.add
            .text(70, heightPx * 0.5, sign, {
                // color: index === 0 ? scene.textColors.red : scene.textColors.black,
                color: scene.textColors.red,
                fontFamily: 'JapanRobot',
                fontSize: '40px',
                // fontFamily: 'JapanRobot',
                // fontSize: '24px',
                // fill: scene.textColors.black,
            })
            .setOrigin(0.5, 0.5)
            .setAlpha(isToken)

        const frame = this.createBlockFrame(this.blockWidth, heightPx, this.scene.standartColors.dark_gray)

        block.add([back, rect, frame, pattern, text, token])
        // block.setMask(mask);
        // block.__bonus = true // dev
        block.__rect = rect
        block.__frame = frame
        block.__text = text
        // block.__maskRect = maskRect
        block.__pattern = pattern
        block.__height = heightPx
        block.alpha = 1
        return block
    }
    buildAvatarFrames(map) {
        const tex = this.scene.textures.get('avatar')

        map.forEach((row, index) => {
            let y = 0
            const amount = row.pattern.length
            const height = Math.floor(this.groupTotalHeight / amount)
            // console.log('amount', amount, 'height', height)
            for (let i = 0; i < amount; i++) {
                const key = `slice_${amount}_${i}`

                if (!tex.has(key)) {
                    tex.add(key, 0, 0, y, 180, height)
                }

                // tex.add(
                //     `slice_${amount}_${i}`,
                //     0,
                //     0,
                //     y,
                //     180,
                //     height
                // )
                y += height
            }
        })

    }
    __showBonusBlocks() {
        let count = 0
        const delay = 80 // 70 60
        const half = 120   // 100 100
        const treshold = 1.5

        this.blocks.forEach((block) => {
            if (!block.__bonus) return
            // count++

            const front = block.__rect
            const back = block.__pattern
            const height = block.__height

            // старт
            // front.alpha = 1
            // front.scaleY = 1
            // front.y -= height / 2

            back.alpha = 1
            back.scaleY = 0
            // back.y = back.y - height / 2

            const d = count * delay

            // count++

            // 1) схлопнуть фронт по Y (как бы "повернуть" вокруг X)
            // this.scene.tweens.add({
            //     targets: front,
            //     scaleY: 0,
            //     y: front.y + height,
            //     delay: d,
            //     duration: half,
            //     ease: 'Cubic.easeIn',
            //     onComplete: () => {
            //         // в нуле меняем сторону
            //         front.alpha = 0
            //         back.alpha = 1
            //         back.scaleY = 0

            //         const detune = 1800 + Phaser.Math.Between(0, 400) // was
            //         // const detune = 1800 + count * 50 // data.count * 10
            //         this.scene.sounds.domino.play({ detune: detune })

            //         // 2) развернуть бэк по Y
            //         this.scene.tweens.add({
            //             targets: back,
            //             delay: 0,
            //             scaleY: 1,
            //             y: back.y + height / 2,
            //             duration: half,
            //             ease: 'Cubic.easeOut',
            //         })
            //     }
            // })

            // var 2
            if (this.scene.timeScale <= treshold) {
                this.scene.tweens.add({
                    targets: front,
                    scaleY: 0,
                    // alpha: 1,
                    y: front.y + height,
                    delay: d,
                    duration: half,
                    ease: 'Cubic.easeIn', // easeIn easeOut
                    onComplete: () => {

                        // const detune = 1800 + Phaser.Math.Between(0, 400) // was
                        // // const detune = 1800 + count * 50 // data.count * 10
                        // this.scene.sounds.domino.play({ detune: detune })
                    },
                })

                this.scene.tweens.add({
                    targets: back,
                    scaleY: 1,
                    // alpha: 1,
                    // y: back.y + height / 2,
                    delay: d + 5,
                    duration: half,
                    ease: 'Cubic.easeIn', // easeIn easeOut
                    onComplete: () => {

                        const detune = 1800 + Phaser.Math.Between(0, 400) // was
                        // const detune = 1800 + count * 50 // data.count * 10
                        // this.scene.sounds.domino.play({ detune: detune })
                    },
                })
            }

            // var 3
            if (this.scene.timeScale > treshold) {

                this.scene.tweens.add({
                    targets: front,
                    scaleY: 0,
                    // alpha: 1,
                    y: front.y + height,
                    delay: delay,
                    duration: half,
                    ease: 'Cubic.easeIn', // easeIn easeOut
                    onComplete: () => { },
                })

                this.scene.tweens.add({
                    targets: back,
                    scaleY: 1,
                    // alpha: 1,
                    // y: back.y + height / 2,
                    delay: delay + 10,
                    duration: half,
                    ease: 'Cubic.easeIn', // easeIn easeOut
                    onComplete: () => {
                        // if (!isSounded) {
                        //     console.log('sound')
                        //     isSounded = true
                        //     const detune = 1800 + Phaser.Math.Between(0, 400) // was
                        //     this.scene.sounds.domino.play({ detune: detune })
                        // }

                    },
                })
            }
            count++
        })
        if (this.scene.timeScale > treshold && count > 0) {
            // one sound
            setTimeout(() => {
                const detune = 1800 + Phaser.Math.Between(0, 400) // was
                // this.scene.sounds.domino.play({ detune: detune })
            }, delay)
        }
        const left = this.blocks.length - count
        if (left <= 2) {
            // console.log('left', left)
        }

        if (left === 0) {
            console.log('bonus')
        }
    }
    showBonusBlocks() {
        let count = 0
        const delay = 80 // 70 60
        const half = 120   // 100 100
        const treshold = 1.5

        this.blocks.forEach((block) => {
            if (!block.__bonus) return
            const d = count * delay
            const stamp = block.__pattern
            const scale = stamp.scale

            // var2
            this.scene.tweens.add({
                targets: stamp,
                alpha: 1,
                // y: front.y + height,
                // scaleY: scaleY,
                scale: scale * 1.2,
                delay: d,
                duration: 20,
                ease: 'Cubic.easeIn', // easeIn easeOut
                onComplete: () => {
                    stamp.scale = scale
                },
            })

            // var1
            // stamp.scaleY = 0
            // stamp.alpha = 1

            // this.scene.tweens.add({
            //     targets: stamp,
            //     // alpha: 1,
            //     // y: front.y + height,
            //     scaleY: scaleY,
            //     delay: d,
            //     duration: half,
            //     ease: 'Cubic.easeIn', // easeIn easeOut
            //     onComplete: () => { },
            // })


            count++
        })
        if (this.scene.timeScale > treshold && count > 0) {
            // one sound
            setTimeout(() => {
                const detune = 1800 + Phaser.Math.Between(0, 400) // was
                // this.scene.sounds.domino.play({ detune: detune })
            }, delay)
        }
        const left = this.blocks.length - count
        if (left <= 2) {
            // console.log('left', left)
        }

        if (left === 0) {
            console.log('bonus', count)
            // пробно выводим информацию на экран
            // если мы не вышли?
            // this.scene.bonzaMode.set(count)

            // УБРАТЬ ОТСЮДА!!! 
            this.scene.events.emit('gameEvent', {
                mode: 'BONZA',
                amount: 3,
            })
            // this.scene.bonzaCount += count
        }
    }

    showCrashBlock(data) {
        const crashStep = this.scene.crashIndex // перенести в реестр и гет

        console.log('showCrashBlock crashStep:', crashStep, 'this.lastKnownStep:', this.lastKnownStep)
    }
    setRedTop(number) {
        const top = this.blocks[number || 0];
        if (!top) return
        this.recolorBlockRect(top.__rect, this.scene.standartColors.red);
        // this.recolorBlockFrame(top.__frame, this.scene.standartColors.red);
        top.__pattern.alpha = 0
    }
    setDarkBlock(number) {
        // console.log('setDarkBlock', number)
        const top = this.blocks[number || 0];
        if (!top) return
        this.recolorBlockRect(top.__rect, this.scene.standartColors.dark_red);
        // this.recolorBlockFrame(top.__frame, this.scene.standartColors.red);
        // top.__pattern.alpha = 0
    }

    recolorBlockRect(g, newColor) {
        g.clear();
        g.fillStyle(newColor, 1);
        g.fillRect(g.__x, g.__y, g.__width, g.__height);
        g.__color = newColor;
    }
    recolorBlockFrame(g, newColor) {
        g.clear();
        // g.lineStyle(g.__strokeWidth, newColor, 1)
        // g.strokeRect(g.__x, g.__y, g.__width, g.__height);
        // g.__color = newColor;
    }
    resetVisuals() {
        for (const b of this.blocks) {
            b.alpha = 1
            b.__rect.fillColor = 0xffffff
            // b.__tail.setTexture('fadeWhiteRect')
        }
    }
}
