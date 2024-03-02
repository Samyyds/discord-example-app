import { CharacterRepository } from "./repository_character";

class EnemyRepository extends CharacterRepository {
    constructor() {

        super();
        if (EnemyRepository.instance) {
            return EnemyRepository.instance;
        }

        this.enemySeed = new Map(); // location (regionId_roomId) -> enemy seed array
        this.bosses = new Map(); // location (regionId_roomId) -> boss data array
        this.deployTimestamp = Date.now();
        this.enemySeedNonce = 0;
        EnemyRepository.instance = this;

        return EnemyRepository.instance;
    }

    static getInstance() {
        if (!EnemyRepository.instance) {
            EnemyRepository.instance = new EnemyRepository();
        }
        return EnemyRepository.instance;
    }

    addBoss(location, boss) {
        if (!this.bosses.has(location)) {
            this.bosses.set(location, []);
        }
        this.bosses.get(location).push(boss);
    }

    addEnemy(location) {
        this.enemySeed.get(location).push(deploy_timestamp + enemySeed++);
    }
}