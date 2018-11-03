require("dotenv").config();
const firebase = require("firebase-admin");
const functions = require("firebase-functions");
const TauriApi = require("./tauriApi");

firebase.initializeApp(JSON.parse(process.env.FIREBASE_CONFIG));
const tauri = new TauriApi(
    process.env.TAURI_API_KEY,
    process.env.TAURI_API_SECRET
);

exports.getGuilds = functions.https.onRequest((request, response) => {
    firebase
        .database()
        .ref("compactguilds")
        .once("value")
        .then(snapshot => {
            response.send(snapshot.val());
        });
});

exports.getGuild = functions.https.onRequest((request, response) => {
    firebase
        .database()
        .ref("tauriguilds/" + request.body.guild)
        .once("value")
        .then(snapshot => {
            if (
                snapshot.val() == null ||
                whenWas(snapshot.val().lastUpdated) > 2
            ) {
                try {
                    getGuildData(request.body.guild).then(data => {
                        Promise.all([
                            firebase
                                .database()
                                .ref("tauriguilds/" + request.body.guild)
                                .set(data.extended),

                            firebase
                                .database()
                                .ref("compactguilds/" + request.body.guild)
                                .set(data.compact)
                        ]).then(() => response.send(data.extended));
                    });
                } catch (err) {
                    response.send(err);
                }
            } else {
                response.send(snapshot.val());
            }
        });
});

function getGuildData(guildname) {
    return new Promise((resolve, reject) => {
        tauri.getGuild(guildname).then(guildData => {
            if (!guildData.success) {
                reject(guildData.errorstring);
            } else {
                const trimmedRoster = trimRoster(guildData.response.guildList);
                getRosterAchievements(trimmedRoster).then(
                    rosterAchievements => {
                        const progression = getProgression(rosterAchievements);

                        guildData.response.progression = progression;
                        guildData.response.lastUpdated =
                            new Date().getTime() / 1000;

                        resolve({
                            compact: getCompactGuildData(guildData.response),
                            extended: guildData.response
                        });
                    }
                );
            }
        });
    });
}

function trimRoster(roster) {
    let trimmedRoster = [];

    for (let member in roster) {
        if (roster[member].rank < 6) {
            trimmedRoster.push(roster[member]);
        }
    }

    let memberCounter = 0;

    trimmedRoster = trimmedRoster.filter(member => {
        let rando = Math.round(Math.random()) === 1;
        if (
            memberCounter < 10 ||
            (rando && memberCounter < 20) ||
            member.rank === 0
        ) {
            memberCounter++;
            return true;
        }
        return false;
    });

    return trimmedRoster;
}

function getRosterAchievements(roster) {
    let rosterAchievements = [];

    return chainArrayPromise(roster, 0, rosterAchievements).then(
        rosterAchievements => {
            return rosterAchievements
                .filter(data => data.success)
                .map(data => data.response);
        }
    );
}

function chainArrayPromise(arr, currIndex, newArray) {
    if (currIndex === arr.length - 1) {
        return tauri.getAchievements(arr[currIndex].name).then(data => {
            newArray.push(data);
            return newArray;
        });
    }

    return tauri
        .getAchievements(arr[currIndex].name)
        .then(data => newArray.push(data))
        .then(() => chainArrayPromise(arr, currIndex + 1, newArray));
}

function getProgression(roster) {
    let progression = {
        "Throne of Thunder": {
            "Heroic: Jin'rokh the Breaker": true,
            "Heroic: Horridon": true,
            "Heroic: Council of Elders": true,
            "Heroic: Tortos": true,
            "Heroic: Megaera": true,
            "Heroic: Ji-Kun": true,
            "Heroic: Durumu the Forgotten": true,
            "Heroic: Primordius": true,
            "Heroic: Dark Animus": true,
            "Heroic: Iron Qon": true,
            "Heroic: Twin Consorts": true,
            "Heroic: Lei Shen": true,
            "Heroic: Ra-den": true
        },
        "Terrace of the Endless Spring": {
            "Heroic: Protectors of the Endless": true,
            "Heroic: Tsulong": true,
            "Heroic: Lei Shi": true,
            "Heroic: Sha of Fear": true
        },
        "Heart of Fear": {
            "Heroic: Imperial Vizier Zor'lok": true,
            "Heroic: Blade Lord Ta'yak": true,
            "Heroic: Garalon": true,
            "Heroic: Wind Lord Mel'jarak": true,
            "Heroic: Amber-Shaper Un'sok": true,
            "Heroic: Grand Empress Shek'zeer": true
        },
        "Mogu'shan Vaults": {
            "Heroic: Stone Guard": true,
            "Heroic: Feng the Accursed": true,
            "Heroic: Gara'jal the Spiritbinder": true,
            "Heroic: Four Kings": true,
            "Heroic: Elegon": true,
            "Heroic: Will of the Emperor": true
        }
    };

    for (let member of roster) {
        for (let achievement in member["Achievements"]) {
            const achievementName = member["Achievements"][achievement].name;
            if (progression["Throne of Thunder"][achievementName]) {
                if (
                    typeof progression["Throne of Thunder"][achievementName] ===
                    "boolean"
                ) {
                    progression["Throne of Thunder"][achievementName] = 0;
                }
                progression["Throne of Thunder"][achievementName] += 1;
            } else if (
                progression["Terrace of the Endless Spring"][achievementName]
            ) {
                if (
                    typeof progression["Terrace of the Endless Spring"][
                        achievementName
                    ] === "boolean"
                ) {
                    progression["Terrace of the Endless Spring"][
                        achievementName
                    ] = 0;
                }
                progression["Terrace of the Endless Spring"][
                    achievementName
                ] += 1;
            } else if (progression["Heart of Fear"][achievementName]) {
                if (
                    typeof progression["Heart of Fear"][achievementName] ===
                    "boolean"
                ) {
                    progression["Heart of Fear"][achievementName] = 0;
                }
                progression["Heart of Fear"][achievementName] += 1;
            } else if (progression["Mogu'shan Vaults"][achievementName]) {
                if (
                    typeof progression["Mogu'shan Vaults"][achievementName] ===
                    "boolean"
                ) {
                    progression["Mogu'shan Vaults"][achievementName] = 0;
                }
                progression["Mogu'shan Vaults"][achievementName] += 1;
            }
        }
    }

    for (let instance in progression) {
        for (let achievement in progression[instance]) {
            if (progression[instance][achievement] > 3) {
                progression[instance][achievement] = true;
            } else {
                progression[instance][achievement] = false;
            }
        }
    }

    return progression;
}

function getCompactGuildData(guildData) {
    const { progression, guildName, lastUpdated, gFaction, realm } = guildData;
    return {
        progression,
        guildName,
        gFaction,
        realm,
        lastUpdated
    };
}

function whenWas(time) {
    return Math.round((new Date().getTime() / 1000 - Number(time)) / 3600);
}
