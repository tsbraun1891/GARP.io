/* jshint esversion: 6 */
import Boot from './scenes/Boot.js';
import Preload from './scenes/Preload.js';
import MainMenu from './scenes/MainMenu.js';
import Dungeon from './scenes/Dungeon.js';
import ServerList from './scenes/ServerList.js';
import Client from './client.js';

// class Game extends Phaser.Game {
//     constructor() {
//         super(window.innerWidth, window.innerHeight, Phaser.AUTO, 'phaser-canvas');
//         /* super from the tutorial I used */
//         //super(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio, Phaser.AUTO);
//         this.state.add('Boot', Boot, false);
//         this.state.add('Preload', Preload, false);
//         this.state.add('MainMenu', MainMenu, false);
//         this.state.add('ServerList', ServerList, false);
//         this.dungeonState = this.state.add('Dungeon', Dungeon, false);
//     }
// }

var config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'phaser-canvas',
    backgroundColor: '#000',
    physics: {
        default: 'arcade',
        arcade: {
            fps: 60,
            gravity: { y: 0 }
        }
    },
    scene: [Dungeon, ServerList, MainMenu, Preload, Boot]
};

/* For storing the client and Phaser game properties */
const game = new Phaser.Game(config);
// const game = new Game();

export default game;