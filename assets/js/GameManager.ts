import { _decorator, Component, Node, Label, director } from "cc";
import { PlayerController } from "./PlayerController";
import { Spawner } from "./Spawner";
const { ccclass, property } = _decorator;

// --- CONFIG CONSTANTS ---
// We can move some config values here for clarity
const INITIAL_GAME_SPEED = 300;
const MAX_GAME_SPEED = 800;
const MAX_LIVES = 5;
const CHILLI_SCORE = 1;

// Difficulty Scaling Rules
const TIME_TO_SCALE = 45; // seconds
const CHILLIES_TO_SCALE = 50;

@ccclass("GameManager")
export class GameManager extends Component {
    // --- NODE REFERENCES ---
    // We will drag our nodes from the scene into these slots in the editor.
    @property({ type: PlayerController })
    public playerController: PlayerController | null = null;

    @property({ type: Spawner })
    public spawner: Spawner | null = null;

    // --- UI REFERENCES ---
    @property({ type: Label })
    public scoreLabel: Label | null = null;

    @property({ type: Node })
    public livesContainer: Node | null = null;

    // --- GAME STATE ---
    private gameState: "start" | "playing" | "gameOver" = "start";
    private gameSpeed: number = INITIAL_GAME_SPEED;
    private score = 0;
    private lives: number = MAX_LIVES;

    // --- DIFFICULTY TRACKING ---
    private timeElapsed = 0;
    private chilliesCollectedSinceLastScale = 0;
    private speedMilestones = 0;

    start() {
        // We will add a 'Start Game' button later. For now, we start immediately.
        this.startGame();
    }

    update(deltaTime: number) {
        if (this.gameState !== "playing") {
            return;
        }

        // Update the game speed based on difficulty scaling
        this.updateDifficulty(deltaTime);

        // Tell the spawner the current game speed
        if (this.spawner) {
            this.spawner.gameSpeed = this.gameSpeed;
        }
    }

    private startGame() {
        this.gameState = "playing";
        // Reset all stats
        this.score = 0;
        this.lives = MAX_LIVES;
        this.gameSpeed = INITIAL_GAME_SPEED;
        this.timeElapsed = 0;
        this.chilliesCollectedSinceLastScale = 0;
        this.speedMilestones = 0;

        // Update the UI
        this.updateScoreUI();
        this.updateLivesUI();
    }

    private updateDifficulty(deltaTime: number) {
        this.timeElapsed += deltaTime;

        const expectedMilestones =
            Math.floor(this.timeElapsed / TIME_TO_SCALE) +
            Math.floor(
                this.chilliesCollectedSinceLastScale / CHILLIES_TO_SCALE
            );

        if (expectedMilestones > this.speedMilestones) {
            const milestonesToApply = expectedMilestones - this.speedMilestones;
            for (let i = 0; i < milestonesToApply; i++) {
                this.gameSpeed *= 1.1; // Increase speed by 10%
            }
            this.gameSpeed = Math.min(this.gameSpeed, MAX_GAME_SPEED);

            console.log(`Difficulty increased! New speed: ${this.gameSpeed}`);

            this.speedMilestones = expectedMilestones;
        }
    }

    // --- Public methods to be called by other scripts ---

    public onPlayerHitObstacle() {
        if (this.gameState !== "playing") return;

        this.lives--;
        this.updateLivesUI();
        console.log(`Player hit obstacle! Lives remaining: ${this.lives}`);

        if (this.lives <= 0) {
            this.endGame();
        }
    }

    public onPlayerCollectChilli() {
        if (this.gameState !== "playing") return;

        this.score += CHILLI_SCORE; // We will add multiplier logic later
        this.chilliesCollectedSinceLastScale++;
        this.updateScoreUI();
    }

    public onPlayerCollectPowerUp(powerUpType: string) {
        if (this.gameState !== "playing") return;

        console.log(`Collected power-up: ${powerUpType}`);
        // We will add power-up activation logic here later
    }

    // --- UI Update Methods ---
    private updateScoreUI() {
        if (this.scoreLabel) {
            this.scoreLabel.string = Math.floor(this.score).toString();
        }
    }

    private updateLivesUI() {
        if (this.livesContainer) {
            this.livesContainer.children.forEach((lifeIcon, index) => {
                lifeIcon.active = index < this.lives;
            });
        }
    }

    private endGame() {
        this.gameState = "gameOver";
        console.log("Game Over!");

        // Reload the entire scene to restart
        // In a full game, you'd show a game over screen here.
        director.loadScene("main");
    }
}
