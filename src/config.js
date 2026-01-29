import BootScene from './scenes/BootScene.js'
import PreloadScene from './scenes/PreloadScene.js'
// import MainMenuScene from './scenes/MainMenuScene.js'
import GameScene from './scenes/GameScene.js'

import RexCrtPipelinePlugin from 'phaser3-rex-plugins/plugins/crtpipeline-plugin.js';


export default {
  type: Phaser.WEBGL, // Можно AUTO, CANVAS, WEBGL
  width: 640,
  height: 1120,
  scale: {
    mode: Phaser.Scale.FIT,
    // autoCenter: Phaser.Scale.NO_CENTER,
  },
  plugins: {
    global: [
      {
        key: 'rexCrtPipeline',
        plugin: RexCrtPipelinePlugin,
        start: true
      }
    ]
  },
  // physics: {
  //   default: 'arcade',
  //   arcade: {
  //     gravity: { y: 2000 },
  //     debug: false,
  //   },
  // },
  render: {
    powerPreference: 'high-performance',
  },
  fps: {
    target: 120,
    forceSetTimeOut: true,
    smoothStep: false,
  },
  backgroundColor: 0x060b14,
  scene: [BootScene, PreloadScene, GameScene],
}
