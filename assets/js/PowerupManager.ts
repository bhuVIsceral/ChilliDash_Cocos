import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

// We define the properties of our power-ups here
const POWERUP_CONFIG = {
    'PowerupSpeed': { duration: 5 },
    'PowerupMagnet': { duration: 8 },
    'Powerup2x': { duration: 10 },
};

// A simple interface to describe an active power-up
interface IActivePowerup {
    key: string;
    duration: number;
    timeLeft: number;
}

@ccclass('PowerupManager')
export class PowerupManager extends Component {
    
    private activePowerups: Map<string, IActivePowerup> = new Map();

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

    public activatePowerup(powerupNodeName: string) {
        const config = POWERUP_CONFIG[powerupNodeName];
        if (config) {
            this.activePowerups.set(powerupNodeName, {
                key: powerupNodeName,
                duration: config.duration,
                timeLeft: config.duration,
            });
            // console.log(`Activated power-up: ${powerupNodeName}`);
        }
    }

    // This public method lets any other script check if a power-up is active.
    public isActive(powerupNodeName: string): boolean {
        return this.activePowerups.has(powerupNodeName);
    }
    
    // This method is for the UI, to get the remaining time as a percentage.
    public getProgress(powerupNodeName: string): number {
        const powerup = this.activePowerups.get(powerupNodeName);
        if (powerup) {
            return powerup.timeLeft / powerup.duration;
        }
        return 0;
    }
}