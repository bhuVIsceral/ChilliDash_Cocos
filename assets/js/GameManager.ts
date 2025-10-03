import { _decorator, Component, Node, Label, director, Sprite, SpriteFrame, UIOpacity, Button, Color } from "cc";
import { languageChangeEvent, LocalizationManager } from "./LocalizationManager";
import { PlayerController } from "./PlayerController";
import { Spawner } from "./Spawner";
import { CameraShaker } from './CameraShaker';
import { AudioManager } from "./AudioManager";
import { PowerupManager } from "./PowerupManager";
import { EObjectType } from "./Tagger";

const { ccclass, property } = _decorator;

// --- CONFIG CONSTANTS ---
// We can move some config values here for clarity
const INITIAL_GAME_SPEED = 300;
const MAX_GAME_SPEED = 800;
const MAX_LIVES = 3;
const CHILLI_SCORE = 1;

// Difficulty Scaling Rules
const TIME_TO_SCALE = 40; // seconds
const CHILLIES_TO_SCALE = 50;

@ccclass("GameManager")
export class GameManager extends Component {
    // --- SINGLETON PATTERN ---
    public static instance: GameManager = null;

    public currentGameSpeed: number = INITIAL_GAME_SPEED;

    // --- NODE REFERENCES ---
    // We will drag our nodes from the scene into these slots in the editor.
    @property({ type: PlayerController }) public playerController: PlayerController | null = null;
    @property({ type: Spawner }) public spawner: Spawner | null = null;
    @property({ type: CameraShaker }) public cameraShaker: CameraShaker | null = null;
    @property({ type: AudioManager }) public audioManager: AudioManager | null = null;
    @property({ type: PowerupManager }) public powerupManager: PowerupManager | null = null;

    // --- NEW: UI MENU REFERENCES ---
    @property({ type: Node }) public startMenu: Node | null = null;
    @property({ type: Node }) public gameOverMenu: Node | null = null;
    @property({ type: Node }) public inGameUI: Node | null = null; // A parent node for all in-game UI
    @property({ type: Label }) public finalScoreLabel: Label | null = null;

    // --- UI REFERENCES ---
    @property({ type: Label }) public scoreLabel: Label | null = null;
    @property({ type: Node }) public livesContainer: Node | null = null;

    @property({ type: Button }) public muteButton: Button | null = null;
    @property({ type: Sprite }) public muteButtonSprite: Sprite | null = null;
    @property ( { type : [SpriteFrame]}) public muteButtonIcons : SpriteFrame[] = [];
    
    @property({type: Button}) public englishButton: Button | null = null;
    @property({type: Button}) public hindiButton: Button | null = null;
    // @property({type: Button}) public hinglishButton: Button | null = null;

    // --- POWERUP UI ---
    // References for the UI cards to show their active state
    @property({ type: Node }) public powerupCardSpeed: Node | null = null;
    @property({ type: Node }) public powerupCardMagnet: Node | null = null;
    @property({ type: Node }) public powerupCard2x: Node | null = null;

    // --- GAME STATE ---
    private gameState: "menu" | "playing" | "gameOver" = "menu";
    private gameSpeed: number = INITIAL_GAME_SPEED;
    private score = 0;
    private lives: number = MAX_LIVES;

    // --- DIFFICULTY TRACKING ---
    private timeElapsed = 0;
    private chilliesCollectedSinceLastScale = 0;
    private speedMilestones = 0;

