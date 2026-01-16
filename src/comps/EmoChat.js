// нужна предикция - это первый символ по контексту
// и автокомплит - следующие символы в зависимости от введённых и контекста
// автотюнинг - активные иконки становятся ближе к пальцу (в закрытом меню)
// нужно записывать выбор игрока в локал и смотреть на него для автокомплита
// и нужно добавить 2 кнопки в меню: стереть и отправить
// особые события в контекст
// слова и символы к особым событиям, которые нельзя найти в меню

export default class EmoChat {
    constructor(scene) {
        // console.log(scene)
        this.scene = scene
        this.config = this.initConstants({ x: 560, y: 920 }, { x: 480, y: 220 });
        // dev
        this.frameAlpha = 0
        this.devVisible = 0


        this.init()
        this.create()
        // this.emoSetCounts = new Map();
        this.attachGestures()

    }
    // static sameCounters(a, b) {
    // }
    initConstants(button, feed) {
        return {
            BUTTON_X: button.x,
            BUTTON_Y: button.y,
            AREA_RADIUS: 75,
            AREA_WIDTH: 150,
            AREA_HEIGHT: 150,
            TAP_MAX_DISTANCE: 3,
            TAP_MAX_DURATION: 250,
            // TAP_MIN_DURATION: 5,
            TAP_LONG_DURATION: 300,
            SWIPE_MIN_DISTANCE: 50,
            SWIPE_MAX_TIME: 1000,
            DRAG_HOLD_TIME: 400,
            DRAG_MIN_DISTANCE: 10,
            FEED_X: feed.x,
            FEED_Y: feed.y,
            FEED_WIDTH: 150,
            FEED_HEIGHT: 360,
            FEED_LENGTH: 3,
            MENU_WIDTH: 640,
            MENU_HEIGHT: 320,
            MESSAGE_LENGTH: 3,
            DOUBLE_TAP_DELAY: 250,
            ICONS_PER_CAT_MAX: 8,
            ICONS_INDENT_X: 30,
            ICONS_INDENT_Y: 60,
        };
    }
    init() {
        this.initEmoSet()
        this.initArea()
        this.initState()
        this.initCategories()
        this.initEmoSet()
        this.initUserNames()
        // 
        this.lastTapTime = 0;
        this.tapTimeoutId = null;
    }
    initArea() {
        // область жестов
        // this.gestureArea = new Phaser.Geom.Rectangle(
        //     this.config.BUTTON_X - this.config.AREA_WIDTH / 2,
        //     this.config.BUTTON_Y - this.config.AREA_HEIGHT / 2,
        //     this.config.AREA_WIDTH,
        //     this.config.AREA_HEIGHT
        // );
        // var 2
        this.gestureArea = new Phaser.Geom.Circle(
            this.config.BUTTON_X,
            this.config.BUTTON_Y,
            this.config.AREA_RADIUS
        );

    }
    initState() {
        this.state = {
            currentCat: 0,
            currentIconIndex: 0,   // индекс иконки в категории
            currentEmo: 'cool'
        };

        this.state.update = object => {
            for (const key in object) {
                if (!Object.hasOwn(object, key)) continue;
                this.state[key] = object[key];
            }
            console.log('this.state.update', this.state)
        };
    }
    initEmoSet() {
        this.emoSet = {
            // 1
            cool: { sheet: 'emo', frame: 0, size: 1, reference: '😎' },
            grin: { sheet: 'emo', frame: 1, size: 1, reference: '😁' },
            star_eyes: { sheet: 'emo', frame: 2, size: 1, reference: '🤩' },
            money_face: { sheet: 'emo', frame: 3, size: 1, reference: '🤑' },
            grin_sweat: { sheet: 'emo', frame: 4, size: 1, reference: '😅' },
            wink: { sheet: 'emo', frame: 5, size: 1, reference: '😉' },
            tongue_wink: { sheet: 'emo', frame: 6, size: 1, reference: '😜' },
            love_eyes: { sheet: 'emo', frame: 7, size: 1, reference: '😍' },
            // 2
            angry: { sheet: 'emo', frame: 8, size: 1, reference: '' },
            rage: { sheet: 'emo', frame: 9, size: 1, reference: '' },
            cry_hard: { sheet: 'emo', frame: 10, size: 1, reference: '' },
            dead: { sheet: 'emo', frame: 11, size: 1, reference: '' },
            pain: { sheet: 'emo', frame: 12, size: 1, reference: '' },
            nausea: { sheet: 'emo', frame: 13, size: 1, reference: '' },
            clown: { sheet: 'emo', frame: 14, size: 1, reference: '' },
            shit: { sheet: 'emo', frame: 15, size: 1, reference: '' },
            // 3
            mindblown: { sheet: 'emo', frame: 16, size: 1, reference: '' },
            thinking: { sheet: 'emo', frame: 17, size: 1, reference: '' },
            pleading: { sheet: 'emo', frame: 18, size: 1, reference: '' },
            panic: { sheet: 'emo', frame: 19, size: 1, reference: '' },
            awkward: { sheet: 'emo', frame: 20, size: 1, reference: '' },
            melting: { sheet: 'emo', frame: 21, size: 1, reference: '' },
            dizzy: { sheet: 'emo', frame: 22, size: 1, reference: '' },
            frustrated: { sheet: 'emo', frame: 23, size: 1, reference: '' },

            // 4. items
            fire: { sheet: 'emo', frame: 24, size: 1, reference: '' },
            money: { sheet: 'emo', frame: 25, size: 1, reference: '' },
            loss: { sheet: 'emo', frame: 26, size: 1, reference: '' },
            star: { sheet: 'emo', frame: 27, size: 1, reference: '' },
            rocket: { sheet: 'emo', frame: 28, size: 1, reference: '' },
            luck: { sheet: 'emo', frame: 29, size: 1, reference: '' },
            dice: { sheet: 'emo', frame: 30, size: 1, reference: '' },
            slots: { sheet: 'emo', frame: 31, size: 1, reference: '' },

            // 5. words - 2 слота
            fuck: { sheet: 'words', frame: 16, size: 2, reference: '' },
            wtf: { sheet: 'words', frame: 17, size: 2, reference: '' },
            lol: { sheet: 'words', frame: 18, size: 2, reference: '' },
            bruh: { sheet: 'words', frame: 19, size: 2, reference: '' },
            ez: { sheet: 'words', frame: 20, size: 2, reference: '' },
            wow: { sheet: 'words', frame: 21, size: 2, reference: '' },

            // служебные - не выводим в меню
            plane_black: { sheet: 'emo', frame: 44, size: 1, reference: '' },
            plane_blue: { sheet: 'emo', frame: 45, size: 1, reference: '' },
            empty: { sheet: 'emo', frame: 46, size: 1, reference: '' },
            bot: { sheet: 'emo', frame: 47, size: 1, reference: '' },

            // виновые

        };
    }
    initCategories() {
        this.categoryMap = {
            POSITIVE: [
                'cool',
                'grin',
                'star_eyes',
                'money_face',
                'grin_sweat',
                'wink',
                'tongue_wink',
                'love_eyes'
            ],

            NEGATIVE: [
                'angry',
                'rage',
                'cry_hard',
                'dead',
                'pain',
                'nausea',
                'clown',
                'shit'
            ],

            TILT: [
                'mindblown',
                'thinking',
                'pleading',
                'panic',
                'awkward',
                'melting',
                'dizzy',
                'frustrated'
            ],

            ITEMS: [
                'fire',
                'money',
                'loss',
                'star',
                'rocket',
                'luck',
                'dice',
                'slots'
            ],

            WORDS: [
                'fuck',
                'wtf',
                'lol',
                'bruh',
                'ez',
                'wow'
            ],
            // OTHER: [
            //     'plane_black',
            //     'plane_blue',
            //     'empty',
            //     'bot'
            // ]
        }

        this.categories = Object.entries(this.categoryMap).map(([name, icons]) => ({
            name,
            icons
        }));
        // console.log(this.categories)
    }
    initUserNames() {
        this.randomNames = [
            'HENRY', 'LINDA', 'PAUL', 'JOKER', 'MOOD', 'OCTOPAN', 'SWEETY', 'ROCKET', 'ADAM_W', 'SAYMYNAME', 'JESSY', 'ANGEL', 'VICKY', 'SUNDAY',
        ]
    }
    create() {
        this.createMenu()
        this.createButton()
        this.createHelper()
        this.createFeed()
        this.createMessage()
        this.createGestureSchemes()
        this.currentScheme = this.gestureSchemes[0];
        this.updateHelper(this.currentScheme)

        // this.timer = new EmoChat.Timer(
        //     this.scene,
        //     this.feed.messageLineBG.startX + 124, // подгони координаты возле плашки
        //     this.feed.messageLineBG.startY
        // );

    }
    createButton() {
        // контейнер
        this.button = {}
        this.button.container = this.scene.add.container(0, 0) // мы делаем контейнер из нуля, а элементы в абсолютных единицах?
        this.button.container.setDepth(999)
        // рамка
        this.button.frame = this.scene.add.graphics();
        this.button.frame.lineStyle(4, 0xfcd912, this.frameAlpha);
        this.button.frame.strokeRect(this.gestureArea.x, this.gestureArea.y, this.gestureArea.width, this.gestureArea.height);

        // иконка в центре области 
        this.button.icon = this.scene.add
            .image(this.config.BUTTON_X, this.config.BUTTON_Y, 'emo', 0)
            .setOrigin(0.5)
            .setScale(1.1)
            // .setDepth(100)
            .setInteractive();
        this.button.icon.defaults = {
            scale: this.button.icon.scale,
            word_scale: 0.75,
            x: this.config.BUTTON_X,
            y: this.config.BUTTON_Y
        }

        // название
        this.button.label = this.scene.add
            .text(this.config.BUTTON_X, this.config.BUTTON_Y - 50, `EMO_CHAT`, {
                font: '16px Helvetica',
                fill: '#dbdbdbff',
            }).setAlpha(0)
            .setOrigin(0.5)

        this.button.container.add([this.button.frame, this.button.icon, this.button.label])
    }
    createMenu() {
        // контейнер
        this.menu = {}
        this.menu.container = this.scene.add.container(0, 0).setDepth(999).setVisible(this.devVisible)

        // рамка
        this.menu.frame = this.scene.add.graphics()
            .lineStyle(4, 0xfcd912, this.frameAlpha)
            .strokeRect(this.config.BUTTON_X - this.config.MENU_WIDTH, this.config.BUTTON_Y - this.config.MENU_HEIGHT / 2, this.config.MENU_WIDTH, this.config.MENU_HEIGHT);

        // подложка
        this.menu.bg = this.scene.add.graphics();
        this.menu.bg.fillStyle(0x000000, 0.85); // 0x212838
        // this.menu.bg.fillRoundedRect(this.config.BUTTON_X - this.config.MENU_WIDTH + 100, this.config.BUTTON_Y - this.config.MENU_HEIGHT / 2, this.config.MENU_WIDTH, this.config.MENU_HEIGHT, 30);
        this.menu.bg.fillRoundedRect(0, this.config.BUTTON_Y - this.config.MENU_HEIGHT / 2, this.config.MENU_WIDTH, this.config.MENU_HEIGHT, 0);
        this.menu.bg.defaults = {
            alpha: this.menu.bg.alpha
        }

        this.menuArea = new Phaser.Geom.Rectangle(0, this.config.BUTTON_Y - this.config.MENU_HEIGHT / 2, this.config.MENU_WIDTH, this.config.MENU_HEIGHT)
        // надо перехватить нажатия
        this.menu.bg.setInteractive(
            this.menuArea,
            Phaser.Geom.Rectangle.Contains
        ).on('pointerdown', (pointer) => {
            // console.log('menu bg', pointer.x, pointer.y)

            // const m = this.menu.bg.getWorldTransformMatrix();
            // const bgX = m.tx;
            // const bgY = m.ty;
            // console.log("trans:", bgX, bgY, m);

            // const localX = pointer.x - bgX;
            // const localY = pointer.y - bgY;

            // console.log("local:", localX, localY);
        })
        this.menu.container.add([this.menu.bg, this.menu.frame])

        // веер / линии / категории
        this.menu.lines = []
        this.menu.rings = []
        this.menu.catShadows = []

        // var2
        this.menu.catShadow = this.scene.add
            .image(this.config.BUTTON_X - 60, this.config.BUTTON_Y, 'emo', 1)
            .setOrigin(0.5)
            .setScale(0.7) // 0.9
            .setAlpha(0) // .setAlpha(1 - i * 0.15)
            .setDepth(1000)
        this.menu.catShadow.defaults = {
            alpha: this.menu.catShadow.alpha,
            scale: this.menu.catShadow.scale,
            x: this.menu.catShadow.x,
            y: this.menu.catShadow.y
        }
        // this.menu.container.add(this.menu.lines) // это не сработает

        for (let index = 0; index < this.categories.length; index++) {
            const category = this.categories[index]
            const gapX = this.config.ICONS_INDENT_X
            const gapY = this.config.ICONS_INDENT_Y
            const shift = (index <= 2) ? gapX * index : gapX * (4 - index)
            const x = this.config.BUTTON_X - this.config.MENU_WIDTH - gapX - shift
            const y = this.config.BUTTON_Y + gapY * (index - 2)

            const wrapper = this.scene.add.graphics()
                .fillStyle(0x212838, 0)
                .fillRoundedRect(x + 275, y - 25, 290, 50, 25) // .fillRoundedRect(x + 95, y - 25, 410, 50, 25)
            this.menu.container.add(wrapper)

            this.menu.rings[index] = this.scene.add.graphics()
                .lineStyle(4, 0xE60000, 0)
                .strokeCircle(x + this.config.MENU_WIDTH, y, 26)
                .setVisible(index === this.state.currentCat ? 1 : 0)
            this.menu.container.add(this.menu.rings[index])

            this.menu.catShadows[index] = this.scene.add
                .image(x + this.config.MENU_WIDTH, y, 'emo', 1)
                .setOrigin(0.5)
                .setScale(0.7) // 0.9
                .setAlpha(0) // .setAlpha(1 - i * 0.15)
                .setDepth(1000)
            this.menu.catShadows[index].defaults = {
                alpha: this.menu.catShadows[index].alpha,
                scale: this.menu.catShadows[index].scale,
                x: this.menu.catShadows[index].x,
                y: this.menu.catShadows[index].y
            }
            // this.menu.container.add(this.menu.rings[index])
            // console.log('catShadows',this.menu.catShadows[index], x, y)

            this.menu.lines[index] = this.scene.add.container(x, y)
                .setDepth()
                .setAlpha(index === this.state.currentCat ? 1 : 0.5)

            this.menu.container.add(this.menu.lines[index])

            // иконки
            for (let i = 0; i < category.icons.length; i++) {
                if (i >= this.config.ICONS_PER_CAT_MAX) break;
                let x = this.config.MENU_WIDTH - 60 * i
                let y = 0
                let icon = null;

                // var 2
                const iconName = category.icons[i]
                const iconSheet = this.emoSet[iconName].sheet
                const iconNumber = this.emoSet[iconName].frame
                // console.log(iconName, iconSheet, iconNumber)

                if (category.name === 'WORDS') {
                    // if (i > 5) break
                    x = this.config.MENU_WIDTH - 10 - 60 * i * 1.5
                    // iconNumber = 16 + i
                    icon = this.scene.add
                        .image(x, y, iconSheet, iconNumber)
                        .setOrigin(0.5)
                        .setScale(0.6) // 0.9
                        .setAlpha(1) // .setAlpha(1 - i * 0.15)
                    icon.defaults = {
                        alpha: icon.alpha,
                        scale: icon.scale,
                        startX: x + this.config.ICONS_INDENT_X,
                        startY: y - (index - 2) * this.config.ICONS_INDENT_X
                    }
                    // console.log(iconSheet, iconNumber)
                } else {
                    icon = this.scene.add
                        .image(x, y, iconSheet, iconNumber) // нужно брать из списка
                        .setOrigin(0.5)
                        .setScale(0.7) // 0.9
                        .setAlpha(1) // .setAlpha(1 - i * 0.15)
                    icon.defaults = {
                        alpha: icon.alpha,
                        scale: icon.scale,
                        startX: x + this.config.ICONS_INDENT_X,
                        startY: y - (index - 2) * this.config.ICONS_INDENT_X
                    }
                    // console.log(iconSheet, iconNumber)
                }
                // this.categories[index].icons.push(iconNumber)
                // if (i === 0)console.log('icon.defaults', icon.defaults)
                if (icon) this.menu.lines[index].add(icon)

                if (i === 0) {
                    this.menu.catShadows[index].setFrame(iconNumber)
                }
            }
        }

        // закрывашка-открывашка меню
        this.menuCloser = {}
        // this.menuCloser.container = this.scene.add.container(0, 0).setDepth(999)
        // this.menuCloser.state = true

        const x = this.config.BUTTON_X + 40
        const y = this.config.BUTTON_Y + 120

        const buttonW = 60;
        const buttonH = 40;
        const buttonRadius = 10

        this.menuCloser.button = this.scene.add.graphics();
        this.menuCloser.button.fillStyle(0x212838, 1);
        this.menuCloser.button.fillRoundedRect(x - buttonW / 2, y - buttonH / 2, buttonW, buttonH, buttonRadius)
        // .setInteractive() // это не объект, он не может быть интерактивным...
        // .on('pointerdown', () => {
        //     if (this.helper.container.visible) {
        //         this.helper.container.visible = 0
        //         this.menuCloser.text.setText('OPEN\nHELP')
        //     }
        //     else {
        //         this.helper.container.visible = 1
        //         this.menuCloser.text.setText('CLOSE\nHELP')
        //     }
        // })

        this.menuCloser.text = this.scene.add.text(x, y, 'CLOSE\nMENU', {
            font: '12px Helvetica',
            fill: this.scene.textColors.yellow,
        })
            .setAlpha(1)
            .setOrigin(0.5)
            .setAlign('center')
            .setInteractive()
            .on('pointerdown', () => {
                this.toggleMenu()
                // if (this.menu.container.visible) {
                //     this.menu.container.visible = 0
                //     // this.menuCloser.text.setText('OPEN\nMENU')
                //     // this.menuCloser.state = false
                // }
                // else {
                //     this.menu.container.visible = 1
                //     // this.menuCloser.text.setText('CLOSE\nMENU')
                //     // this.menuCloser.state = true
                // }
            })

        this.menu.container.add([this.menuCloser.button, this.menuCloser.text])

        // delete
        this.delete = {}
        this.delete.button = this.scene.add.graphics()
            .fillStyle(0x212838, 0)
            .fillRoundedRect(x - 30 - buttonW / 2, this.config.BUTTON_Y - 70 - buttonH / 2, buttonW + 30, buttonH, buttonRadius)

        this.delete.text = this.scene.add.text(x - 15, this.config.BUTTON_Y - 70, 'DELETE', {
            font: '14px Helvetica',
            fill: this.scene.textColors.yellow,
        })
            .setAlpha(0)
            .setOrigin(0.5)
            .setAlign('center')
            .setInteractive()
            .on('pointerdown', () => {
                this.undoEmoji()
            })

        this.menu.container.add([this.delete.button, this.delete.text])
        // send

    }
    createHelper() {
        // контейнер
        this.helper = {}
        this.helper.container = this.scene.add.container(0, 0).setDepth(999).setVisible(this.devVisible)

        const x = 170 // 170
        const y = 510 // 500
        const width = 300
        const height = 300

        // рамка
        this.helper.frame = this.scene.add.graphics()
            .lineStyle(4, 0xfcd912, this.frameAlpha)
            .strokeRect(x, y, width, height);

        // подложка
        // this.helper.bg = this.scene.add.graphics();
        // this.helper.bg.fillStyle(0x1c2534, 1); // '#1b1c23ff'
        // this.helper.bg.fillRoundedRect(x, y, width, height, 24);

        // 
        this.helper.bg = this.scene.add.image(320, 600, 'emo_help')
            .setOrigin(0.5)
            .setScale(1.0)

        // нужен анимированный хелпер в стиле телеграм
        // Swipe UP to send\n
        // Swipe -> next emoji\n
        // Swipe <- prev emoji\n
        // Swipe DOWN - change cat



        this.helper.text = this.scene.add.text(x + 20, y + 20,
            '', {
            font: "20px Helvetica",
            fill: '#05edff',
        })
            .setOrigin(0, 0)
            .setAlign('left')
            .setAlpha(0)

        this.helper.label = this.scene.add.graphics()
            .fillStyle(this.scene.standartColors.red, 1) // '#ff0000ff'
            .fillRoundedRect(x, y - 100, width, 24, 12);

        this.helper.top = this.scene.add.text(x + width / 2, y - 88, `EMOCHAT BY AIRCRAFT.GAMES`, {
            font: "16px Helvetica",
            fill: '#020202ff',
        })
            .setAlpha(1)
            .setOrigin(0.5)
            .setAlign('center')
        // .setShadow(1, 1, '#090909ff', 1, true, true);

        this.helper.container.add([this.helper.bg, this.helper.frame, this.helper.label, this.helper.top, this.helper.text])

        // закрывашка-открывашка хелпера
        this.helperCloser = {}
        this.helperCloser.container = this.scene.add.container(0, 0).setDepth(999)
        this.helperCloser.state = true

        const closerX = this.config.BUTTON_X + 40
        const closerY = this.config.BUTTON_Y - 120

        const buttonW = 60;
        const buttonH = 40;
        const buttonRadius = 10

        this.helperCloser.button = this.scene.add.graphics();
        this.helperCloser.button.fillStyle(0x212838, 1);
        this.helperCloser.button.fillRoundedRect(closerX - buttonW / 2, closerY - buttonH / 2, buttonW, buttonH, buttonRadius)
        // .setInteractive() // это не объект, он не может быть интерактивным...
        // .on('pointerdown', () => {
        //     if (this.helper.container.visible) {
        //         this.helper.container.visible = 0
        //         this.helperCloser.text.setText('OPEN\nHELP')
        //     }
        //     else {
        //         this.helper.container.visible = 1
        //         this.helperCloser.text.setText('CLOSE\nHELP')
        //     }
        // })

        this.helperCloser.text = this.scene.add.text(closerX, closerY, 'CLOSE\nHELP', {
            font: '12px Helvetica',
            fill: this.scene.textColors.yellow,
        })
            .setAlpha(1)
            .setOrigin(0.5)
            .setAlign('center')
            .setInteractive()
            .on('pointerdown', () => {
                this.toggleHelp()
                // if (this.helper.container.visible) {
                //     this.helper.container.visible = 0
                //     this.helperCloser.text.setText('OPEN\nHELP')
                //     this.helperCloser.state = false
                // }
                // else {
                //     this.helper.container.visible = 1
                //     this.helperCloser.text.setText('CLOSE\nHELP')
                //     this.helperCloser.state = true
                // }
            })

        this.helperCloser.container.add([this.helperCloser.button, this.helperCloser.text])
        this.menu.container.add(this.helperCloser.container)
    }
    createMessage(reply, occasion, emos) {
        // контейнер
        this.message = {}
        this.message.container = this.scene.add.container(0, 0).setDepth(999)

        // линия эмодзи
        this.message.length = 0
        this.message.line = []
        this.message.sprites = []
        this.message.lineContainer = this.scene.add.container(0, 0).setDepth(999)
        // this.message.container.add(this.message.sprites)

        // рамка и подложка
        this.message.bg = this.scene.add.graphics();
        this.message.bg.fillStyle(0x212838, 0)
        this.message.bg.fillRoundedRect(this.config.FEED_X, this.config.FEED_Y + this.config.FEED_HEIGHT + 10, this.config.FEED_WIDTH, 120, 12)

        this.message.frame = this.scene.add.graphics();
        this.message.frame.lineStyle(4, 0xE60000, 0);
        this.message.frame.strokeRoundedRect(this.config.FEED_X, this.config.FEED_Y + this.config.FEED_HEIGHT + 10, this.config.FEED_WIDTH, 120, 12)

        // this.message.plane = this.scene.add
        //     .image(this.config.BUTTON_X, this.config.BUTTON_Y, 'emo_plane')
        //     .setOrigin(0.5)
        //     .setScale(1.1)

        const content = {
            reply,
            // nickName: 'HENRY', // а зачем он здесь? игрок и так знает кто он... 
            occasion,
            emos
        }
        // сценарий 1 - сообщение без вин

        // сценарий 2 - сообщение с вин

        // сценарий 3 - реплей

        this.message.container.add([this.message.bg, this.message.frame])
    }
    addEmoToLine() {
        // TODO: позже добавим проверки на длину/ширину и веса слов
        // const size = this.getEmoSize(this.state.currentEmo);
        // if (this.getUsedSlots() + size > this.config.MESSAGE_LENGTH) return;

        const obj = { cat: this.state.currentCat, emo: this.state.currentEmo }
        // const size = this.getEmoSize(obj); // можно заменить на size сразу в иконках
        const emo = this.emoSet[this.state.currentEmo]
        const size = emo.size;

        // if (this.message.length < this.config.MESSAGE_LENGTH) this.message.line.push(this.state.currentEmo);
        if (this.message.length + size > this.config.MESSAGE_LENGTH) return;
        // нужно какое-то предупреждение показать
        this.message.line.push({ cat: this.state.currentCat, emo: this.state.currentEmo });

        this.setMessLength()
        this.updateMessageLine();
        this.updateButtonIcon();
        this.updatePlane()

        // this.updatePredictLine() // тоже не очень
    }
    undoEmoFromLine() {
        if (this.message.length > 0) this.message.line.pop()
        this.setMessLength()
        this.updateMessageLine();
        this.updateButtonIcon();
        this.updatePlane()
    }
    setMessLength() {
        let length = 0;
        for (const obj of this.message.line) {
            length += this.getEmoSize(obj);
        }
        this.message.length = length;
    }
    getUsedSlots() {
        let slots = 0;
        for (const frame of this.message.line) {
            slots += this.getEmoSize(frame);
        }
        return slots;
    }
    getEmoSize(obj) {
        console.log('getEmoSize', obj)
        // const cat = this.state.currentCat
        if (this.categories[obj.cat].name === 'WORDS') return 2;
        else return 1;
    }

