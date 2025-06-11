const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Função para redimensionar o canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Atualizar o tamanho da nave e das bolas com base no tamanho da tela
    spaceship.width = canvas.width * 0.08; // Nave terá 8% da largura da tela
    spaceship.height = spaceship.width; // Nave é quadrada
    spaceship.y = canvas.height - spaceship.height - 10; // Posicionar a nave no fundo
    ballRadius = canvas.width * 0.02; // Bolas terão 2% da largura da tela
}

window.addEventListener('resize', resizeCanvas);

const backgroundImage = new Image();
backgroundImage.src = 'https://i.imgur.com/SqIKKJL.jpg';

const spaceshipImg = new Image();
spaceshipImg.src = 'https://i.imgur.com/NSEgWxm.png';

let spaceship = {
    x: canvas.width / 2 - 45,
    y: canvas.height - 90,
    width: 90,
    height: 90,
};

let bullets = [];
let answers = [];
let score = 0;
let question = {};
let messageTimeout;
let ballRadius = 30; // Tamanho inicial das bolas

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    spaceship.x = e.clientX - rect.left - spaceship.width / 2;
});

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
        shootBullet();
    }
});

function shootBullet() {
    bullets.push({
        x: spaceship.x + spaceship.width / 2 - 2.5,
        y: spaceship.y,
        width: 5,
        height: 10,
        speed: 10 // Aumentar a velocidade do tiro
    });
}

function generateQuestion() {
    const a = Math.floor(Math.random() * 11);
    const b = Math.floor(Math.random() * 11);
    const correctAnswer = a * b;
    let wrongAnswers = new Set();

    while (wrongAnswers.size < 2) { // Ensure two wrong answers
        const wrongAnswer = correctAnswer + Math.floor(Math.random() * 20) - 10;
        if (wrongAnswer >= 0 && wrongAnswer !== correctAnswer) {
            wrongAnswers.add(wrongAnswer);
        }
    }

    question = {
        a,
        b,
        correctAnswer
    };

    wrongAnswers = Array.from(wrongAnswers);

    const allAnswers = [
        { value: correctAnswer, x: Math.random() * (canvas.width - ballRadius * 2), y: 0 },
        { value: wrongAnswers[0], x: Math.random() * (canvas.width - ballRadius * 2), y: 0 },
        { value: wrongAnswers[1], x: Math.random() * (canvas.width - ballRadius * 2), y: 0 }
    ];

    // Ensure answers don't overlap
    allAnswers.forEach((answer, index) => {
        for (let i = 0; i < allAnswers.length; i++) {
            if (i !== index && Math.abs(answer.x - allAnswers[i].x) < ballRadius * 2) {
                answer.x = Math.random() * (canvas.width - ballRadius * 2);
                i = -1; // Restart the loop to recheck positions
            }
        }
    });

    answers = allAnswers;

    document.getElementById('question').textContent = `${a} x ${b} = ?`;
}

function showMessage(message, color) {
    const messageContainer = document.getElementById('message');
    messageContainer.textContent = message;
    messageContainer.style.color = color;
    messageContainer.style.display = 'block';
    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => {
        messageContainer.style.display = 'none';
    }, 2000);
}

function showExplosion() {
    showMessage('EXPLOSÃO!', '#ff0000');
}

function showSuccess() {
    showMessage('PARABÉNS VOCÊ ACERTOU!', '#00ff00');
}

function drawAnswer(answer) {
    const gradient = ctx.createRadialGradient(
        answer.x + ballRadius, answer.y + ballRadius, 10,
        answer.x + ballRadius, answer.y + ballRadius, ballRadius
    );
    gradient.addColorStop(0, '#FFA07A');
    gradient.addColorStop(1, '#FF4500');

    ctx.beginPath();
    ctx.arc(answer.x + ballRadius, answer.y + ballRadius, ballRadius, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.fillStyle = '#ffffff'; // Text color white
    ctx.font = `${ballRadius}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(answer.value, answer.x + ballRadius, answer.y + ballRadius);
}

function isColliding(bullet, answer) {
    const distX = bullet.x + bullet.width / 2 - (answer.x + ballRadius);
    const distY = bullet.y + bullet.height / 2 - (answer.y + ballRadius);
    const distance = Math.sqrt(distX * distX + distY * distY);

    return distance < ballRadius + bullet.width / 2;
}

function updateGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (backgroundImage.complete && backgroundImage.naturalHeight !== 0) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height); // Draw background image
    }
    if (spaceshipImg.complete && spaceshipImg.naturalHeight !== 0) {
        ctx.drawImage(spaceshipImg, spaceship.x, spaceship.y, spaceship.width, spaceship.height);
    }

    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        ctx.fillStyle = '#fff'; // Bullet color white
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

        if (bullet.y < 0) bullets.splice(index, 1);
    });

    answers.forEach((answer, index) => {
        answer.y += 1.3; // Reduzir a velocidade de queda das bolas
        drawAnswer(answer);

        if (answer.y > canvas.height) {
            answer.y = 0; // Reset position if it goes off screen
        }
    });

    bullets.forEach((bullet, bIndex) => {
        answers.forEach((answer, aIndex) => {
            if (isColliding(bullet, answer)) {
                if (answer.value === question.correctAnswer) {
                    score += 10; // Add 10 points for correct answer
                    document.getElementById('score').textContent = score;
                    showSuccess();
                    generateQuestion();
                } else {
                    score -= 5; // Subtract 5 points for wrong answer
                    document.getElementById('score').textContent = score;
                    showExplosion();
                    answers.forEach(ans => ans.y = 0); // Reset all answers
                }
                bullets.splice(bIndex, 1);
            }
        });
    });

    requestAnimationFrame(updateGame);
}

// Garantir que o jogo só inicie após as imagens serem carregadas
let imagesLoaded = 0;

function checkImagesLoaded() {
    imagesLoaded++;
    if (imagesLoaded === 2) {
        resizeCanvas();
        generateQuestion();
        updateGame();
    }
}

backgroundImage.onload = checkImagesLoaded;
spaceshipImg.onload = checkImagesLoaded;

window.onload = () => {
    canvas.focus();
};
