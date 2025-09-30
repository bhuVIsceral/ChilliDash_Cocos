import {
    _decorator,
    Component,
    Collider2D,
    IPhysics2DContact,
    BoxCollider2D,
} from "cc";
import { GameManager } from "./GameManager";
const { ccclass, property } = _decorator;

@ccclass("CollisionManager")
export class CollisionManager extends Component {
    @property({ type: GameManager })
    public gameManager: GameManager | null = null;

    start() {
        //Register the collision listener
        const collider = this.getComponent(BoxCollider2D);
        if (collider) {
            collider.on("begin-contract", this.onBeginContact, this);
        }
    }

    onDestroy() {
        // Clean up the listener when the component is destroyed.
        const collider = this.getComponent(BoxCollider2D);
        if (collider) {
            collider.off('begin-contact', this.onBeginContact, this);
        }
    }

    private onBeginContact(
        selfCollider: Collider2D,
        otherCollider: Collider2D,
        contact: IPhysics2DContact | null
    ) {
        if (!this.gameManager) return;

        // We can check the name of the object we hit
        const otherNodeName = otherCollider.node.name;

        if (otherNodeName === "Chilli") {
            this.gameManager.onPlayerCollectChilli();
            // We need to tell the spawner to despawn this chilli
            otherCollider.node.emit("despawn");
        } else if (
            otherNodeName === "Crate" ||
            otherNodeName === "Grass" ||
            otherNodeName === "Flower"
        ) {
            this.gameManager.onPlayerHitObstacle();
        } else if (otherNodeName.includes("Powerup")) {
            this.gameManager.onPlayerCollectPowerUp(otherNodeName);
            otherCollider.node.emit("despawn");
        }
    }
}
