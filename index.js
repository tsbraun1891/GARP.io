/*jshint esversion: 6 */
const path = require('path');
const jsdom = require('jsdom');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io').listen(server);
const uniqid = require('uniqid');
const Datauri = require('datauri');

const datauri = new Datauri();
const { JSDOM } = jsdom;

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

var instances = {};

function setupAuthoritativePhaser(roomName) {
    JSDOM.fromFile(path.join(__dirname, 'server/index.html'), {
        // To run the scripts in the html file
        runScripts: "dangerously",
        // Also load supported external resources
        resources: "usable",
        // So requestAnimatinFrame events fire
        pretendToBeVisual: true
    }).then((dom) => {
        dom.window.URL.createObjectURL = (blob) => {
            if (blob) {
                return datauri.format(blob.type, blob[Object.getOwnPropertySymbols(blob)[0]]._buffer).content;
            }
        };
        dom.window.URL.revokeObjectURL = (objectURL) => { };
        dom.window.gameLoaded = (game) => {
            instances[roomName] = game;
            console.log(Object.keys(instances));
        };
        // inject socketIO into the Phaser instance
        dom.window.io = io;
        // send the uniq room name to the Phaser instance
        dom.window.roomName = roomName;
    }).catch((error) => {
        console.log(error.message);
    });
}

// create two hard-coded test rooms with unique names
var name1 = uniqid("room-");
setupAuthoritativePhaser(name1);
var name2 = uniqid("room-");
setupAuthoritativePhaser(name2);
// test counter
var counter = 0;

io.on('connection', function (socket) {
    let roomName;

    // simulate multi room joinging
    if (counter < 2) {
        roomName = name1;
        counter += 1;
    } else {
        roomName = name2;
    }
    let game = instances[roomName];
    socket.join(roomName);
    console.log('a user connected to room: ' + roomName);
    // create a new player and add it to our clients object
    game.clients[socket.id] = {
        rotation: 0,
        x: Math.floor(Math.random() * 700) + 50,
        y: Math.floor(Math.random() * 500) + 50,
        playerId: socket.id,
        team: (Math.floor(Math.random() * 2) == 0) ? 'red' : 'blue',
        input: {
            left: false,
            right: false,
            up: false
        }
    };
    // add player to server
    game.addPlayer(game, socket.id);
    // send the clients object to the new player
    socket.emit('currentPlayers', game.clients);
    // update all other players of the new player
    socket.broadcast.to(roomName).emit('newPlayer', game.clients[socket.id]);
    // send the star object to the new player
    socket.emit('starLocation', { x: game.star.x, y: game.star.y });
    // send the current scores
    socket.emit('updateScore', game.scores);

    socket.on('disconnect', function () {
        console.log('user disconnected');
        // remove player from server
        game.removePlayer(game, socket.id);
        // remove this player from our players object
        delete game.clients[socket.id];
        // emit a message to all players to remove this player
        io.emit('disconnect', socket.id);
    });

    // when a player moves, update the player data
    socket.on('playerInput', function (inputData) {
        game.handlePlayerInput(game, socket.id, inputData);
    });
});

server.listen(8082, function () {
    server.clientUpdateRate = 1000 / 15; // Rate at which update packets are sent
    //server.setUpdateLoop();
    console.log(`Listening on ${server.address().port}`);
    console.log(`Address should be: http://localhost:${server.address().port}`);
});

server.sendUpdate = () => {

    // For every dungeon, for each baddie in that dungeon, find the player that the baddie is closest to
    // TODO: Only change this on player move rather than in sendUpdate
    Object.keys(package.dungeons).forEach(roomName => {

        io.to(roomName).emit('update', package.dungeons[roomName]);
    });
};