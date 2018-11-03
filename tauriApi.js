const fetch = require("node-fetch");
const url = require("url");

class TauriApi {
    constructor(apikey, apisecret) {
        this.apisecret = apisecret;
        this.apikey = apikey;
        this.baseurl = "http://chapi.tauri.hu/apiIndex.php";
        this.realms = {
            tauri: "[HU] Tauri WoW Server",
            wod: "[HU] Warriors of Darkness",
            evermoon: "[EN] Evermoon"
        };
    }

    request(options) {
        return fetch(
            url.parse(this.baseurl + "?apikey=" + this.apikey),
            options
        ).then(res => res.json());
    }

    getCharacter(name, realm = "tauri") {
        return this.request({
            method: "POST",
            body: encodeURIComponent(
                JSON.stringify({
                    secret: this.apisecret,
                    url: "character-sheet",
                    params: {
                        r: this.realms[realm],
                        n: name
                    }
                })
            )
        });
    }

    getGuild(name, realm = "tauri") {
        return this.request({
            method: "POST",
            body: encodeURIComponent(
                JSON.stringify({
                    secret: this.apisecret,
                    url: "guild-info",
                    params: {
                        r: this.realms[realm],
                        gn: name
                    }
                })
            )
        });
    }

    getAchievements(name, realm = "tauri") {
        return this.request({
            method: "POST",
            body: encodeURIComponent(
                JSON.stringify({
                    secret: this.apisecret,
                    url: "character-achievements",
                    params: {
                        r: this.realms[realm],
                        n: name
                    }
                })
            )
        });
    }
}

module.exports = TauriApi;