    clearMessageLine() {
        this.message.line.length = 0
        this.message.length = 0
    }
    updateMessageLine() {
        const length = this.message.length;
        const line = this.message.line;
        const sprites = this.message.sprites;

        if (!length) {
            // если очистишь сообщение — нужно будет ещё и спрайты убить
            sprites.forEach(s => s.destroy());
            this.message.sprites = [];
            return;
        }

        const spacing = 72 * 0.55; // расстояние между иконками
        const targetY = this.feed.messageLineBG.startY;

        // центрируем по BG (можно подправить формулу)
        const baseX = this.feed.messageLineBG.startX - 4; //  + 16
        let accumulatedSize = 0;

        for (let index = 0; index < line.length; index++) {
            const emoName = line[index].emo;
            const emo = this.emoSet[emoName];
            const cat = this.state.currentCat
            // const sheet = (this.categories[cat].name === 'WORDS') ? 'words' : 'emo'
            const sheet = emo.sheet
            const frame = emo.frame;
            console.log('updateMessageLine', emoName, sheet, frame)
            accumulatedSize += index > 0 ? this.getEmoSize(line[index - 1]) : 0;
            const targetX = baseX + accumulatedSize * spacing;

            let icon = sprites[index];

            if (!icon) {
                // это НОВАЯ иконка → создаём у кнопки и анимируем "прилёт"
                icon = this.scene.add
                    .image(targetX, targetY + 50, sheet, frame)
                    .setOrigin(0, 0.5)
                    .setScale(0.55);

                sprites[index] = icon;
                this.message.lineContainer.add(icon)

                this.scene.tweens.add({
                    targets: icon,
                    // x: targetX,
                    y: targetY,
                    duration: 50,
                    ease: 'Back.Out'
                });
            } else {
                // уже существующая — просто обновляем кадр и позицию без анимации
                icon.setFrame(frame);
                icon.setPosition(targetX, targetY);
            }
        }

        // если спрайтов стало больше, чем иконок в линии (например, после очистки и набора заново)
        for (let i = line.length; i < sprites.length; i++) {
            sprites[i].destroy();
        }
        sprites.length = line.length;
    }
    updatePredictLine() {
        const line = this.message.line;
        const sprites = this.message.sprites;
        const spacing = 72 * 0.55; // расстояние между иконками
        const targetY = this.feed.messageLineBG.startY;
        // центрируем по BG (можно подправить формулу)
        const baseX = this.feed.messageLineBG.startX + 16;

        for (let index = 0; index < 3; index++) {
            if (line[index]) continue
            if (!line[index - 1]) continue

            const frame = this.state.currentEmo;
            const targetX = baseX + index * spacing;

            // let icon = this.state.currentEmo;

            // if (!icon) {
            //     // это НОВАЯ иконка → создаём у кнопки и анимируем "прилёт"
            const icon = this.scene.add
                .image(targetX, targetY, 'emo', frame)
                .setOrigin(0.5)
                .setScale(0.55)
                .setAlpha(0.3)
                .setDepth(1000)

            //     sprites[index] = icon;
            //     this.message.lineContainer.add(icon)

            //     this.scene.tweens.add({
            //         targets: icon,
            //         // x: targetX,
            //         y: targetY,
            //         duration: 50,
            //         ease: 'Back.Out'
            //     });
            // } else {
            //     // уже существующая — просто обновляем кадр и позицию без анимации
            //     icon.setFrame(frame);
            //     icon.setPosition(targetX, targetY);
            // }
        }
    }
    updatePlane() {
        // реакция маленького самолётика - вынести
        if (this.message.length > 0) this.feed.messagePlane.alpha = 1
        else this.feed.messagePlane.alpha = 0.5

        if (this.message.length === this.config.MESSAGE_LENGTH) this.reflexPlane(1000)
    }
    reflexPlane(delay, callback) {
        // заменить на интервал и проверку после таймера
        this.scene.tweens.add({
            targets: this.feed.messagePlane,
            // x: targetX,
            y: this.feed.messagePlane.defaults.y - 6,
            yoyo: true,
            duration: 50,
            delay: delay,
            ease: 'Back.Out',
            onComplete: () => {
                if (callback) callback()
                this.feed.messagePlane.y = this.feed.messagePlane.defaults.y
            }
        });
    }

