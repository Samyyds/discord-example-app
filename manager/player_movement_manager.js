import { RegionManager } from '../manager/region_manager.js';
import { QuestManager } from '../manager/quest_manager.js';
import { QuestStatus } from '../data/enums.js';

class PlayerMovementManager {
    constructor() {
        if (PlayerMovementManager.instance) {
            return PlayerMovementManager.instance;
        }

        this.locations = new Map(); // user ID -> Map(character ID -> location)
        this.regionManager = RegionManager.getInstance();
        PlayerMovementManager.instance = this;
    }

    static getInstance() {
        if (!PlayerMovementManager.instance) {
            PlayerMovementManager.instance = new PlayerMovementManager();
        }
        return PlayerMovementManager.instance;
    }

    setLocation(userId, characterId, regionId = 0, locationId = 0, roomId = 0) {
        if (!this.locations.has(userId)) {
            this.locations.set(userId, new Map());
        }
        this.locations.get(userId).set(characterId, { regionId, locationId, roomId });
    }

    getLocation(userId, characterId) {
        let userLocations = this.locations.get(userId);
        return userLocations ? userLocations.get(characterId) : null;
    }

    moveRegion(userId, characterId, targetRegionId, targetLocationId) {
        const location = this.getLocation(userId, characterId);
        if (this.regionManager.canMoveTo(location.regionId, location.locationId, targetRegionId, targetLocationId)) {
            this.setLocation(userId, characterId, targetRegionId, targetLocationId, 0);
            return true;
        } else {
            console.error("Invalid movement path or region/location ID.");
            return false;
        }
    }

    canMoveRegion(userId, characterId, targetRegionId, targetLocationId) {
        const location = this.getLocation(userId, characterId);
        if (!location) {
            return { canMove: false, message: "No location found for this user/character." };
        }

        const targetRegion = this.regionManager.getRegionById(targetRegionId);
        const targetLocation = targetRegion.getLocation(targetLocationId);

        const questRequirement = targetLocation.getRequiredQuest();
        if (questRequirement && questRequirement.questId) {
            const questManager = QuestManager.getInstance();
            const quest = questManager.getQuestByID(userId, characterId, questRequirement.questId);

            if (!quest || quest.status !== questRequirement.status) {
                return { canMove: false, message: "You need to complete the required quest to access this region." };
            }
        }

        const canMove = this.regionManager.canMoveTo(location.regionId, location.locationId, targetRegionId, targetLocationId);
        return canMove ? { canMove: true, message: "" } : { canMove: false, message: "Invalid movement path or region/location ID." };
    }

    moveLocation(userId, characterId, regionId, locationId) {
        this.setLocation(userId, characterId, regionId, locationId, 0);
    }

    // canMoveLocation(userId, characterId, destRegionId, destLocationId) {
    //     const location = this.getLocation(userId, characterId);
    //     return location && location.regionId === destRegionId && location.locationId !== destLocationId && location.roomId === 0;
    // }
    canMoveLocation(userId, characterId, destRegionId, destLocationId, interaction) {
        const location = this.getLocation(userId, characterId);
        if (!location) {
            console.error("No location found for this user/character.");
            return { canMove: false, message: "No location found for this user/character." };
        }

        const region = this.regionManager.getRegionById(destRegionId);
        const targetLocation = region.getLocation(destLocationId);

        // const hasSubscriberRole = interaction.member.roles.cache.some(role => role.name === 'Subscriber');
        // if (targetLocation.subscriberOnly && !hasSubscriberRole) {
        //     return { canMove: false, message: "This area is only available to subscribers." };
        // }

        if (location.regionId === destRegionId && location.locationId !== destLocationId && location.roomId === 0) {
            return { canMove: true };
        } else {
            return { canMove: false, message: "Cannot move to the target location from current location." };
        }
    }

    moveRoom(userId, characterId, isUp) {
        const location = this.getLocation(userId, characterId);
        if (!location) return;
        const region = this.regionManager.getRegionById(location.regionId);
        const locationData = region.getLocation(location.locationId);
        const roomCount = locationData.roomCount;

        let newRoomId = location.roomId + (isUp ? -1 : 1);

        if ((isUp && newRoomId >= 0) || (!isUp && newRoomId < roomCount)) {
            this.setLocation(userId, characterId, location.regionId, location.locationId, newRoomId);
        }
    }

    canMoveUp(userId, characterId) {
        const location = this.getLocation(userId, characterId);
        return location && location.roomId > 0;
    }

    canMoveDown(userId, characterId) {
        const location = this.getLocation(userId, characterId);
        if (!location) return false;
        const region = this.regionManager.getRegionById(location.regionId);
        const locationData = region.getLocation(location.locationId);
        const roomCount = locationData.roomCount;
        return location.roomId < roomCount;
    }
}

export { PlayerMovementManager };
