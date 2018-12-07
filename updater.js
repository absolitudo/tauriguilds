const uid = require("uid");

class Updater {
    constructor() {
        this.updating = {};
        this.update = this.update.bind(this);
        this.getUpdateId = this.getUpdateId.bind(this);
        this.updateFinished = this.updateFinished.bind(this);
        this.isUpdating = this.isUpdating.bind(this);
    }

    isUpdating(item) {
        if (this.updating[item]) {
            return true;
        } else {
            return false;
        }
    }

    update(item) {
        let id = uid();
        this.updating[item] = id;
        return id;
    }

    getUpdateId(item) {
        return this.updating[item] ? this.updating[item] : false;
    }

    updateFinished(item, id) {
        if (this.updating[item] === id) {
            this.updating[item] = false;
        } else {
            return false;
        }
    }
}

module.exports = new Updater();
