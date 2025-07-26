class PuzzleAndPinballGame {
    constructor() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameRunning = false;
        this.puzzleTimer = 30;
        this.puzzleInterval = null;
        this.currentGame = 'puzzle'; // 'puzzle' or 'pinball'
        
        // Pinball variables
        this.ball = {
            x: 0,
            y: 0,
            currentLane: 0,
            currentPath: 0,
            isMoving: false
        };
        
        // Path durations (1-3 seconds each, randomized)
        this.pathDurations = [
            [1.2, 2.8, 1.5, 2.1], // Lane 0
            [2.3, 1.7, 2.9, 1.4], // Lane 1
            [1.8, 2.4, 1.6, 2.7], // Lane 2
            [2.5, 1.9, 2.2, 1.3], // Lane 3
            [1.4, 2.6, 1.8, 2.3], // Lane 4
            [2.1, 1.5, 2.8, 1.7], // Lane 5
            [1.6, 2.2, 1.9, 2.4], // Lane 6
            [2.7, 1.3, 2.5, 1.8]  // Lane 7
        ];
        
        this.pinballRunning = false;
        this.pinballInterval = null;
        this.currentPathStartTime = 0;
        this.selectedPaths = [];
        
        // Puzzle variables
        this.puzzleSize = 4;
        this.puzzleNumbers = [];
        this.selectedNumbers = [];
        this.targetSum = 0;
        this.puzzleSolved = false;
        
        this.initializeGame();
    }
    
    initializeGame() {
        this.setupEventListeners();
        this.setupToggle();
        this.startPinball();
        this.generateNewPuzzle();
        this.updateUI();
        this.gameRunning = true;
    }
    
    setupEventListeners() {
        // Pinball controls
        const pinballContainer = document.querySelector('.pinball-container');
        pinballContainer.addEventListener('click', () => this.launchBall());
        
        // Puzzle controls
        document.getElementById('new-puzzle-btn').addEventListener('click', () => this.generateNewPuzzle());
        document.getElementById('hint-btn').addEventListener('click', () => this.showHint());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }
    
    setupToggle() {
        const toggleBtn = document.getElementById('toggle-btn');
        const pinballSection = document.getElementById('pinball-section');
        const puzzleSection = document.getElementById('puzzle-section');
        
        toggleBtn.addEventListener('click', () => {
            if (this.currentGame === 'puzzle') {
                // Switch to pinball
                this.currentGame = 'pinball';
                toggleBtn.textContent = 'Switch to Puzzle';
                pinballSection.classList.remove('hidden');
                puzzleSection.classList.add('hidden');
            } else {
                // Switch to puzzle
                this.currentGame = 'puzzle';
                toggleBtn.textContent = 'Switch to Pinball';
                puzzleSection.classList.remove('hidden');
                pinballSection.classList.add('hidden');
            }
        });
        
        // Start with puzzle visible
        pinballSection.classList.add('hidden');
    }
    
    handleKeyPress(e) {
        if (!this.gameRunning) return;
        
        switch(e.key) {
            case ' ':
                e.preventDefault();
                this.launchBall();
                break;
        }
    }
    
    launchBall() {
        if (this.pinballRunning) return;
        
        this.pinballRunning = true;
        this.ball.isMoving = true;
        this.ball.currentLane = 0;
        this.ball.currentPath = 0;
        this.selectedPaths = [];
        this.startBallMovement();
    }
    
    startBallMovement() {
        if (!this.pinballRunning) return;
        
        this.currentPathStartTime = Date.now();
        this.moveBallToPath(this.ball.currentLane, this.ball.currentPath);
        this.pinballInterval = setInterval(() => this.updatePinball(), 16);
    }
    
    moveBallToPath(lane, path) {
        const ballElement = document.getElementById('ball');
        const container = document.querySelector('.pinball-container');
        const rect = container.getBoundingClientRect();
        
        // Calculate ball position based on lane and path
        const laneHeight = 50; // Height of each lane
        const pathWidth = rect.width / 4; // Width of each path
        
        this.ball.x = path * pathWidth + pathWidth / 2;
        this.ball.y = 20 + lane * laneHeight + laneHeight / 2; // 20px offset for first lane
        
        ballElement.style.left = this.ball.x + 'px';
        ballElement.style.top = this.ball.y + 'px';
        
        // Highlight current path
        this.highlightPath(lane, path);
    }
    
    highlightPath(lane, path) {
        // Remove previous highlights
        document.querySelectorAll('.pinball-path').forEach(p => p.classList.remove('active'));
        
        // Highlight current path
        const currentPath = document.querySelector(`[data-lane="${lane}"][data-path="${path}"]`);
        if (currentPath) {
            currentPath.classList.add('active');
        }
    }
    
    updatePinball() {
        if (!this.pinballRunning) return;
        
        const currentTime = Date.now();
        const elapsedTime = (currentTime - this.currentPathStartTime) / 1000;
        const currentDuration = this.pathDurations[this.ball.currentLane][this.ball.currentPath];
        
        if (elapsedTime >= currentDuration) {
            // Move to next path
            this.selectedPaths.push({
                lane: this.ball.currentLane,
                path: this.ball.currentPath,
                duration: currentDuration
            });
            
            this.ball.currentPath++;
            
            if (this.ball.currentPath >= 4) {
                // Move to next lane
                this.ball.currentLane++;
                this.ball.currentPath = 0;
                
                if (this.ball.currentLane >= 8) {
                    // Ball completed all 8 lanes
                    this.completePinballRun();
                    return;
                }
            }
            
            // Start next path
            this.currentPathStartTime = currentTime;
            this.moveBallToPath(this.ball.currentLane, this.ball.currentPath);
        }
    }
    
    completePinballRun() {
        this.pinballRunning = false;
        this.ball.isMoving = false;
        
        if (this.pinballInterval) {
            clearInterval(this.pinballInterval);
            this.pinballInterval = null;
        }
        
        // Calculate score based on selected paths
        const totalTime = this.selectedPaths.reduce((sum, path) => sum + path.duration, 0);
        const score = Math.floor(totalTime * 10); // 10 points per second
        this.addScore(score);
        
        // Reset ball position
        this.resetBall();
        
        // Clear highlights
        document.querySelectorAll('.pinball-path').forEach(p => p.classList.remove('active'));
    }
    
    resetBall() {
        const ballElement = document.getElementById('ball');
        ballElement.style.left = '0px';
        ballElement.style.top = '20px';
        
        this.ball.x = 0;
        this.ball.y = 20;
        this.ball.currentLane = 0;
        this.ball.currentPath = 0;
        this.selectedPaths = [];
    }
    
    loseLife() {
        this.lives--;
        this.updateUI();
        
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    
    addScore(points) {
        this.score += points;
        this.updateUI();
        
        // Level up every 100 points
        if (this.score >= this.level * 100) {
            this.levelUp();
        }
    }
    
    levelUp() {
        this.level++;
        this.updateUI();
        
        // Increase path durations for higher difficulty
        this.pathDurations.forEach(lane => {
            lane.forEach((duration, index) => {
                lane[index] = Math.min(duration * 0.9, 3); // Speed up paths but cap at 3 seconds
            });
        });
    }
    
    generateNewPuzzle() {
        this.puzzleNumbers = [];
        this.selectedNumbers = [];
        this.puzzleSolved = false;
        
        // Generate random numbers for puzzle
        for (let i = 0; i < this.puzzleSize * this.puzzleSize; i++) {
            this.puzzleNumbers.push(Math.floor(Math.random() * 20) + 1);
        }
        
        // Set target sum (sum of 3 random numbers)
        const randomIndices = [];
        while (randomIndices.length < 3) {
            const index = Math.floor(Math.random() * this.puzzleNumbers.length);
            if (!randomIndices.includes(index)) {
                randomIndices.push(index);
            }
        }
        
        this.targetSum = randomIndices.reduce((sum, index) => sum + this.puzzleNumbers[index], 0);
        
        this.renderPuzzle();
        this.startPuzzleTimer();
    }
    
    renderPuzzle() {
        const puzzleGrid = document.getElementById('puzzle-grid');
        puzzleGrid.innerHTML = '';
        
        this.puzzleNumbers.forEach((number, index) => {
            const tile = document.createElement('div');
            tile.className = 'puzzle-tile';
            tile.textContent = number;
            tile.dataset.index = index;
            tile.addEventListener('click', () => this.selectTile(index));
            puzzleGrid.appendChild(tile);
        });
        
        // Update target display
        const puzzleHeader = document.querySelector('.puzzle-header h3');
        puzzleHeader.textContent = `Find numbers that sum to ${this.targetSum}`;
    }
    
    selectTile(index) {
        if (this.puzzleSolved || !this.gameRunning) return;
        
        const tile = document.querySelector(`[data-index="${index}"]`);
        const number = this.puzzleNumbers[index];
        
        if (this.selectedNumbers.includes(index)) {
            // Deselect tile
            this.selectedNumbers = this.selectedNumbers.filter(i => i !== index);
            tile.classList.remove('selected');
        } else {
            // Select tile
            this.selectedNumbers.push(index);
            tile.classList.add('selected');
            
            // Check if we have 3 numbers selected
            if (this.selectedNumbers.length === 3) {
                this.checkPuzzleSolution();
            }
        }
    }
    
    checkPuzzleSolution() {
        const selectedSum = this.selectedNumbers.reduce((sum, index) => sum + this.puzzleNumbers[index], 0);
        
        if (selectedSum === this.targetSum) {
            this.puzzleSolved = true;
            this.addScore(50);
            this.showCorrectPuzzle();
            setTimeout(() => {
                this.generateNewPuzzle();
            }, 1500);
        } else {
            this.showWrongPuzzle();
            setTimeout(() => {
                this.clearPuzzleSelection();
            }, 1000);
        }
    }
    
    showCorrectPuzzle() {
        this.selectedNumbers.forEach(index => {
            const tile = document.querySelector(`[data-index="${index}"]`);
            tile.classList.remove('selected');
            tile.classList.add('correct');
        });
    }
    
    showWrongPuzzle() {
        this.selectedNumbers.forEach(index => {
            const tile = document.querySelector(`[data-index="${index}"]`);
            tile.classList.remove('selected');
            tile.classList.add('wrong');
        });
    }
    
    clearPuzzleSelection() {
        this.selectedNumbers = [];
        document.querySelectorAll('.puzzle-tile').forEach(tile => {
            tile.classList.remove('selected', 'correct', 'wrong');
        });
    }
    
    showHint() {
        if (this.puzzleSolved || !this.gameRunning) return;
        
        // Find a valid combination
        for (let i = 0; i < this.puzzleNumbers.length - 2; i++) {
            for (let j = i + 1; j < this.puzzleNumbers.length - 1; j++) {
                for (let k = j + 1; k < this.puzzleNumbers.length; k++) {
                    if (this.puzzleNumbers[i] + this.puzzleNumbers[j] + this.puzzleNumbers[k] === this.targetSum) {
                        // Highlight the hint
                        const tiles = document.querySelectorAll('.puzzle-tile');
                        tiles[i].style.border = '3px solid #ed8936';
                        tiles[j].style.border = '3px solid #ed8936';
                        tiles[k].style.border = '3px solid #ed8936';
                        
                        setTimeout(() => {
                            tiles.forEach(tile => tile.style.border = '');
                        }, 2000);
                        
                        return;
                    }
                }
            }
        }
    }
    
    startPuzzleTimer() {
        this.puzzleTimer = 30;
        this.updatePuzzleTimer();
        
        if (this.puzzleInterval) {
            clearInterval(this.puzzleInterval);
        }
        
        this.puzzleInterval = setInterval(() => {
            this.puzzleTimer--;
            this.updatePuzzleTimer();
            
            if (this.puzzleTimer <= 0) {
                this.loseLife();
                this.generateNewPuzzle();
            }
        }, 1000);
    }
    
    updatePuzzleTimer() {
        document.getElementById('puzzle-timer').textContent = this.puzzleTimer;
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
    }
    
    gameOver() {
        this.gameRunning = false;
        
        if (this.pinballInterval) {
            clearInterval(this.pinballInterval);
        }
        
        if (this.puzzleInterval) {
            clearInterval(this.puzzleInterval);
        }
        
        const overlay = document.getElementById('game-overlay');
        const title = document.getElementById('overlay-title');
        const message = document.getElementById('overlay-message');
        
        title.textContent = 'Game Over!';
        message.textContent = `Final Score: ${this.score}`;
        overlay.style.display = 'flex';
    }
    
    restartGame() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameRunning = true;
        
        // Reset ball
        this.resetBall();
        
        // Generate new puzzle
        this.generateNewPuzzle();
        
        // Hide overlay
        document.getElementById('game-overlay').style.display = 'none';
        
        // Update UI
        this.updateUI();
    }
    
    startPinball() {
        this.resetBall();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PuzzleAndPinballGame();
}); 