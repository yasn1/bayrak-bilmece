const GAME_TIME = 100_000;
const QUESTION_TIME = 10_000;
const colors = ['btn-red', 'btn-blue', 'btn-green', 'btn-orange', 'btn-purple'];
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');
const usernameInput = document.getElementById('username-input');
const gameC = document.getElementById('game-container');
const totalBar = document.getElementById('total-bar');
const questionBar = document.getElementById('question-bar');
const flagImg = document.getElementById('flag-img');
const choicesDiv = document.getElementById('choices');
const nextBtn = document.getElementById('next-btn');
const scoreBoard = document.getElementById('score-board');
const finalScore = document.getElementById('final-score');
const boardList = document.getElementById('board-list');
let sessionId, gameTimer, questionTimer;
const socket = io();
startBtn.onclick = () => {
    const username = usernameInput.value.trim();
    if (!username) return;
    socket.emit('startGame', { username });
};
socket.on('error', data => {
    alert(data);
})

socket.on('gameStarted', data => {
    sessionId = data.sessionId;
    overlay.style.display = 'none';
    gameC.style.display = 'block';
    startTotalTimer();
    socket.emit('getNextQuestion');
});

socket.on('question', data => {
    resetQuestionUI();
    flagImg.src = data.flag;

    data.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = `choice-btn ${colors[i]}`;
        btn.textContent = opt.name;
        btn.dataset.index = i;
        btn.onclick = () => {
            clearInterval(questionTimer);
            disableChoices();
            socket.emit('answer', { sessionId, choiceId: i });
        };
        choicesDiv.append(btn);
    });
    startQuestionTimer();
});

socket.on('answerResult', data => {
    const btns = Array.from(document.querySelectorAll('.choice-btn'));
    const { correctChoice, choiceId, correct } = data;

    btns.forEach((btn, idx) => {
        btn.disabled = true;
        if (idx === correctChoice) {
            btn.className = 'choice-btn correct';
        }
        else if (idx === choiceId && !correct) {
            btn.className = 'choice-btn incorrect';
        }
        else {
            btn.className = 'choice-btn btn-secondary';
        }
    });

    nextBtn.disabled = false;
});


nextBtn.onclick = () => {
    nextBtn.disabled = true;
    choicesDiv.innerHTML = '';
    socket.emit('getNextQuestion');
};

socket.on('gameOver', data => {
    clearInterval(gameTimer);
    resetQuestionUI();
    [...gameC.children].forEach(el => el.style.display = 'none');
    scoreBoard.style.display = 'block';
    finalScore.textContent = data.score;
    boardList.innerHTML = '';
    data.leaderboard.forEach((item, idx) => {
        const li = document.createElement('li');
        const rank = idx + 1;
        li.classList.add(`rank-${rank}`);

        li.innerHTML = `
      <span class="rank">${rank}</span>
      <span class="name">${item.name}</span>
      <span class="score">${item.score}</span>
    `;
        boardList.append(li);
    });
});
function startTotalTimer() {
    const start = Date.now();
    gameTimer = setInterval(() => {
        const pct = Math.max(0, 1 - (Date.now() - start) / GAME_TIME) * 100;
        totalBar.style.width = pct + '%';
        if (pct <= 0) clearInterval(gameTimer);
    }, 100);
}
function startQuestionTimer() {
    const start = Date.now();
    questionBar.style.width = '100%';
    questionTimer = setInterval(() => {
        const pct = Math.max(0, 1 - (Date.now() - start) / QUESTION_TIME) * 100;
        questionBar.style.width = pct + '%';
        if (pct <= 0) {
            clearInterval(questionTimer);
            disableChoices();
            nextBtn.disabled = false;
        }
    }, 50);
}

function disableChoices() {
    document.querySelectorAll('.choice-btn')
        .forEach(b => b.disabled = true);
}
function resetQuestionUI() {
    clearInterval(questionTimer);
    questionBar.style.width = '100%';
    choicesDiv.innerHTML = '';
    nextBtn.disabled = true;
}