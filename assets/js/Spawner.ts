import {
    _decorator,
    Component,
    Node,
    Prefab,
    NodePool,
    instantiate,
    randomRangeInt,
    random,
} from "cc";
import { MovingObject } from "./MovingObject"; // Import our new script
import { LaneRenderer } from './LaneRenderer';

const { ccclass, property } = _decorator;

// We define constants for the spawner's logic
const LANE_X_POSITIONS = [-120, 0, 120];
const SPAWN_Y = -550; // Y position where objects appear at the top

@ccclass("Spawner")
export class Spawner extends Component {
    // --- PREFAB REFERENCES ---
    @property({ type: LaneRenderer })
    public laneRenderer: LaneRenderer | null = null;
    // We need references to all our prefabs to create the pools.
    @property({ type: Prefab }) public chilliPrefab: Prefab | null = null;
    @property({ type: Prefab }) public cratePrefab: Prefab | null = null;
    @property({ type: Prefab }) public flowerPrefab: Prefab | null = null;
    @property({ type: Prefab }) public grassPrefab: Prefab | null = null;
    @property({ type: Prefab }) public powerupSpeedPrefab: Prefab | null = null;
    @property({ type: Prefab }) public powerupMagnetPrefab: Prefab | null =
        null;
    @property({ type: Prefab }) public powerup2xPrefab: Prefab | null = null;

    // This property will be updated by the GameManager
    // public gameSpeed = 400;

    // --- OBJECT POOLS ---
    // We create a pool for each type of object.
    private chilliPool = new NodePool();
    private cratePool = new NodePool();
    private flowerPool = new NodePool();
    private grassPool = new NodePool();
    private powerupSpeedPool = new NodePool();
    private powerupMagnetPool = new NodePool();
    private powerup2xPool = new NodePool();

    // --- MAPPING for easy lookup ---
    private pools: Map<string, NodePool> = new Map();
    private powerupPools: NodePool[] = [];
    private powerupPrefabs: (Prefab | null)[] = [];
    private obstaclePools: NodePool[] = [];
    private obstaclePrefabs: (Prefab | null)[] = [];

    // --- SPAWN LOGIC ---
    private spawnTimer = 0;
    // The interval will now be dynamic based on game speed
    private get spawnInterval() {
        // As game speed increases, the spawn interval decreases (more spawns)
        return 0.75;
    }

    onLoad() {
        // Initialize all our pools when the game loads
        this.initPool(this.chilliPool, this.chilliPrefab, 20);
        this.initPool(this.cratePool, this.cratePrefab, 10);
        this.initPool(this.flowerPool, this.flowerPrefab, 5);
        this.initPool(this.grassPool, this.grassPrefab, 5);
        this.initPool(this.powerupSpeedPool, this.powerupSpeedPrefab, 2);
        this.initPool(this.powerupMagnetPool, this.powerupMagnetPrefab, 2);
        this.initPool(this.powerup2xPool, this.powerup2xPrefab, 2);

        // Map prefab names to pools for easy despawning
        if (this.chilliPrefab)
            this.pools.set(this.chilliPrefab.name, this.chilliPool);
        if (this.cratePrefab)
            this.pools.set(this.cratePrefab.name, this.cratePool);
        if (this.flowerPrefab)
            this.pools.set(this.flowerPrefab.name, this.flowerPool);
        if (this.grassPrefab)
            this.pools.set(this.grassPrefab.name, this.grassPool);
        if (this.powerupSpeedPrefab)
            this.pools.set(this.powerupSpeedPrefab.name, this.powerupSpeedPool);
        if (this.powerupMagnetPrefab)
            this.pools.set(
                this.powerupMagnetPrefab.name,
                this.powerupMagnetPool
            );
        if (this.powerup2xPrefab)
            this.pools.set(this.powerup2xPrefab.name, this.powerup2xPool);

        // Create lists for easy random selection
        this.powerupPools = [
            this.powerupSpeedPool,
            this.powerupMagnetPool,
            this.powerup2xPool,
        ];
        this.powerupPrefabs = [
            this.powerupSpeedPrefab,
            this.powerupMagnetPrefab,
            this.powerup2xPrefab,
        ];
        this.obstaclePools = [this.cratePool, this.grassPool, this.flowerPool];
        this.obstaclePrefabs = [
            this.cratePrefab,
            this.grassPrefab,
            this.flowerPrefab,
        ];
    }

