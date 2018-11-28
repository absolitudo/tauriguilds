const fetch = require("node-fetch");
const url = require("url");

class TauriApi {
    constructor(apikey, apisecret) {
        this.apisecret = apisecret;
        this.apikey = apikey;
        this.baseurl = "http://chapi.tauri.hu/apiIndex.php";
    }

    request(options) {
        return fetch(
            url.parse(this.baseurl + "?apikey=" + this.apikey),
            options
        ).then(res => res.json());
    }

    getCharacter(name, realm) {
        return this.request({
            method: "POST",
            body: encodeURIComponent(
                JSON.stringify({
                    secret: this.apisecret,
                    url: "character-sheet",
                    params: {
                        r: realm,
                        n: name
                    }
                })
            )
        });
    }

    getGuild(name, realm) {
        return this.request({
            method: "POST",
            body: encodeURIComponent(
                JSON.stringify({
                    secret: this.apisecret,
                    url: "guild-info",
                    params: {
                        r: realm,
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
                        r: realm,
                        n: name
                    }
                })
            )
        });
    }
}

module.exports = TauriApi;
