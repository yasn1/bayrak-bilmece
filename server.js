const path = require('path');
const Game = require('./game.js');
const game = new Game();
const port = 3540;

const Db = require("oxzof-nosql");
const db = new Db();

const express = require('express');
const app = express();

const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const colors = require('colors');
colors.enable();

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const sessions = new Map();
const GAME_TIME_LIMIT     = 100_000;
const QUESTION_TIME_LIMIT =  10_000; 

io.on('connection', socket => {
  let gameTimer = null;

  socket.on('startGame', async ({ username }) => {
    const hasName = await db.findOne('users',{name:username})
    if(hasName){
      return socket.emit('error', 'Bu isim zaten alındı!');
    }
    
    const session = {
      id: socket.id,
      username,
      score: 0,
      startAt: Date.now(),
      currentQuestion: null
    };
    sessions.set(socket.id, session);

    gameTimer = setTimeout(() => endGame(), GAME_TIME_LIMIT);

    socket.emit('gameStarted', {
      sessionId:    socket.id,
      gameTime:     GAME_TIME_LIMIT,
      questionTime: QUESTION_TIME_LIMIT
    });
  });

  socket.on('getNextQuestion', () => {
    const session = sessions.get(socket.id);
    if (!session) return;

    const qData = game.new();
    const options = [...qData.choices, qData.country]
      .sort(() => Math.random() - 0.5);
    const correctIdx = options.findIndex(o => o.code === qData.country.code);

    session.currentQuestion = {
      options,
      correctIdx,
      sentAt: Date.now()
    };

    socket.emit('question', {
      flag:         qData.country.flag,
      options:      options.map(o => ({ name: o.name })),
      questionTime: QUESTION_TIME_LIMIT
    });
  });

  socket.on('answer', ({ sessionId, choiceId }) => {
    const session = sessions.get(sessionId);
    if (!session) return socket.emit('error', 'Geçersiz session');

    if (Date.now() - session.startAt > GAME_TIME_LIMIT) {
      return socket.emit('gameOver', { score: session.score });
    }

    const elapsedQ = Date.now() - session.currentQuestion.sentAt;
    const isCorrect = choiceId === session.currentQuestion.correctIdx;
    if (isCorrect) {
      session.score += 1;
    }else{
      session.score -= 0.25;
    }

    socket.emit('answerResult', {
      correct:       isCorrect,
      correctChoice: session.currentQuestion.correctIdx,
      choiceId,
      score:         session.score
    });
  });

  async function endGame() {
    const session = sessions.get(socket.id);
    if (!session) return;

    const board = Array.from(sessions.values())
      .map(s => ({ name: s.username, score: s.score }))
    await db.insertOne('users',{name:board[0].name,score:board[0].score});
    const leaderboard = await db.find('users').then(data => {
      return data.sort((a, b) => b.score - a.score).slice(0, 10);
    });

    socket.emit('gameOver', {
      score:       session.score,
      leaderboard
    });

    sessions.delete(socket.id);
    clearTimeout(gameTimer);
  }

  socket.on('disconnect', () => {
    clearTimeout(gameTimer);
    sessions.delete(socket.id);
  });
});

server.listen(port, () =>
  console.log(colors.blue(`Server running on port ${port}`))
);
