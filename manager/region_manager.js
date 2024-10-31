import regionData from '../json/regions.json' assert { type: 'json' };
import { Region, Location } from '../data/region_data.js';

class RegionManager {
    constructor() {
        if (RegionManager.instance) {
            return RegionManager.instance;
        }

        this.regions = new Map();
        RegionManager.instance = this;
    }

    static getInstance() {
        if (!RegionManager.instance) {
            RegionManager.instance = new RegionManager();
        }
        return RegionManager.instance;
    }

    addRegion(region) {
        this.regions.set(region.id, region);
    }

    getRegionById(regionId) {
        return this.regions.get(regionId);
    }

    getLocationById(regionId, locationId) {
        return this.regions.get(regionId).getLocation(locationId);
    }

    getRoomByLocation(regionId, locationId, roomId) {
        const location = this.getLocationById(regionId, locationId);
        if (location) {
            return location.getRoom(roomId);
        }
        return null;
    }

    loadFromJson() {
        const regionManager = RegionManager.getInstance();

        regionData.regions.forEach(regionData => {
            const region = new Region(regionData.id, regionData.name, regionData.description);
            regionData.locations.forEach(locationData => {
                const location = new Location(
                    locationData.locationId,
                    locationData.name,
                    regionData.id,
                    locationData.locationId,
                    locationData.roomCount,
                    locationData.description,
                    locationData.subscriberOnly,
                    locationData.questRequired
                );

                console.log(`Location: ${location.name}, questRequired:`, location.questRequired);

                region.addLocation(location);
            });

            const paths = new Map();
            for (const [key, value] of Object.entries(regionData.paths)) {
                paths.set(key, value); 
            }
            region.paths = paths;
            regionManager.addRegion(region);
        });
    }

    canMoveTo(fromRegionId, fromLocationId, targetRegionId, targetLocationId) {
        const fromRegion = this.getRegionById(fromRegionId);
        if (fromRegion) {
            const destinations = fromRegion.paths.get(fromLocationId.toString());
            console.log(`Checking paths from region ${fromRegionId}, location ${fromLocationId}`);
            console.log(`Destinations:`, destinations);
            if (destinations) {
                return destinations.some(dest => dest.regionId === targetRegionId && dest.locationId === targetLocationId);
            }
        }
        return false;
    }
}

export { RegionManager };