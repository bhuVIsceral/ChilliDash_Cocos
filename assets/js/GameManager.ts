import { _decorator, Component, Node, Label, director, Sprite, UIOpacity } from "cc";
import { PlayerController } from "./PlayerController";
import { Spawner } from "./Spawner";
import { CameraShaker } from './CameraShaker';
import { AudioManager } from "./AudioManager";
import { PowerupManager } from "./PowerupManager";

const { ccclass, property } = _decorator;

// --- CONFIG CONSTANTS ---
// We can move some config values here for clarity
const INITIAL_GAME_SPEED = 300;
const MAX_GAME_SPEED = 800;
const MAX_LIVES = 3;
const CHILLI_SCORE = 1;

// Difficulty Scaling Rules
const TIME_TO_SCALE = 45; // seconds
const CHILLIES_TO_SCALE = 50;

@ccclass("GameManager")
export class GameManager extends Component {
    // --- SINGLETON PATTERN ---
    public static instance: GameManager = null;

    // --- NODE REFERENCES ---
    // We will drag our nodes from the scene into these slots in the editor.
    @property({ type: PlayerController }) public playerController: PlayerController | null = null;
    @property({ type: Spawner }) public spawner: Spawner | null = null;
    @property({type: CameraShaker}) public cameraShaker: CameraShaker | null = null;
    @property({type: AudioManager}) public audioManager: AudioManager | null = null;
    @property({type: PowerupManager}) public powerupManager: PowerupManager | null = null;

    // --- UI REFERENCES ---
    @property({ type: Label }) public scoreLabel: Label | null = null;
    @property({ type: Node }) public livesContainer: Node | null = null;
    // @property({ type: Node }) public livesMultiplierIcon: Node | null = null;
    // References for the UI cards to show their active state
    @property({ type: Node }) public powerupCardSpeed: Node | null = null;
    @property({ type: Node }) public powerupCardMagnet: Node | null = null;
    @property({ type: Node }) public powerupCard2x: Node | null = null;

    // --- GAME STATE ---
    private gameState: "start" | "playing" | "gameOver" = "start";
    private gameSpeed: number = INITIAL_GAME_SPEED;
    private score = 0;
    private lives: number = MAX_LIVES;

    // --- DIFFICULTY TRACKING ---
    private timeElapsed = 0;
    private chilliesCollectedSinceLastScale = 0;
    private speedMilestones = 0;

    onLoad() {
        // Set up the singleton instance
        if (GameManager.instance === null) {
            GameManager.instance = this;
        } else {
            this.destroy(); // Destroy any duplicate instances
            return;
        }
    }

    onDestroy() {
        if(GameManager.instance === this) GameManager.instance = null;
    }

    start() {
        // We will add a 'Start Game' button later. For now, we start immediately.
        this.startGame();
    }

    update(deltaTime: number) {
        if (this.gameState !== "playing") return;
        // Update the game speed based on difficulty scaling
        this.updateDifficulty(deltaTime);
        this.applyPowerupEffects();
        // Tell the spawner the current game speed
        if (this.spawner) this.spawner.gameSpeed = this.gameSpeed;
        
        // Update the UI every frame
        this.updatePowerupUI();
    }

    private startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.lives = MAX_LIVES;
        this.gameSpeed = INITIAL_GAME_SPEED;
        this.timeElapsed = 0;
        this.chilliesCollectedSinceLastScale = 0;
        this.speedMilestones = 0;
        this.updateScoreUI();
        this.updateLivesUI();

        // Start the background music
        if (this.audioManager) this.audioManager.playBGM();
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

    private applyPowerupEffects() {
        // Temporarily store the base speed
        let currentSpeed = this.gameSpeed;

        // Apply speed boost if active
        if (this.powerupManager?.isActive('PowerupSpeed')) {
            currentSpeed *= 2;
        }

        // Set the final speed for the spawner
        if (this.spawner) {
            this.spawner.gameSpeed = currentSpeed;
        }
    }

    // --- Public methods to be called by other scripts ---

    public onPlayerHitObstacle() {
        if (this.gameState !== "playing") return;
        if (this.cameraShaker) this.cameraShaker.shake();
        if (this.audioManager) this.audioManager.playHitSfx();
        this.lives--;
        this.updateLivesUI();
        console.log(`Player hit obstacle! Lives remaining: ${this.lives}`);

        if (this.lives <= 0) this.endGame();
    }

    public onPlayerCollectChilli() {
        if (this.gameState !== "playing") return;
        if (this.audioManager) this.audioManager.playChilliSfx();
        this.score += CHILLI_SCORE; // We will add multiplier logic later
        this.chilliesCollectedSinceLastScale++;
        this.updateScoreUI();
    }

    public onPlayerCollectPowerUp(powerUpType: string) {
        if (this.gameState !== "playing") return;

        // --- DEBUGGING ---
        // console.log(`CollisionManager reported collecting: '${powerUpType}'`);

        if (this.audioManager) this.audioManager.playPowerupSfx();
        this.powerupManager?.activatePowerup(powerUpType);
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

    private updatePowerupUI() {
        if (!this.powerupManager) return;
        
        // Show/hide the 'x2' icon next to the lives
        // if (this.livesMultiplierIcon) {
        //     this.livesMultiplierIcon.active = this.powerupManager.isActive('Powerup2x');
        // }

        // Update each card's active state and progress bar
        const updateCard = (card: Node | null, key: string) => {
            if (card) {
                const isActive = this.powerupManager.isActive(key);
                const activeGlow = card.getChildByName('ActiveGlow');
                
                if (activeGlow) activeGlow.active = isActive;
                else console.error(`Could not find 'ActiveGlow' child on card: ${card.name}`);

                const progressBarNode = card.getChildByName('ProgressBar');
                if (progressBarNode) {
                    console.log(progressBarNode + isActive.toString());
                    // --- FIXES ARE HERE ---
                    const opacityComp = progressBarNode.getComponent(UIOpacity);
                    if (opacityComp) {
                        console.log(progressBarNode + isActive.toString());
                        opacityComp.opacity = isActive ? 255 : 0;
                    }

                    const spriteComp = progressBarNode.getComponent(Sprite);
                    if (spriteComp) {
                        spriteComp.fillRange = this.powerupManager.getProgress(key);
                    }
                }
            }
        };

        updateCard(this.powerupCardSpeed, 'PowerupSpeed');
        updateCard(this.powerupCardMagnet, 'PowerupMagnet');
        updateCard(this.powerupCard2x, 'Powerup2x');
    }

    private endGame() {
        this.gameState = "gameOver";
        if (this.audioManager) this.audioManager.stopBGM();
        console.log("Game Over!");

        // Reload the entire scene to restart
        // In a full game, you'd show a game over screen here.
        director.loadScene("chilli_dash");
    }
}
