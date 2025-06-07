export default class Game extends Phaser.Scene {
  constructor() {
    super("game");
    this.items = null;
  }

  preload() {
    
    // Carga del mapa y los tilesets
    this.load.tilemapTiledJSON("mapa", "/public/assets/tilemap/Laberinto-Tiled.json");

    this.load.image("Bosque", "/public/assets/Bosque.png");
    this.load.image("Cerrado", "/public/assets/Cerrado.png");
    this.load.image("Gimnasio", "/public/assets/Gimnasio.png");
    this.load.image("Gimnasio 2", "/public/assets/Gimnasio 2.png");
    this.load.image("Hielo", "/public/assets/Hielo.png");
    this.load.image("Hielo 2", "/public/assets/Hielo 2.png");

    // Sprites
    this.load.image("player", "/public/assets/Jugador.png");
    this.load.image("item", "/public/assets/Item.png");
    this.load.image("victoria", "/public/assets/Victoria.png");
  }

  create() {

    // Crea el mapa
    this.map = this.make.tilemap({ key: "mapa" });

    // Añade los tilesets al mapa
    const tilesets = [
      this.map.addTilesetImage("Bosque", "Bosque"),
      this.map.addTilesetImage("Cerrado", "Cerrado"),
      this.map.addTilesetImage("Gimnasio", "Gimnasio"),
      this.map.addTilesetImage("Gimnasio 2", "Gimnasio 2"),
      this.map.addTilesetImage("Hielo", "Hielo"),
      this.map.addTilesetImage("Hielo 2", "Hielo 2"),
    ];

    // Crea las capas del mapa
    this.map.createLayer("Suelo", tilesets, 0, 0);
    this.barreras = this.map.createLayer("Barreras", tilesets, 0, 0);
    this.barreras.setCollisionByProperty({ colision: true });

    // Puntos de spawn
    const spawnPoints = this.map.getObjectLayer("Spawns")?.objects || [];
    this.spawnLocations = spawnPoints.sort((a, b) => a.name.localeCompare(b.name));
    this.currentSpawnIndex = 0;

    // Jugador
    const spawn = this.spawnLocations[this.currentSpawnIndex];
    this.player = this.physics.add.sprite(spawn.x, spawn.y, "player");
    this.player.setBounce(0.1);
    this.player.setCollideWorldBounds(true);

    // Cámara
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setZoom(3.5);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    // Teclas
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    // Inicializar ítems
    this.items = this.physics.add.group();
    this.loadItemsForCurrentLab();
    
    // Colisiones
    this.physics.add.collider(this.player, this.barreras);

    // Inicializar variables de juego
    this.gameOver = false;
  }

  // Carga los ítems del laberinto actual
  loadItemsForCurrentLab() {
    if (this.items && typeof this.items.clear === "function") {
      this.items.clear(true, true);
    }

    // Filtra los objetos de ítems según el laberinto actual
    const itemObjects = this.map.getObjectLayer("Items")?.objects || [];
    const labNumber = this.currentSpawnIndex + 1;


    // Filtra los ítems que pertenecen al laberinto actual
    const filteredItems = itemObjects.filter(obj =>
      !obj.properties || obj.properties.some(p => p.name === "lab" && p.value === labNumber)
    );

    // Crea los ítems en el grupo
    filteredItems.forEach(obj => {
      const item = this.items.create(obj.x, obj.y, "item").setOrigin(0.5, 0.5);
      item.setData("collected", false);
    });

    // Actualiza el total de ítems y los recolectados
    this.itemsTotal = this.items.getChildren().length;
    this.itemsCollected = 0;
  }

  // Avanza al siguiente laberinto
  nextLabyrinth() {
    this.currentSpawnIndex++;

    if (this.currentSpawnIndex >= this.spawnLocations.length) {
      const centerX = this.cameras.main.width / 2;
      const centerY = this.cameras.main.height / 2;

      this.add.image(centerX, centerY, "victoria")
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0);

      this.gameOver = true;

      this.time.delayedCall(10000, () => this.scene.restart()); 
      return;
    }

    const spawn = this.spawnLocations[this.currentSpawnIndex];
    this.player.setPosition(spawn.x, spawn.y);
    this.loadItemsForCurrentLab();
  }

  update() {

    // Manejo de teclas
    if (Phaser.Input.Keyboard.JustDown(this.keyR)) {
      this.scene.restart();
      return;
    }

    // Si el juego ha terminado, no se permiten más movimientos
    if (this.gameOver) {
      this.player.setVelocity(0);
      return;
    }

    // Resetea la velocidad del jugador
    this.player.setVelocity(0);

    // Movimiento del jugador
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-80);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(80);
    }

    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-80);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(80);
    }

    // Colisiones con ítems
    if (this.items) {
      this.physics.overlap(this.player, this.items, (player, item) => {
        if (!item.getData("collected")) {
          item.setData("collected", true);
          item.destroy();

          this.itemsCollected++;

          if (this.itemsCollected === this.itemsTotal) {
            this.nextLabyrinth();
          }
        }
      });
    }
  }
}