    createFeed() {
        // контейнер
        this.feed = {}
        this.feed.container = this.scene.add.container(0, 0).setDepth(999)

        // рамка
        this.feed.frame = this.scene.add.graphics()
            .lineStyle(4, 0xfcd912, this.frameAlpha)
            .strokeRect(this.config.FEED_X, this.config.FEED_Y, this.config.FEED_WIDTH, this.config.FEED_HEIGHT);

        // подложка
        const indent = 4

        this.feed.bg = this.scene.add.graphics();
        this.feed.bg.fillStyle(0x000000, 0.0); // 0x212838
        this.feed.bg.fillRoundedRect(this.config.FEED_X, this.config.FEED_Y, this.config.FEED_WIDTH, this.config.FEED_HEIGHT, indent * 3);

        // 👉 контейнер для строк фида (плашек)

        this.feed.messageCont = this.scene.add.container(
            this.config.FEED_X + indent,
            this.config.FEED_Y + indent
        ).setDepth(1000)
        this.feed.messageArray = []

        const messageHeight = 86
        const messageWidth = this.config.FEED_WIDTH - indent * 2
        const radius = indent * 2
        const gapY = indent * 2
        // плашки в фиде
        for (let index = 0; index <= this.config.FEED_LENGTH; index++) {
            // cont
            this.feed.messageArray[index] = this.scene.add.container(
                0,
                0 + messageHeight * index + gapY * index
            ).setDepth(1000)

            const wrapper = this.scene.add.graphics()
                .fillStyle(0x212838, 0.9)
                .fillRoundedRect(0, 0, messageWidth, messageHeight, radius)

            const name = this.scene.add.text(0 + indent * 2, 0 + indent, 'NAME_' + (index + 1), {
                fontFamily: 'CyberFont',
                fontSize: '14px',
                // color: scene.textColors.white,
                fill: this.scene.textColors.white,
            })

            // this.feed.messageArray[index].add([wrapper, name])

            this.feed.messageCont.add(this.feed.messageArray[index])
        }

        // подложка нашего набора
        this.feed.messageLineBG = this.scene.add.graphics();
        this.feed.messageLineBG.fillStyle(0x212838, 0.9);
        this.feed.messageLineBG.fillRoundedRect(this.config.FEED_X, this.config.FEED_Y + this.config.FEED_HEIGHT - 40, this.config.FEED_WIDTH, 40, 8);
        this.feed.messageLineBG.startX = this.config.FEED_X + 5
        this.feed.messageLineBG.startY = this.config.FEED_Y + this.config.FEED_HEIGHT - 20

        this.feed.messagePlane = this.scene.add
            .image(this.config.FEED_X + this.config.FEED_WIDTH - 18, this.config.FEED_Y + this.config.FEED_HEIGHT - 20, 'emo_plane')
            .setOrigin(0.5)
            .setScale(0.5)
            .setAlpha(0.5)
        this.feed.messagePlane.defaults = {
            y: this.feed.messagePlane.y
        }

        this.feed.container.add([this.feed.bg, this.feed.frame, this.feed.messageCont, this.feed.messageLineBG, this.feed.messagePlane])
    }
    commitMessage(lineFrames = this.message.line) {
        if (!lineFrames || !lineFrames.length) return;

        // TODO: здесь можно позже сделать маппинг frame → реальный emoji
        // сейчас просто покажем номера кадров
        const payload = lineFrames.join(' ');       // "12 34 56"
        // или, если хочешь формат типа [12,34,56]:
        // const payload = `[${lineFrames.join(', ')}]`;

        this.addFeedRow(payload);
    }

