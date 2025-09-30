import { _decorator, Component, Node, Vec3, tween } from "cc";
import { Spawner } from "./Spawner";
import { GameManager } from "./GameManager";
import { Tagger, EObjectType } from "./Tagger";

const { ccclass, property } = _decorator;

// This is the Y position where objects are considered "off-screen" at the bottom.
const OFF_SCREEN_Y = 550;

@ccclass("MovingObject")
export class MovingObject extends Component {
    public spawner: Spawner | null = null;
    public speed = 200;
    public laneIndex: number = 0;

    onLoad() {
        // Listen for the 'despawn' event
        this.node.on("despawn", this.despawn, this);
    }

    onDestroy() {
        this.node.off("despawn", this.despawn, this);
    }

    update(deltaTime: number) {
        // --- MAGNET LOGIC ---
        // We use the singleton to easily access the game state.
        const gameManager = GameManager.instance;
        const tagger = this.getComponent(Tagger);

        if (gameManager && tagger && tagger.tag === EObjectType.Chilli && gameManager.powerupManager?.isActive('PowerupMagnet')) {
            // If this is a chilli and the magnet is active, move towards the player.
            const playerNode = gameManager.playerController.node;
            const targetPos = playerNode.position;
            const currentPos = this.node.position;
            
            // Interpolate (lerp) towards the player's position
            const newPos = new Vec3();
            Vec3.lerp(newPos, currentPos, targetPos, 0.1);
            this.node.setPosition(newPos);

        } else {
            // Move the object down the screen on every frame
            if (!this.spawner || !this.spawner.laneRenderer) {
                return;
            }
            
            const newPos = this.node.getPosition();
            newPos.y += this.speed * deltaTime;
            newPos.x = this.spawner.laneRenderer.laneCenterXAtY(this.laneIndex, newPos.y);
            this.node.setPosition(newPos);
        }

        // Check if the object has gone off the bottom of the screen
        if (this.node.position.y > OFF_SCREEN_Y) {
            // If it has, tell the spawner to recycle it.
            this.despawn();
        }
    }

    private despawn() {
        // --- THIS IS THE FIX ---
        // If the node has no parent, it means it has already been despawned and
        // put back into the pool. In this case, we do nothing.
        if (!this.node.parent) {
            return;
        }

        if (this.spawner) {
            this.spawner.despawnObject(this.node);
        }
    }
}
