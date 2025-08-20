
function callOwl() {
    // Supprimer l'ancien jeu s'il existe
    const existingOverlay = document.getElementById('gameOverlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // Créer l'overlay du jeu
    const gameOverlay = document.createElement('div');
    gameOverlay.id = 'gameOverlay';
    gameOverlay.innerHTML = `
        <div class="game-overlay" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        ">
            <div class="game-container" id="gameContainer" style="
                width: 90vw;
                max-width: 1000px;
                height: 90vh;
                max-height: 600px;
                background: linear-gradient(135deg, #4a90e2 0%, #357abd 50%, #1e3c72 100%);
                border-radius: 20px;
                position: relative;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                border: 3px solid #ffd700;
            ">
                <button class="close-btn" onclick="closeOwlGame()" style="
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: #ff6b6b;
                    color: white;
                    border: none;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 1.5rem;
                    z-index: 101;
                    transition: background 0.3s;
                ">&times;</button>
                
                <div class="game-header" style="
                    position: absolute;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0, 0, 0, 0.7);
                    color: #ffd700;
                    padding: 10px 20px;
                    border-radius: 25px;
                    text-align: center;
                    z-index: 100;
                ">
                    <h2 style="margin: 0; font-size: 1.5rem;">🦉 Livraison Magique</h2>
                    <div class="score" style="font-size: 1.2rem; margin-top: 5px;">Score: <span id="owlScore">0</span></div>
                    <div class="timer" style="font-size: 1rem; color: #ff6b6b; margin-top: 5px;">Temps: <span id="owlTimer">60</span>s</div>
                </div>

                <div class="clouds" id="owlClouds" style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                "></div>

                <div class="owl" id="gameOwl" style="
                    position: absolute;
                    width: 60px;
                    height: 60px;
                    font-size: 60px;
                    z-index: 50;
                    transition: none;
                    cursor: pointer;
                    filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    user-select: none;
                ">🦉</div>

                <div class="castle" style="
                    position: absolute;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 4rem;
                    filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
                ">🏰</div>

                <div class="instructions" style="
                    position: absolute;
                    bottom: 20px;
                    left: 20px;
                    background: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 15px;
                    border-radius: 10px;
                    font-size: 0.9rem;
                    z-index: 100;
                ">
                    <strong>Instructions:</strong><br>
                    • Déplacez le hibou avec votre souris<br>
                    • Collectez les lettres dorées<br>
                    • Livrez-les au château de Poudlard
                </div>

                <div class="game-complete" id="owlGameComplete" style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(0, 0, 0, 0.9);
                    color: #ffd700;
                    padding: 40px;
                    border-radius: 20px;
                    text-align: center;
                    z-index: 200;
                    border: 3px solid #ffd700;
                    display: none;
                ">
                    <h3 style="font-size: 2rem; margin-bottom: 20px;">🎉 Mission Accomplie !</h3>
                    <div class="final-score" style="font-size: 1.5rem; margin-bottom: 20px; color: #4ade80;">
                        Score Final: <span id="owlFinalScore">0</span>
                    </div>
                    <p>Votre message a été livré avec succès à la volière principale de Poudlard !</p>
                    <button onclick="restartOwlGame()" style="
                        background: #4ade80;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 25px;
                        cursor: pointer;
                        font-size: 1rem;
                        margin: 10px;
                        transition: background 0.3s;
                    ">Rejouer</button>
                    <button onclick="shareOwlScore()" style="
                        background: #4ade80;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 25px;
                        cursor: pointer;
                        font-size: 1rem;
                        margin: 10px;
                        transition: background 0.3s;
                    ">Partager</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(gameOverlay);

    // Initialiser le jeu avec un délai pour s'assurer que le DOM est prêt
    setTimeout(() => {
        initOwlGame();
    }, 200);
}

function closeOwlGame() {
    const overlay = document.getElementById('gameOverlay');
    if (overlay) {
        // Nettoyer les timers avant de fermer
        if (owlGame.timer) {
            clearInterval(owlGame.timer);
        }
        if (owlGame.cloudInterval) {
            clearInterval(owlGame.cloudInterval);
        }
        overlay.remove();

        // Réinitialiser l'objet jeu
        owlGame = {
            score: 0,
            timeLeft: 60,
            gameActive: false,
            deliveryPoints: [],
            timer: null,
            cloudInterval: null
        };
    }
}

let owlGame = {
    score: 0,
    timeLeft: 60,
    gameActive: false,
    deliveryPoints: [],
    timer: null,
    cloudInterval: null
};

function initOwlGame() {
    // Vérifier que tous les éléments existent
    const owl = document.getElementById('gameOwl');
    const container = document.getElementById('gameContainer');
    const scoreEl = document.getElementById('owlScore');
    const timerEl = document.getElementById('owlTimer');

    if (!owl || !container || !scoreEl || !timerEl) {
        console.error('Éléments du jeu non trouvés, réessai dans 100ms...');
        setTimeout(initOwlGame, 100);
        return;
    }

    // Réinitialiser l'état du jeu
    owlGame = {
        score: 0,
        timeLeft: 60,
        gameActive: true,
        deliveryPoints: [],
        timer: null,
        cloudInterval: null
    };

    // Position initiale du hibou
    const rect = container.getBoundingClientRect();
    owl.style.left = (rect.width / 2 - 30) + 'px';
    owl.style.top = (rect.height / 2) + 'px';
    owl.style.transform = 'rotate(0deg)';
    owl.style.animation = 'owlHover 2s ease-in-out infinite';

    // Contrôle souris et tactile avec haute fréquence
    container.addEventListener('mousemove', moveOwl, { passive: false });
    container.addEventListener('touchmove', moveOwlTouch, { passive: false });

    // Ajouter des événements pour détecter quand la souris entre/sort du jeu
    container.addEventListener('mouseenter', () => {
        if (owlGame.gameActive) {
            owl.style.animation = 'owlFlap 0.3s ease-in-out infinite';
        }
    });

    container.addEventListener('mouseleave', () => {
        if (owlGame.gameActive) {
            owl.style.animation = 'owlHover 2s ease-in-out infinite';
            owl.style.transform = 'rotate(0deg)';
        }
    });

    // Démarrer le minuteur
    startOwlTimer();

    // Créer les points de livraison
    createOwlDeliveryPoints();

    // Créer les nuages
    createOwlClouds();
}

function moveOwl(e) {
    if (!owlGame.gameActive) return;

    const owl = document.getElementById('gameOwl');
    const container = document.getElementById('gameContainer');

    if (!owl || !container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left - 30;
    const y = e.clientY - rect.top - 30;

    const maxX = rect.width - 60;
    const maxY = rect.height - 60;

    const newX = Math.max(0, Math.min(x, maxX));
    const newY = Math.max(0, Math.min(y, maxY));

    // Calcul de la vitesse pour l'animation de battement d'ailes
    const currentX = parseFloat(owl.style.left) || newX;
    const currentY = parseFloat(owl.style.top) || newY;
    const speed = Math.sqrt(Math.pow(newX - currentX, 2) + Math.pow(newY - currentY, 2));

    // Animation de battement plus ou moins rapide selon la vitesse
    if (speed > 5) {
        owl.style.animation = 'owlFlap 0.2s ease-in-out infinite';
    } else if (speed > 2) {
        owl.style.animation = 'owlFlap 0.4s ease-in-out infinite';
    } else {
        owl.style.animation = 'owlHover 2s ease-in-out infinite';
    }

    // Inclinaison du hibou selon la direction
    const deltaX = newX - currentX;
    let rotation = 0;
    if (Math.abs(deltaX) > 2) {
        rotation = Math.max(-15, Math.min(15, deltaX * 0.3));
    }

    owl.style.left = newX + 'px';
    owl.style.top = newY + 'px';
    owl.style.transform = `rotate(${rotation}deg)`;

    // Effet de traînée magique
    createOwlTrail(newX + 30, newY + 30);

    checkOwlCollisions();
}

function moveOwlTouch(e) {
    e.preventDefault();
    if (!owlGame.gameActive) return;

    const touch = e.touches[0];
    const owl = document.getElementById('gameOwl');
    const container = document.getElementById('gameContainer');

    if (!owl || !container || !touch) return;

    const rect = container.getBoundingClientRect();
    const x = touch.clientX - rect.left - 30;
    const y = touch.clientY - rect.top - 30;

    const maxX = rect.width - 60;
    const maxY = rect.height - 60;

    const newX = Math.max(0, Math.min(x, maxX));
    const newY = Math.max(0, Math.min(y, maxY));

    // Même logique d'animation que pour la souris
    const currentX = parseFloat(owl.style.left) || newX;
    const currentY = parseFloat(owl.style.top) || newY;
    const speed = Math.sqrt(Math.pow(newX - currentX, 2) + Math.pow(newY - currentY, 2));

    if (speed > 5) {
        owl.style.animation = 'owlFlap 0.2s ease-in-out infinite';
    } else if (speed > 2) {
        owl.style.animation = 'owlFlap 0.4s ease-in-out infinite';
    } else {
        owl.style.animation = 'owlHover 2s ease-in-out infinite';
    }

    const deltaX = newX - currentX;
    let rotation = 0;
    if (Math.abs(deltaX) > 2) {
        rotation = Math.max(-15, Math.min(15, deltaX * 0.3));
    }

    owl.style.left = newX + 'px';
    owl.style.top = newY + 'px';
    owl.style.transform = `rotate(${rotation}deg)`;

    createOwlTrail(newX + 30, newY + 30);

    checkOwlCollisions();
}

// Nouvelle fonction pour créer une traînée magique derrière le hibou
function createOwlTrail(x, y) {
    const container = document.getElementById('gameContainer');
    if (!container || Math.random() > 0.3) return; // Créer une traînée 30% du temps

    const trail = document.createElement('div');
    trail.innerHTML = '✨';
    trail.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        font-size: 12px;
        pointer-events: none;
        z-index: 40;
        animation: owlTrailFade 0.8s ease-out forwards;
        transform: translate(-50%, -50%);
    `;

    container.appendChild(trail);

    setTimeout(() => {
        if (trail.parentNode) {
            trail.remove();
        }
    }, 800);
}

function createOwlDeliveryPoints() {
    const emojis = ['📜', '💌', '📋', '🎯', '⭐', '💎', '🔮', '⚡'];

    for (let i = 0; i < 8; i++) {
        setTimeout(() => {
            if (owlGame.gameActive) {
                createSingleDeliveryPoint(emojis[Math.floor(Math.random() * emojis.length)]);
            }
        }, i * 3000);
    }
}

function createSingleDeliveryPoint(emoji) {
    const container = document.getElementById('gameContainer');
    if (!container) return;

    const point = document.createElement('div');
    point.className = 'delivery-point';
    point.innerHTML = emoji;
    point.style.cssText = `
        position: absolute;
        width: 80px;
        height: 80px;
        background: radial-gradient(circle, #ffd700, #ffed4e);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        border: 3px solid #ff6b6b;
        cursor: pointer;
        animation: owlPulse 2s infinite;
        transition: all 0.3s;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        z-index: 25;
    `;

    const rect = container.getBoundingClientRect();
    const x = Math.random() * (rect.width - 80);
    const y = Math.random() * (rect.height - 160) + 80;

    point.style.left = x + 'px';
    point.style.top = y + 'px';

    container.appendChild(point);
    owlGame.deliveryPoints.push(point);

    // Auto-suppression après 15 secondes
    setTimeout(() => {
        if (point.parentNode && owlGame.deliveryPoints.includes(point)) {
            point.remove();
            owlGame.deliveryPoints = owlGame.deliveryPoints.filter(p => p !== point);
        }
    }, 15000);
}

function checkOwlCollisions() {
    const owl = document.getElementById('gameOwl');
    if (!owl) return;

    const owlRect = owl.getBoundingClientRect();

    owlGame.deliveryPoints.forEach((point, index) => {
        if (!point.parentNode) return;

        const pointRect = point.getBoundingClientRect();

        if (isOwlColliding(owlRect, pointRect)) {
            collectOwlPoint(point, index);
        }
    });
}

function isOwlColliding(rect1, rect2) {
    return !(rect1.right < rect2.left ||
        rect1.left > rect2.right ||
        rect1.bottom < rect2.top ||
        rect1.top > rect2.bottom);
}

function collectOwlPoint(point, index) {
    owlGame.score += 10;
    const scoreEl = document.getElementById('owlScore');
    if (scoreEl) {
        scoreEl.textContent = owlGame.score;
    }

    // Animation de collecte
    point.style.animation = 'owlCollectEffect 0.5s ease-out forwards';

    createOwlParticles(point);
    playOwlCollectSound();

    setTimeout(() => {
        if (point.parentNode) {
            point.remove();
        }
    }, 500);

    owlGame.deliveryPoints.splice(index, 1);
}

function createOwlParticles(element) {
    const container = document.getElementById('gameContainer');
    if (!container) return;

    const rect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    for (let i = 0; i < 6; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: #ffd700;
            border-radius: 50%;
            pointer-events: none;
            animation: owlSparkle 1s ease-out forwards;
            z-index: 60;
        `;

        particle.style.left = (rect.left - containerRect.left + Math.random() * 40) + 'px';
        particle.style.top = (rect.top - containerRect.top + Math.random() * 40) + 'px';

        container.appendChild(particle);

        setTimeout(() => {
            if (particle.parentNode) {
                particle.remove();
            }
        }, 1000);
    }
}

function playOwlCollectSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        // Son non disponible, pas grave
    }
}

function createOwlClouds() {
    const container = document.getElementById('owlClouds');
    if (!container) return;

    owlGame.cloudInterval = setInterval(() => {
        if (!owlGame.gameActive) {
            clearInterval(owlGame.cloudInterval);
            return;
        }

        if (Math.random() < 0.3) {
            const cloud = document.createElement('div');
            cloud.innerHTML = '☁️';
            cloud.style.cssText = `
                position: absolute;
                color: rgba(255, 255, 255, 0.7);
                font-size: 3rem;
                animation: owlFloat ${10 + Math.random() * 10}s infinite linear;
                pointer-events: none;
                z-index: 5;
            `;
            cloud.style.top = Math.random() * 200 + 'px';

            container.appendChild(cloud);

            setTimeout(() => {
                if (cloud.parentNode) {
                    cloud.remove();
                }
            }, 20000);
        }
    }, 2000);
}

function startOwlTimer() {
    const timerEl = document.getElementById('owlTimer');
    if (!timerEl) return;

    owlGame.timer = setInterval(() => {
        owlGame.timeLeft--;
        const currentTimerEl = document.getElementById('owlTimer');
        if (currentTimerEl) {
            currentTimerEl.textContent = owlGame.timeLeft;
        }

        if (owlGame.timeLeft <= 0) {
            clearInterval(owlGame.timer);
            endOwlGame();
        }
    }, 1000);
}

function endOwlGame() {
    owlGame.gameActive = false;
    const finalScoreEl = document.getElementById('owlFinalScore');
    const gameCompleteEl = document.getElementById('owlGameComplete');

    if (finalScoreEl) {
        finalScoreEl.textContent = owlGame.score;
    }
    if (gameCompleteEl) {
        gameCompleteEl.style.display = 'block';
    }
}

function restartOwlGame() {
    // Nettoyer l'ancien jeu
    const container = document.getElementById('gameContainer');
    if (container) {
        const points = container.querySelectorAll('.delivery-point');
        const particles = container.querySelectorAll('[style*="owlSparkle"]');
        const clouds = container.querySelectorAll('#owlClouds > div');

        points.forEach(point => point.remove());
        particles.forEach(particle => particle.remove());
        clouds.forEach(cloud => cloud.remove());
    }

    // Nettoyer les timers
    if (owlGame.timer) {
        clearInterval(owlGame.timer);
    }
    if (owlGame.cloudInterval) {
        clearInterval(owlGame.cloudInterval);
    }

    // Réinitialiser l'affichage
    const gameCompleteEl = document.getElementById('owlGameComplete');
    const scoreEl = document.getElementById('owlScore');
    const timerEl = document.getElementById('owlTimer');

    if (gameCompleteEl) gameCompleteEl.style.display = 'none';
    if (scoreEl) scoreEl.textContent = '0';
    if (timerEl) timerEl.textContent = '60';

    // Redémarrer
    setTimeout(() => {
        initOwlGame();
    }, 200);
}

function shareOwlScore() {
    const finalScoreEl = document.getElementById('owlFinalScore');
    const score = finalScoreEl ? finalScoreEl.textContent : owlGame.score;
    const text = `Je viens de livrer ${score} messages par hibou à Poudlard ! 🦉✨ #HibouExpress #Poudlard`;

    if (navigator.share) {
        navigator.share({
            title: 'Livraison par Hibou',
            text: text,
            url: window.location.href
        }).catch(() => {
            // Si le partage échoue, copier dans le presse-papiers
            copyToClipboard(text);
        });
    } else {
        copyToClipboard(text);
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            alert('Score copié dans le presse-papiers !');
        }).catch(() => {
            fallbackCopyTextToClipboard(text);
        });
    } else {
        fallbackCopyTextToClipboard(text);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        document.execCommand('copy');
        alert('Score copié dans le presse-papiers !');
    } catch (err) {
        alert('Impossible de copier le score automatiquement.');
    }

    document.body.removeChild(textArea);
}

