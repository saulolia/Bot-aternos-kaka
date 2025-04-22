const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const { GoalNear } = goals;
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mcData = require('minecraft-data');  // Movido para fora da função

const nicks = ['Junin1', 'Carlin2', 'Pedrin3'];
let currentNickIndex = 0;
let bot;
let moveCount = 0;
let messageInterval;

const mensagensSozinho = [
  'cade meus amigos...',
  'tá tão quieto aqui...',
  'alguém vem jogar cmg?',
  'to sozinho :(',
  'voltemmm',
  'esperando vcs...',
  'e se eu sumir?',
  'mais um dia solitário...',
  'quem tá on?',
  'só eu no server...'
];

function createBot() {
  bot = mineflayer.createBot({
    host: 'mapatest97.aternos.me',
    port: 18180,
    username: nicks[currentNickIndex],
    version: '1.16.5'
  });

  bot.loadPlugin(pathfinder);

  bot.on('spawn', () => {
    console.log(`Logado como ${bot.username}`);
    bot.chat('/pardon Junin1');
    bot.chat('/pardon Carlin2');
    bot.chat('/pardon Pedrin3');
    moveCount = 0;
    startMoving();
    checkIfAlone();
    io.emit('status', `${bot.username} online`);
  });

  bot.on('end', () => {
    clearTimeout(messageInterval);
    console.log(`Bot desconectado. Tentando com outro nick...`);
    io.emit('status', `${bot.username} desconectado`);
    currentNickIndex = (currentNickIndex + 1) % nicks.length;
    setTimeout(createBot, 5000);
  });

  bot.on('kicked', (reason) => {
    console.log(`Kicado: ${reason}`);
    bot.end();
  });

  bot.on('error', (err) => {
    console.log(`Erro: ${err}`);
  });
}

function startMoving() {
  try {
    const defaultMove = new Movements(bot, mcData(bot.version));  // Passando mcData aqui
    bot.pathfinder.setMovements(defaultMove);

    moveRandomly();
  } catch (error) {
    console.error("Erro ao carregar minecraft-data:", error);
  }
}

function moveRandomly() {
  if (moveCount >= 15) {
    bot.chat('/kill');
    return;
  }

  const start = bot.entity.position;

  const dir1 = Math.random() * 2 * Math.PI;
  const x1 = start.x + Math.cos(dir1) * 1000;
  const z1 = start.z + Math.sin(dir1) * 1000;
  const y1 = start.y;

  bot.pathfinder.setGoal(new GoalNear(x1, y1, z1, 1));

  setTimeout(() => {
    bot.look(Math.random() * 2 * Math.PI, 0, true, () => {
      const dir2 = Math.random() * 2 * Math.PI;
      const x2 = bot.entity.position.x + Math.cos(dir2) * 1000;
      const z2 = bot.entity.position.z + Math.sin(dir2) * 1000;
      const y2 = bot.entity.position.y;

      bot.pathfinder.setGoal(new GoalNear(x2, y2, z2, 1));

      setTimeout(() => {
        moveCount++;
        moveRandomly();
      }, 20000);
    });
  }, 20000);
}

function checkIfAlone() {
  const players = Object.keys(bot.players).filter(name => name !== bot.username);
  if (players.length === 0) {
    const msg = mensagensSozinho[Math.floor(Math.random() * mensagensSozinho.length)];
    bot.chat(msg);
  }

  const nextCheck = 5 * 60 * 1000 + Math.random() * (3 * 60 * 1000);
  messageInterval = setTimeout(checkIfAlone, nextCheck);
}

// Servidor web
app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('Web conectado');
});

http.listen(3000, () => {
  console.log('Site no ar em http://localhost:3000');
});

createBot();
