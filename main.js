import Game from "./scenes/game.js";

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  zoom: 1.5,
  scale: {
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  parent: "game-container",
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [Game],
};

const game = new Phaser.Game(config);