    updateFeed(line) {
        if (!this.feedRows) {
            this.feedRows = [];
            for (let i = 0; i < 4; i++) {
                this.feedRows.push(
                    this.scene.add.text(20, 80 + i * 20, '', { fontSize: 16, color: '#fff' })
                );
            }
        }
        for (let i = this.feedRows.length - 1; i > 0; i--) {
            this.feedRows[i].setText(this.feedRows[i - 1].text);
        }
        this.feedRows[0].setText(line);
    }
    addFeedRow(text) {
        const maxRows = 5;
        const scene = this.scene;

        if (!this.feed || !this.feed.messageCont) return;
        const container = this.feed.messageCont;

        // создаём плашку
        const row = this.makeFeedRow(scene, text);

        // вертикальная позиция: каждая следующая строка чуть ниже
        const ROW_GAP = 26; // можно подогнать
        const index = container.list.length;
        row.y = index * ROW_GAP;

        container.add(row);

        // плавное появление
        scene.tweens.add({
            targets: row,
            y: row.y - 4,   // лёгкий подъём
            alpha: 1,
            duration: 150,
            ease: 'Quad.easeOut'
        });

        // если строк больше лимита — удаляем старую (верхнюю)
        if (container.list.length > maxRows) {
            const old = container.list[0];
            old.destroy();
            container.remove(old, true);

            // пересобираем позиции оставшихся строк
            container.list.forEach((child, i) => {
                scene.tweens.add({
                    targets: child,
                    y: i * ROW_GAP,
                    duration: 100,
                    ease: 'Quad.easeOut'
                });
            });
        }
    }
    makeFeedRow(scene, label) {
        const PAD_X = 10, PAD_Y = 4, RADIUS = 8;

        const txt = scene.add.text(0, 0, label, {
            fontFamily: 'Helvetica',
            fontSize: '14px',
            fill: '#fff'
        }).setOrigin(0, 0.5);

        const bg = scene.add.graphics();
        const badgeW = txt.width + PAD_X * 2;
        const badgeH = txt.height + PAD_Y * 2;
        bg.fillStyle(0x000000, 0.35);
        bg.fillRoundedRect(0, 0, badgeW, badgeH, RADIUS);

        const row = scene.add.container(0, 0, [bg, txt]);
        txt.x = PAD_X;
        txt.y = badgeH / 2;
        row.setAlpha(0);
        return row;
    }

