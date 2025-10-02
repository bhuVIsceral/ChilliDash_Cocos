import { _decorator, Component } from 'cc';
import { EObjectType } from './Tagger';
const { ccclass, property } = _decorator;

// We define the properties of our power-ups here
const POWERUP_CONFIG: Map<EObjectType, { duration: number }> = new Map([
    [EObjectType.PowerupSpeed, { duration: 5 }],
    [EObjectType.PowerupMagnet, { duration: 8 }],
    [EObjectType.Powerup2x, { duration: 10 }],
]);

// A simple interface to describe an active power-up
interface IActivePowerup {
    type: EObjectType;
    duration: number;
    timeLeft: number;
}

@ccclass('PowerupManager')
export class PowerupManager extends Component {
    
    private activePowerups: Map<EObjectType, IActivePowerup> = new Map();

    update(deltaTime: number) {
        // On every frame, we tick down the timer for all active power-ups.
        for (const [key, powerup] of this.activePowerups.entries()) {
            powerup.timeLeft -= deltaTime;
            if (powerup.timeLeft <= 0) {
                // If the timer runs out, we remove it from the active list.
                this.activePowerups.delete(key);
            }
        }
    }

    public activatePowerup(powerupType: EObjectType) {
        const config = POWERUP_CONFIG.get(powerupType);
        if (config) {
            this.activePowerups.set(powerupType, {
                type: powerupType, // This now correctly matches the interface
                duration: config.duration,
                timeLeft: config.duration,
            });
            console.log(`Activated power-up: ${EObjectType[powerupType]}`);
        }
    }

    public isActive(powerupType: EObjectType): boolean {
        return this.activePowerups.has(powerupType);
    }
    
    // This method is for the UI, to get the remaining time as a percentage.
    public getProgress(powerupType: EObjectType): number {
        const powerup = this.activePowerups.get(powerupType);
        if (powerup) {
            return powerup.timeLeft / powerup.duration;
        }
        return 0;
    }
}