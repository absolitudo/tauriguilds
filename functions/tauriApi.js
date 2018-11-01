const fetch = require("node-fetch");

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

    getCharacter(name, realm = "tauri") {
        return fetch(this.baseurl + "?apikey=" + this.apikey, {
            method: "POST",
            body: encodeURIComponent(
                JSON.stringify({
                    secret: this.secret,
                    url: "character-sheet",
                    params: {
                        r: this.realms[realm],
                        n: name
                    }
                })
            )
        }).then(res => res.json());
    }
}

module.exports = TauriApi;