    eraseLine() {
        if (this.message.length > 0) {
            this.clearMessageLine()
            this.updateMessageLine()
            this.setCurrentEmo(this.state.currentCat, this.state.currentIconIndex)
        }
    }
    // жесты
    attachGestures() {
        const { scene } = this;
        const area = this.gestureArea;
        const menu = this.menuArea
        const cfg = this.config;

        let startX = 0, startY = 0, startTime = 0;

        scene.input.on("pointerdown", (p) => {

            // console.log('pointerdown')
            // console.log('area', area.x, area.y, area.radius);
            // console.log('pointer', p.x, p.y);

            if (Phaser.Geom.Circle.Contains(area, p.x, p.y)) {
                startX = p.x;
                startY = p.y;
                startTime = scene.time.now;
                // console.log('pointerdown button')
                return;
            }
            if (Phaser.Geom.Rectangle.Contains(menu, p.x, p.y) && this.menu.container.visible) {
                // if (p.event) { // не работает
                //     p.event.stopPropagation();
                //     p.event.preventDefault();
                // }
                // startX = p.x;
                // startY = p.y;
                // startTime = scene.time.now;
                // console.log('pointerdown menu', this.menu.container.visible)
                const local_x = p.x - menu.x;
                const local_y = p.y - menu.y;
                // const delta_y = local_y - menu.height / 2
                let line = Math.ceil((local_y - 10) / 60)
                // console.log('pointerdown menu', local_x, local_y, line)
                if (line > 0 && line < 6) {
                    const index = line - 1

                    // поищем иконку
                    // console.log('line icons', this.categories[index].icons)
                    // console.log('line cont', this.menu.lines[index].x, this.menu.lines[index].y)
                    this.menu.lines[index].list.forEach(icon => {
                        // console.log('icon.x', icon.x)
                    })
                    // console.log('this.button.x', this.button.icon.x)
                    const delta_x = this.button.icon.x - local_x
                    if (delta_x > 0) {
                        const gapX = this.config.ICONS_INDENT_X
                        const shift = (index <= 2) ? gapX * index : gapX * (4 - index)
                        // console.log('shift', shift)
                        const gap = this.config.ICONS_INDENT_X * (index - 2)
                        const frameWidth = this.categories[index].name === 'WORDS' ? 90 : 60
                        let cell = Math.ceil((delta_x - shift) / frameWidth)
                        // console.log('cell', cell)

                        if (cell > 0) {
                            const i = cell - 1
                            if (this.menu.lines[index].list[i]) {
                                const frame = this.getFrameFor(index, i);
                                console.log('setCurrentEmo', index, i, frame);
                                this.state.update({
                                    currentCat: index,
                                    currentIconIndex: i,
                                    currentEmo: frame
                                });
                                this.sendEmoji()
                            }
                            // console.log('line', this.categories[index].name)

                            this.updateCat(index) // не всегда это нужно
                        }
                    }
                }
            }
        });



        scene.input.on("pointerup", (p) => {
            if (!startTime) return;

            const dx = p.x - startX;
            const dy = p.y - startY;
            const dist = Phaser.Math.Distance.Between(startX, startY, p.x, p.y);
            const dur = scene.time.now - startTime;
            startTime = 0;
            // console.log('dur', dur, 'dist', dist)

            // 👇 короткий тап 
            if (dist < cfg.TAP_MAX_DISTANCE && dur < cfg.TAP_LONG_DURATION) { // && dur > cfg.TAP_MIN_DURATION
                // this.toggleMenu();
                this.performGesture("tap");
                return;
            }

            // 👇 длинный тап 
            if (dist < cfg.TAP_MAX_DISTANCE && dur > cfg.TAP_LONG_DURATION) {
                // this.toggleMenu();
                this.performGesture("long");
                return;
            }

            // 👇 короткий тап: одиночный или двойной
            // if (dist < cfg.TAP_MAX_DISTANCE && dur < cfg.TAP_MAX_DURATION) {
            //     const now = scene.time.now;

            //     // если уже был тап недавно → считаем дабл-тап
            //     if (now - this.lastTapTime <= cfg.DOUBLE_TAP_DELAY) {
            //         // сброс ожидания одиночного тапа
            //         if (this.tapTimeoutId) {
            //             clearTimeout(this.tapTimeoutId);
            //             this.tapTimeoutId = null;
            //         }
            //         this.lastTapTime = 0;

            //         // здесь обрабатываем DOUBLE TAP
            //         // либо прямым вызовом:
            //         // this.onDoubleTap();
            //         // либо через схемы:
            //         this.performGesture('double');

            //     } else {
            //         // первый тап → ждём, не прилетит ли второй
            //         this.lastTapTime = now;

            //         this.tapTimeoutId = setTimeout(() => {
            //             // если второй тап не пришёл — считаем одиночным
            //             this.tapTimeoutId = null;
            //             this.lastTapTime = 0;

            //             // одиночный тап:
            //             // раньше тут было this.toggleMenu()
            //             // теперь лучше через схему:
            //             this.performGesture('tap');
            //         }, cfg.DOUBLE_TAP_DELAY);
            //     }

            //     return;
            // }

            // 👇 быстрый свайп
            if (dist >= cfg.SWIPE_MIN_DISTANCE && dur < cfg.SWIPE_MAX_TIME) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    // горизонталь
                    if (dx > 0) this.performGesture('right'); // this.nextIcon();      // вправо
                    else this.performGesture('left'); // this.prevIcon();             // влево

                    this.buttonIconlineMove(this.button.icon, dx, 0)
                } else {
                    // вертикаль
                    if (dy < 0) this.performGesture('up'); // this.sendEmoji();     // вверх — отправка эмоции
                    else this.performGesture('down'); // this.undoEmoji() // this.nextCategory();         // вниз — смена категории

                    this.buttonIconlineMove(this.button.icon, 0, dy)
                }
            }
        });

        // (опционально) — если хочешь long-hold для drag или таймеров:
        // scene.input.on('pointermove', ...)  → можно добавить потом.
    }
    // методы для жестов
    nextIcon() {
        // console.log('next icon', this.state.currentEmo);
        const cat = this.state.currentCat;
        const nextIndex = this.state.currentIconIndex - 1; // поменял последовательность, инверсия
        this.setCurrentEmo(cat, nextIndex);
    }
    prevIcon() {
        // console.log('prev icon', this.state.currentEmo);
        const cat = this.state.currentCat;
        const prevIndex = this.state.currentIconIndex + 1; // поменял последовательность, инверсия
        this.setCurrentEmo(cat, prevIndex);
        // console.log('prev icon new', this.state.currentIconIndex)
        const icon = this.menu.lines[cat].list[this.state.currentIconIndex]
        // console.log('prev icon icon', this.menu.lines[cat].list, icon.x, this.menu.rings[cat].x)
        // this.menu.rings[cat].x = icon.x
        // иконка и кольцо в разных контейнерах
    }
    nextCategory() {
        const prevCat = this.state.currentCat;
        const nextCat = (prevCat + 1) % this.categories.length;

        // this.state.currentCat = nextCat;
        // визуально подсветили категорию
        this.updateCat(nextCat)

        // ставим первую иконку новой категории
        this.setCurrentEmo(nextCat, 0);

        // const icon = this.menu.lines[nextCat].list[this.state.currentIconIndex]
        // console.log('nextCategory', icon.x, this.menu.rings[nextCat].x)
        this.shadowShow(prevCat, nextCat)
    }
    updateCat(newCat) {
        this.state.currentCat = newCat;
        this.menu.rings.forEach((ring, index) => ring.visible = (index === newCat));
        this.menu.lines.forEach((line, index) => line.setAlpha(index === newCat ? 1 : 0.5));
    }
    shadowShow(prev, next) {
        console.log('shadowShow', prev, next)
        if (this.menu.container.visible) return
        const duration = 120
        const icon = this.menu.catShadow
        icon.y = icon.defaults.y - (3 - next) * 30
        icon.alpha = 0

        this.scene.tweens.add({
            targets: icon,
            // x: ,
            y: icon.y + 30,
            alpha: 0.7,
            // scale: 1.1,
            duration: duration,
            // ease: "Back.easeOut", // 'Quad.easeOut'
            onComplete: () => {
                icon.setFrame(this.state.currentEmo)
                this.scene.tweens.add({
                    targets: icon,
                    // x: ,
                    // y: icon.y + 30,
                    alpha: 0,
                    delay: duration,
                    duration: duration * 2,
                    ease: "Back.easeIn", // 'Quad.easeOut'
                    onComplete: () => {
                        // notice.destroy()
                        icon.y = icon.defaults.y
                    },
                });
            },
        });

        // this.menu.catShadows[prev].alpha = 0.5
        // this.scene.tweens.add({
        //     targets: this.menu.catShadows[prev],
        //     // x: ,
        //     // y: ,
        //     alpha: 0,
        //     // scale: 1.1,
        //     duration: duration,
        //     ease: "Back.easeOut", // 'Quad.easeOut' 
        //     onComplete: () => {
        //         // notice.destroy()
        //     },
        // });

        // this.menu.catShadows[next].alpha = 0
        // this.scene.tweens.add({
        //     targets: this.menu.catShadows[next],
        //     // x: ,
        //     // y: ,
        //     alpha: 0.5,
        //     // scale: this.menu.catShadows[next] * 1.1,
        //     duration: duration,
        //     // delay: duration / 2,
        //     yoyo: true,
        //     ease: "Back.easeOut", // 'Quad.easeOut' 
        //     onComplete: () => {
        //         // notice.destroy()
        //     },
        // });
    }
    rightSelector() {
        if (this.menu.container.visible) {
            this.closeMenu()
        } else {
            this.nextIcon()
        }
    }
    leftSelector() {
        if (!this.menu.container.visible) {
            this.openMenu()
        } else {
            this.prevIcon()
        }
    }
    tapSelector() {
        if (this.message.length > 0) {
            this.sendMessage();
        } else {
            // отправить сразу в фид эмо
            this.addEmoToLine()
            this.sendMessage();
            // this.sendEmoji()
        }
    }
    upSelector() {
        if (this.message.length === this.config.MESSAGE_LENGTH) {
            this.sendMessage();
        } else {
            this.sendEmoji()
        }
    }
    downSelector() {
        if (this.message.length === 0) {
            this.nextCategory();
        } else {
            this.undoEmoji()
        }
    }
    undoEmoji() {
        // console.log('undoEmoji')
        this.undoEmoFromLine()
        this.setNextEmo();
    }
    sendEmoji() {
        console.log('send emoji', this.state.currentCat, this.state.currentEmo)
        this.addEmoToLine()
        this.setNextEmo();
    }
    toggleMenu() {
        // console.log('toggle menu')
        this.menu.container.visible = !this.menu.container.visible
        if (this.helperCloser.state && this.menu.container.visible) this.helper.container.visible = this.menu.container.visible
        else this.helper.container.visible = 0

        this.openVeer(this.menu.container.visible)
    }
    openMenu() {
        this.menu.container.visible = 1
        if (this.helperCloser.state) this.helper.container.visible = 1
        else this.helper.container.visible = 0

        this.openVeer(this.menu.container.visible)
    }
    closeMenu() {
        this.menu.container.visible = 0
        this.helper.container.visible = 0
        this.openVeer(this.menu.container.visible)
    }
    toggleHelp() {
        // console.log('toggle help')
        // this.help.container.visible = !this.help.container.visible

        if (this.helper.container.visible) {
            this.helper.container.visible = 0
            this.helperCloser.text.setText('OPEN\nHELP')
            this.helperCloser.state = false
        }
        else {
            this.helper.container.visible = 1
            this.helperCloser.text.setText('CLOSE\nHELP')
            this.helperCloser.state = true
        }

        // if (this.help.container.visible) {
        //     this.help.container.visible = 0
        //     // this.helper.container.visible = 0
        // } else {
        //     this.menu.container.visible = 1
        //     // if (this.helperCloser.state) this.helper.container.visible = 1
        // }
    }
    sendMessage() {
        // console.log('send message', this.message.line);
        if (this.message.length === 0) return
        this.commitMessage(this.message.line);
        setTimeout(() => {
            // this.commitMessage();
            this.clearMessageLine();
            this.updateMessageLine();
            this.updateButtonIcon();
            // this.timer.stop()
            // this.scene.sfx.woosh.play();
        }, 100);

        // чужие модули
        // this.button.icon.setFrame(1) // нужно ставить последнюю иконку, или предикцию...
        this.reflexPlane(0, () => this.feed.messagePlane.alpha = 0.5)
        this.scene.sfx.woosh.play();
    }
    // Маппинг “категория+индекс → frame”
    getFrameFor(catIndex, iconIndex) {

        const cat = this.categories[catIndex];
        if (!cat) cat = 0; // дефолт
        // if (cat.name === 'WORDS') {

        // }
        const iconName = cat.icons[iconIndex];
        console.log('getFrameFor', catIndex, iconIndex, cat, iconName); // this.emoSet[iconName]
        return iconName ?? 0;
    }
    // иконка на кнопку
    setCurrentEmo(catIndex, iconIndex) {
        // console.log('setCurrentEmo1', catIndex, iconIndex);
        // нормализуем индексы
        const catsCount = this.categories.length;
        catIndex = (catIndex + catsCount) % catsCount;

        const iconsCount = this.categories[catIndex].icons.length;
        iconIndex = (iconIndex + iconsCount) % iconsCount;

        const frame = this.getFrameFor(catIndex, iconIndex);
        // console.log('setCurrentEmo2', catIndex, iconIndex, frame);
        this.state.update({
            currentCat: catIndex,
            currentIconIndex: iconIndex,
            currentEmo: frame
        });

        this.updateButtonIcon();
    }
    setNextEmo() {
        // если строки ещё нет (теоретически), просто обновим кнопку
        if (!this.message) {
            this.updateButtonIcon();
            return;
        }

        // если строка заполнена – логика кнопки (самолётик) решается в updateButtonIcon
        if (this.message.length === this.config.MESSAGE_LENGTH) {
            this.updateButtonIcon();
            return;
        }

        const cat = this.state.currentCat;
        const nextIndex = this.state.currentIconIndex + 1;

        this.setCurrentEmo(cat, nextIndex);
    }
    updateButtonIcon() {
        console.log('updateButtonIcon', this.state.currentCat, this.state.currentEmo);
        const emo = this.emoSet[this.state.currentEmo]
        const sheet = emo.sheet
        const frame = emo.frame
        console.log('updateButtonIcon', sheet, frame);
        // если строка заполнена – показываем самолётик
        if (this.message && this.message.length === this.config.MESSAGE_LENGTH) {
            this.button.icon.setTexture('emo');
            const planeFrame = this.emoSet['plane_black'].frame
            this.button.icon.setFrame(planeFrame); // самолётик 
            this.button.icon.setScale(this.button.icon.defaults.scale);
        } else {
            if (this.categories[this.state.currentCat].name === 'WORDS') {
                this.button.icon.setTexture('words');
                this.button.icon.setScale(this.button.icon.defaults.word_scale);
            } else {
                this.button.icon.setTexture('emo');
                this.button.icon.setScale(this.button.icon.defaults.scale);
            }

            // var 2

            this.button.icon.setFrame(frame);
        }
    }
    // вспомогательные методы
    buttonIconlineMove(icon, dx, dy) {
        // console.log('buttonIconlineMove: ', icon, dx, dy);
        const offsetX = dx * 0.1; // величина отклонения (чуть больше для отзывчивости)
        const offsetY = dy * 0.1;

        this.scene.tweens.add({
            targets: icon,
            x: icon.x + offsetX,
            y: icon.y + offsetY,
            // alpha: 0.5,
            // scale: 1.1,
            duration: 30,
            ease: "Sine.easeOut", // 'Back.easeOut' Sine.easeOut
            yoyo: true,
            onComplete: () => {
                icon.setPosition(icon.x, icon.y);
            },
        });
    }
    openVeer(state) {
        // console.log('open veer', this.menu.lines[0].list)
        const duration = 100
        this.menu.lines.forEach(cont => {
            // console.log('cont', cont.list)
            if (state) {
                const firstIcon = cont.list[0]
                const firstIconX = firstIcon.x
                const firstIconY = firstIcon.y
                firstIcon.x = firstIcon.defaults.startX
                // firstIcon.y = firstIcon.defaults.startY
                firstIcon.alpha = 0
                // console.log('openVeer', firstIconX, firstIconY, )
                this.scene.tweens.add({
                    targets: firstIcon,
                    x: firstIconX,
                    // y: firstIconY,
                    alpha: 1,
                    // scale: 1.1,
                    duration: duration,
                    ease: "Back.easeOut", // 'Quad.easeOut' 
                    onComplete: () => {
                        // notice.destroy()
                    },
                });

                for (let index = 1; index < cont.list.length; index++) {
                    const icon = cont.list[index]
                    icon.alpha = 0
                    this.scene.tweens.add({
                        targets: icon,
                        // x: firstIconX,
                        // y: firstIconY,
                        alpha: icon.defaults.alpha,
                        // scale: 1.1,
                        delay: index * 10,
                        duration: duration + 40,
                        ease: "Back.easeOut", // 'Quad.easeOut' 
                        onComplete: () => {
                            // notice.destroy()
                        },
                    });
                }
                // button icon
                // this.button.icon.scale = 0.8

            } else {
                const icon = this.button.icon
                this.scene.tweens.add({
                    targets: icon,
                    scale: icon.scale * 1.1,
                    duration: 50,
                    // yoyo: true,
                    ease: "Back.easeOut", // 'Quad.easeOut' 
                    onComplete: () => {
                        if (this.categories[this.state.currentCat].name === 'WORDS' && icon.frame.name != 44) icon.setScale(icon.defaults.word_scale)
                        else icon.setScale(icon.defaults.scale)
                    },
                });
            }

        })
    }

    // схемы
    createGestureSchemes() {
        this.gestureSchemes = [
            {
                name: "-1",
                handlers: {
                    tap: "upSelector", // sendMessage 
                    long: "toggleMenu", // toggleMenu
                    up: "sendMessage", // sendEmoji
                    down: "downSelector", // undoEmoji
                    right: "rightSelector", // nextIcon
                    left: "leftSelector" // prevIcon 
                }
            },
            {
                name: "0",
                handlers: {
                    tap: "sendMessage", // sendMessage 
                    long: "toggleMenu", // toggleMenu
                    up: "upSelector", // sendEmoji
                    down: "downSelector", // undoEmoji
                    right: "nextIcon", // nextIcon
                    left: "leftSelector" // prevIcon 
                }
            },
            {
                name: "1",
                handlers: {
                    tap: "sendMessage", // sendMessage 
                    // long: "toggleMenu", // toggleMenu
                    up: "upSelector", // sendEmoji
                    down: "downSelector", // undoEmoji
                    right: "nextIcon", // nextIcon
                    left: "leftSelector" // prevIcon 
                }
            },
            {
                name: "2",
                handlers: {
                    tap: "sendMessage", // sendMessage 
                    // long: "toggleMenu", // toggleMenu
                    up: "upSelector", // sendEmoji
                    down: "downSelector", // undoEmoji
                    right: "nextIcon", // nextIcon
                    left: "toggleMenu" // prevIcon 
                }
            },
            {
                name: "3",
                handlers: {
                    tap: "tapSelector", // sendMessage 
                    // long: "toggleMenu", // toggleMenu
                    up: "upSelector", // sendEmoji
                    down: "downSelector", // undoEmoji
                    right: "rightSelector", // nextIcon
                    left: "leftSelector" // prevIcon 
                }
            },
            {
                name: "4",
                handlers: {
                    tap: "tapSelector", // sendMessage 
                    long: "toggleMenu", // toggleMenu
                    up: "upSelector", // sendEmoji
                    down: "downSelector", // undoEmoji
                    right: "nextIcon", // nextIcon
                    left: "eraseLine" // prevIcon 
                }
            },
            {
                name: "5",
                handlers: {
                    tap: "toggleMenu", // toggleMenu
                    long: "sendMessage", // sendMessage
                    up: "sendEmoji", // sendEmoji
                    down: "undoEmoji", // undoEmoji
                    right: "nextIcon", // nextIcon
                    left: "nextCategory" // prevIcon
                }
            },
            {
                name: "6",
                handlers: {
                    tap: "toggleMenu", // toggleMenu
                    long: "sendMessage", // sendMessage
                    up: "upSelector", // sendEmoji
                    down: "downSelector", // undoEmoji
                    right: "nextIcon", // nextIcon
                    left: "prevIcon" // prevIcon
                }
            }
        ];

    }
    tapContext() {
        if (this.message.length > 0) this.sendMessage()
        else this.toggleMenu()
    }
    switchGestureScheme() {
        const i = this.gestureSchemes.indexOf(this.currentScheme);
        this.currentScheme = this.gestureSchemes[(i + 1) % this.gestureSchemes.length];
        // console.log("Gesture scheme switch:", this.currentScheme);
        this.updateHelper(this.currentScheme)
    }
    performGesture(gestureName) {
        const action = this.currentScheme.handlers[gestureName];
        if (!action) return;
        this[action]();
    }
    updateHelper(scheme) {
        // var 1
        // const text = []
        // for (const key in scheme.handlers) {
        //     const line = `${key} : ${scheme.handlers[key]}\n`
        //     text.push(line)
        // }
        // var 2
        if (!scheme || !scheme.handlers) return
        const text = Object.entries(scheme.handlers)
            .map(([k, v]) => `${k} : ${v}`)
            .join('\n');

        this.helper.text.setText(`\n${text}\n \nname : ${scheme.name}`)
    }

}
// таймер-часики
EmoChat.Timer = class {
    constructor(scene, x, y, radius = 15, color = 0xff4444) {
        this.scene = scene;
        this.radius = radius;
        this.duration = 5000;   // по умолчанию 5 сек
        this.startTime = 0;
        this.active = false;
        this.onComplete = null;

        this.container = scene.add.container(x, y).setDepth(999);

        // кольцо
        const ring = scene.add.graphics();
        ring.lineStyle(2, color, 1);
        ring.strokeCircle(0, 0, radius - 2);

        // стрелка (от центра вверх)
        const hand = scene.add.graphics();
        hand.lineStyle(2, color, 1);
        hand.lineBetween(0, 0, 0, -(radius - 5));

        this.container.add([ring, hand]);
        this.hand = hand;
        this.container.setVisible(true);
        this.container.setDepth(999)
    }

    start(duration, onComplete) {
        this.container.setVisible(true);
        this.container.rotation = 0;

        this.scene.tweens.add({
            targets: this.container,
            rotation: Math.PI * 2,
            duration: duration,
            ease: 'Linear',
            onComplete: () => {
                this.container.setVisible(false);
                if (onComplete) onComplete();
            }
        });
    }

    stop() {
        this.active = false;
        this.container.setVisible(false);
    }
}
