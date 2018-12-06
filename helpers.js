require("dotenv").config();
const abbreviations = require("./abbreviations.json");
const TauriApi = require("./tauriApi");
const raidsConst = require("./raids.json");
const tauri = new TauriApi(
    process.env.TAURI_API_KEY,
    process.env.TAURI_API_SECRET
);

async function getGuildData(realm, guildName) {
    return new Promise(async (resolve, reject) => {
        try {
            let guildData = await tauri.getGuild(realm, guildName);

            if (!guildData.success) {
                throw guildData.errorstring;
            } else {
                guildData.response.guildList = getGuildListProgression(
                    guildData.response.guildList
                );

                guildData.response.progression = getGuildProgression(
                    guildData.response.guildList
                );

                guildData.response.lastUpdated = new Date().getTime() / 1000;

                resolve(guildData.response);
            }
        } catch (err) {
            reject(err);
        }
    });
}

async function getGuildListProgression(guildList) {
    let newGuildList = {};

    for (let player in guildList) {
        let data = await tauri.getAchievements(
            guildList[player].realm,
            guildList[player].playerName
        );

        if (data.success) {
            newGuildList[player] = {
                ...guildList[player],
                progression: getProgFromAchi(data.response)
            };
        }
    }

    return newGuildList;
}

function getProgFromAchi(achievements) {
    let progression = JSON.parse(JSON.stringify(raidsConst));

    for (let achievement in achievements) {
        const achievementName = achievements[achievement].name;

        for (let instance in progression) {
            if (progression[instance][achievementName]) {
                progression[instance][achievementName] =
                    achievements[achievement].date;
            }
        }
    }

    return abbreviateProgression(progression);
}

function getGuildProgression(guildList) {
    let progression = JSON.parse(JSON.stringify(raidsConst));

    for (let id in guildList) {
        let player = guildList[id];
        if (player.progression) {
            for (let instance in progression) {
                for (let boss in progression[instance]) {
                    if (player.progression[instance][boss]) {
                        if (typeof progression[instance][boss] === "boolean") {
                            progression[instance][boss] = {
                                times: 0,
                                date: player.progression[instance][boss]
                            };
                        }

                        if (
                            progression[instance][boss] >
                            player.progression[instance][boss].date
                        ) {
                            progression[instance][boss].date =
                                player.progression[instance][boss];
                        }

                        progression[instance][boss].times += 1;
                    }
                }
            }
        }
    }

    for (let instance in progression) {
        for (let achievement in progression[instance]) {
            if (progression[instance][achievement].times > 7) {
                progression[instance][achievement] =
                    progression[instance][achievement].date;
            } else {
                progression[instance][achievement] = false;
            }
        }
    }

    return abbreviateProgression(progression);
}

function abbreviateProgression(progression) {
    let abbriviatedProg = JSON.parse(JSON.stringify(progression));

    for (let raid in abbriviatedProg) {
        let totalBosses = 0;
        let heroicDefeated = 0;

        for (let boss in progression[raid]) {
            if (boss !== "abbreviation") {
                if (progression[raid][boss]) {
                    heroicDefeated++;
                }
                totalBosses++;
            }
        }

        abbriviatedProg[raid].abbreviation = `${
            abbreviations[raid]
        } ${heroicDefeated}/${totalBosses} HC`;
    }

    return abbriviatedProg;
}

function mergeOldGuildData(oldGuildData, newGuildData) {
    let progression = {};
    let newGuildProgression = newGuildData.progression;
    let oldGuildProgression = oldGuildData.progression;

    for (let raid in oldGuildProgression) {
        progression[raid] = {};

        for (let boss in oldGuildProgression[raid]) {
            let oldTime = oldGuildProgression[raid][boss];
            let newTime = newGuildProgression[raid][boss];

            if (oldTime || newTime) {
                if (!oldTime) {
                    progression[raid][boss] = newTime;
                } else if (!newTime) {
                    progression[raid][boss] = oldTime;
                } else {
                    progression[raid][boss] =
                        oldTime > newTime ? newTime : oldTime;
                }
            } else {
                progression[raid][boss] = false;
            }
        }
    }
    progression = abbreviateProgression(progression);

    return { ...newGuildData, progression };
}

function wait(time) {
    if (typeof time !== "number") {
        throw "invalid input";
    }
    return new Promise((resolve, reject) => {
        try {
            setTimeout(() => resolve("done"), time);
        } catch (err) {
            reject(err);
        }
    });
}

function whenWas(time) {
    if (typeof time === "number") {
        return Math.round((new Date().getTime() / 1000 - Number(time)) / 3600);
    }
    return false;
}

module.exports = {
    getGuildData,
    getGuildListProgression,
    getProgFromAchi,
    getGuildProgression,
    abbreviateProgression,
    mergeOldGuildData,
    wait,
    whenWas
};
