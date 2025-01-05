import shopData from '../json/shop.json' assert { type: 'json' };

class Shop {
    constructor(shopTemplates) {
        this.id = shopTemplates.id;
        this.name = shopTemplates.name;
        this.location = shopTemplates.location;
        this.items = shopTemplates.items;
    }

    getItemsList() {
        return this.items.map(item => ({
            itemType: item.itemType,
            itemName: item.name,
            itemId: item.itemId,
            price: item.price,
            stock: item.stock
        }));
    }
}

class ShopManager {
    constructor() {
        if (ShopManager.instance) {
            return ShopManager.instance;
        }
        this.shopTemplates = [];
        ShopManager.instance = this;
    }

    static getInstance() {
        if (!ShopManager.instance) {
            ShopManager.instance = new ShopManager();
        }
        return ShopManager.instance;
    }

    loadFromJson() {
        this.shopTemplates = Array.isArray(shopData) ? shopData : [];
    }

    getShopTemplateById(id) {
        return this.shopTemplates.find(shop => shop.id === id);
    }

    createShopInstance(id) {
        const template = this.getShopTemplateById(id);
        if (template) {
            return new Shop(template);
        }
        return null;
    }
}

export { ShopManager, Shop };