// Ajouter les animations CSS nécessaires
const owlGameStyles = document.createElement('style');
owlGameStyles.textContent = `
    @keyframes owlPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    @keyframes owlCollectEffect {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.3); opacity: 0.8; }
        100% { transform: scale(0); opacity: 0; }
    }
    
    @keyframes owlSparkle {
        0% { opacity: 1; transform: scale(1); }
        100% { opacity: 0; transform: scale(2) translateY(-20px); }
    }
    
    @keyframes owlFloat {
        from { transform: translateX(-100px); }
        to { transform: translateX(calc(100vw + 100px)); }
    }
    
    @keyframes owlFlap {
        0% { transform: scale(1) rotate(0deg); }
        25% { transform: scale(1.1) rotate(-2deg); }
        50% { transform: scale(1) rotate(0deg); }
        75% { transform: scale(1.1) rotate(2deg); }
        100% { transform: scale(1) rotate(0deg); }
    }
    
    @keyframes owlHover {
        0% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-3px) rotate(1deg); }
        100% { transform: translateY(0px) rotate(0deg); }
    }
    
    @keyframes owlTrailFade {
        0% { 
            opacity: 0.8; 
            transform: translate(-50%, -50%) scale(1); 
        }
        100% { 
            opacity: 0; 
            transform: translate(-50%, -50%) scale(2) rotate(180deg); 
        }
    }
    
    .close-btn:hover {
        background: #ff5252 !important;
    }
    
    button:hover {
        opacity: 0.9;
    }
    
    /* Curseur personnalisé pour le jeu */
    #gameContainer {
        cursor: none;
    }
    
    @media (max-width: 768px) {
        .delivery-point {
            width: 60px !important;
            height: 60px !important;
            font-size: 1.5rem !important;
        }
        
        #gameOwl {
            width: 50px !important;
            height: 50px !important;
            font-size: 50px !important;
        }
        
        .instructions {
            font-size: 0.8rem !important;
            padding: 10px !important;
        }
        
        .castle {
            font-size: 3rem !important;
        }
        
        /* Réactiver le curseur sur mobile */
        #gameContainer {
            cursor: auto;
        }
    }
`;

// N'ajouter les styles qu'une seule fois
if (!document.getElementById('owl-game-styles')) {
    owlGameStyles.id = 'owl-game-styles';
    document.head.appendChild(owlGameStyles);
}