    private baseGameSpeed: number = INITIAL_GAME_SPEED;

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
        if (GameManager.instance === this) GameManager.instance = null;
        languageChangeEvent.off('language-changed', this.updateLanguageButtonUIColor, this);
    }

    start() {
        this.setupMuteButton();
        this.setupLanguageButtons();
        languageChangeEvent.on('language-changed', this.updateLanguageButtonUIColor, this);
        this.updateLanguageButtonUIColor();

        // Start in the menu state
        this.gameState = "menu";
        // Ensure the game is reset
        // this.startGame();
        if (this.startMenu) this.startMenu.active = true;
        if (this.gameOverMenu) this.gameOverMenu.active = false;
        if (this.inGameUI) this.inGameUI.active = false;

    }
    update(deltaTime: number) {
        if (this.gameState !== "playing") return;
        // Update the game speed based on difficulty scaling
        this.updateDifficulty(deltaTime);
        this.currentGameSpeed = this.calculateCurrentSpeed();
        // this.applyPowerupEffects();
        // Tell the spawner the current game speed
        // if (this.spawner) this.spawner.gameSpeed = this.gameSpeed;

        // Update the UI every frame
        this.updatePowerupUI();
    }

    private setupMuteButton() {
        if(this.muteButton && this.audioManager) {
            this.updateMuteButtonLabel();
            this.muteButton.node.on('click', () => {
                this.audioManager.toggleMute();
                this.updateMuteButtonLabel();
            }, this);
        }
    }

    private updateMuteButtonLabel() {
        if(this.muteButtonSprite && this.audioManager) {
            const isMuted = this.audioManager.isCurrentlyMuted();
            this.muteButtonSprite.spriteFrame = isMuted ? this.muteButtonIcons[0] : this.muteButtonIcons[1];
        }
    }

    private setupLanguageButtons() {
        if (this.englishButton) {
            this.englishButton.node.on('click', () => {
                LocalizationManager.instance.setLanguage('en');
            }, this);
        }
        if (this.hindiButton) {
            this.hindiButton.node.on('click', () => {
                LocalizationManager.instance.setLanguage('hi');
            }, this);
        }
        // if (this.hinglishButton) {
        //     this.hinglishButton.node.on('click', () => {
        //         cocos_LocalizationManager.instance.setLanguage('en_HI');
        //     }, this);
        // }
    }

     private updateLanguageButtonUIColor() {
        if (!LocalizationManager.instance) return;

        const currentLang = LocalizationManager.instance.getCurrentLanguage();
        const activeColor = new Color(109, 173, 71); // A nice green color
        const inactiveColor = new Color(128, 128, 128); // Grey

        // Helper function to get the Label component from a Button
        const getButtonLabel = (button: Button | null): Label | null => {
            return button ? button.getComponentInChildren(Label) : null;
        }
        
        const englishLabel = getButtonLabel(this.englishButton);
        if (englishLabel) {
            englishLabel.color = (currentLang === 'en') ? activeColor : inactiveColor;
        }

        const hindiLabel = getButtonLabel(this.hindiButton);
        if (hindiLabel) {
            hindiLabel.color = (currentLang === 'hi') ? activeColor : inactiveColor;
        }

        // const hinglishLabel = getButtonLabel(this.hinglishButton);
        // if (hinglishLabel) {
        //     hinglishLabel.color = (currentLang === 'en_HI') ? activeColor : inactiveColor;
        // }
    }

    private startGame() {
        this.gameState = 'playing';
        if (this.startMenu) this.startMenu.active = false;
        if (this.gameOverMenu) this.gameOverMenu.active = false;
        if (this.inGameUI) this.inGameUI.active = true;

        this.baseGameSpeed = INITIAL_GAME_SPEED;
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
            for (let i = 0; i < milestonesToApply; i++) this.baseGameSpeed *= 1.10;
            this.baseGameSpeed = Math.min(this.baseGameSpeed, MAX_GAME_SPEED);

            console.log(`Difficulty increased! New speed: ${this.baseGameSpeed}`);

            this.speedMilestones = expectedMilestones;
        }
    }

    private calculateCurrentSpeed(): number {
        let speed = this.baseGameSpeed;
        if (this.powerupManager?.isActive(EObjectType.PowerupSpeed)) {
            speed *= 2;
        }
        return speed;
    }

    // private applyPowerupEffects() {
    //     // Temporarily store the base speed
    //     let currentSpeed = this.gameSpeed;

    //     // Apply speed boost if active
    //     if (this.powerupManager?.isActive(EObjectType.PowerupSpeed)) {
    //         currentSpeed *= 2;
    //     }

    //     // Set the final speed for the spawner
    //     if (this.spawner) {
    //         this.spawner.gameSpeed = currentSpeed;
    //     }
    // }

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

        const multiplier = this.powerupManager?.isActive(EObjectType.Powerup2x) ? 2 : 1;
        this.score += CHILLI_SCORE * multiplier;

        this.chilliesCollectedSinceLastScale++;
        this.updateScoreUI();
    }

    public onPlayerCollectPowerUp(powerUpType: EObjectType) {
        if (this.gameState !== "playing") return;
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

        // Update each card's active state and progress bar
        const updateCard = (card: Node | null, key: EObjectType) => {
            if (card) {
                const isActive = this.powerupManager.isActive(key);
                const activeGlow = card.getChildByName('ActiveGlow');
                if (activeGlow) activeGlow.active = isActive;

                const progressBarNode = card.getChildByName('ProgressBar');
                if (progressBarNode) {

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

        updateCard(this.powerupCardSpeed, EObjectType.PowerupSpeed);
        updateCard(this.powerupCardMagnet, EObjectType.PowerupMagnet);
        updateCard(this.powerupCard2x, EObjectType.Powerup2x);
    }

    private endGame() {
        this.gameState = "gameOver";
        if (this.audioManager) this.audioManager.stopBGM();
        console.log("Game Over!");

        if (this.gameOverMenu) this.gameOverMenu.active = true;
        if (this.inGameUI) this.inGameUI.active = false;
        if (this.finalScoreLabel) this.finalScoreLabel.string = Math.floor(this.score).toString();

        // Reload the entire scene to restart
        // In a full game, you'd show a game over screen here.

    }

    // --- Public method for the Restart button ---
    public restartGame() {
        // Reloading the scene is the cleanest way to restart
        director.loadScene("chilli_dash");
    }
}