    // This helper function creates and fills a pool.
    private initPool(pool: NodePool, prefab: Prefab | null, count: number) {
        if (!prefab) return;
        for (let i = 0; i < count; i++) {
            const node = instantiate(prefab);
            pool.put(node);
        }
    }

    // This is the main spawn logic that runs every frame.
    update(deltaTime: number) {
        // We will add the game rules logic here in the next step!
        // For now, let's just spawn a chilli every second to test.
        this.spawnTimer += deltaTime;

        // If it's time to spawn...
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;

            const randomValue = random(); // Get a random number between 0 and 1

            // --- Spawn Decision Logic ---
            if (randomValue < 0.2) {
                // 2% chance for a power-up
                this.spawnRandomPowerUp();
            } else if (randomValue < 0.4 && randomValue > 0.2) {
                // 48% chance for an obstacle
                this.spawnObstaclePattern();
            } else {
                // 50% chance for chillies
                this.spawnChilliPattern();
            }
        }
    }

    private spawnRandomPowerUp() {
        const randomIndex = randomRangeInt(0, this.powerupPools.length);
        const randomLane = randomRangeInt(0, 3);
        this.spawnObject(
            this.powerupPools[randomIndex],
            this.powerupPrefabs[randomIndex],
            randomLane
        );
    }

    private spawnObstaclePattern() {
        const randomLane = randomRangeInt(0, 3);
        this.spawnRandomObstacle(randomLane);

        // --- Difficulty Scaling for Obstacles ---
        // The chance of a 2-lane block increases with game speed.
        // Let's say max speed is 600. Chance = gameSpeed / (maxSpeed * 2)
        // const twoLaneChance = this.gameSpeed / 1200;
        // if (random() < twoLaneChance) {
            let secondLane;
            do {
                secondLane = randomRangeInt(0, 3);
            } while (secondLane === randomLane); // Make sure it's a different lane
            this.spawnRandomObstacle(secondLane);
        // }
    }

    private spawnRandomObstacle(lane: number) {
        const randomIndex = randomRangeInt(0, this.obstaclePools.length);
        this.spawnObject(
            this.obstaclePools[randomIndex],
            this.obstaclePrefabs[randomIndex],
            lane
        );
    }

    private spawnChilliPattern() {
        const numToSpawn = randomRangeInt(1, 4); // 1 to 3 chillies
        const usedLanes = new Set<number>();
        for (let i = 0; i < numToSpawn; i++) {
            let lane;
            do {
                lane = randomRangeInt(0, 3);
            } while (usedLanes.has(lane)); // Ensure we don't spawn two in the same lane
            usedLanes.add(lane);
            this.spawnObject(this.chilliPool, this.chilliPrefab, lane);
        }
    }

    private spawnObject(pool: NodePool, prefab: Prefab | null, lane: number) {
        if (!prefab) return;

        const objNode: Node | null =
            pool.size() > 0 ? pool.get() : instantiate(prefab);

        if (objNode) {
            const movingObject = objNode.getComponent(MovingObject);
            if (movingObject) {
                movingObject.spawner = this;
                // movingObject.speed = this.gameSpeed; // Pass the current game speed to the object!
                movingObject.laneIndex = lane;
            }

            const initialX = this.laneRenderer.laneCenterXAtY(lane, SPAWN_Y);
            objNode.setPosition(initialX, SPAWN_Y, 0);
            this.node.addChild(objNode);
        }
    }

    public despawnObject(objectNode: Node) {
        const pool = this.pools.get(objectNode.name);
        if (pool) {
            pool.put(objectNode);
        } else {
            objectNode.destroy();
        }
    }
}
