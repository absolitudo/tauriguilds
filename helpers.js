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
            }

            guildData.response.guildList = await getGuildListProgression(
                guildData.response.guildMembersCount,
                guildData.response.guildList
            );

            guildData.response.progression = getGuildProgression(
                guildData.response.guildList
            );

            guildData.response.lastUpdated = new Date().getTime() / 1000;

            resolve(guildData.response);
        } catch (err) {
            reject(err);
        }
    });
}

async function getGuildListProgression(guildMembersCount, guildList) {
    return new Promise(async (resolve, reject) => {
        try {
            let maxRank = guildMembersCount > 250 ? 6 : 10;
            let newGuildList = {};

            for (let player in guildList) {
                await wait(500);

                let success = false;
                let data = {};
                if (
                    guildList[player].level === 90 &&
                    guildList[player].rank < maxRank
                ) {
                    try {
                        data = await getPlayerProgression(
                            guildList[player].realm,
                            guildList[player].name
                        );
                        success = true;
                    } catch (err) {
                        console.log(err);
                        await wait(20000);
                    }
                }

                if (success) {
                    newGuildList[player] = {
                        ...guildList[player],
                        ...data
                    };
                } else {
                    newGuildList[player] = {
                        ...guildList[player],
                        progression: getProgFromAchi({})
                    };
                }
            }

            resolve(newGuildList);
        } catch (err) {
            reject(err);
        }
    });
}

async function getPlayerProgression(realm, name) {
    return new Promise(async (resolve, reject) => {
        try {
            let res = await tauri.getAchievements(realm, name);

            if (res.success) {
                resolve({
                    progression: getProgFromAchi(res.response["Achievements"]),
                    lastUpdated: new Date().getTime() / 1000
                });
            } else {
                throw res.error.errorstring;
            }
        } catch (err) {
            reject(err);
        }
    });
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

    for (let instance in progression) {
        for (let boss in progression[instance]) {
            if (typeof progression[instance][boss] === "boolean") {
                progression[instance][boss] = false;
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
                            progression[instance][boss].date >
                            player.progression[instance][boss]
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
            let oldTime =
                typeof oldGuildProgression[raid][boss] === "boolean"
                    ? false
                    : oldGuildProgression[raid][boss];
            let newTime =
                typeof newGuildProgression[raid][boss] === "boolean"
                    ? false
                    : newGuildProgression[raid][boss];

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

function areObjectsIdentical(obj1, obj2) {
    if (typeof obj1 !== "object" || typeof obj2 !== "object") return false;

    if (
        Object.getOwnPropertyNames(obj1).length !==
        Object.getOwnPropertyNames(obj2).length
    )
        return false;

    for (let key in obj1) {
        if (typeof obj1[key] === "object") {
            if (!areObjectsIdentical(obj1[key], obj2[key])) {
                return false;
            }
        } else if (obj1[key] !== obj2[key]) {
            return false;
        }
    }

    return true;
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
    getPlayerProgression,
    getProgFromAchi,
    getGuildProgression,
    abbreviateProgression,
    mergeOldGuildData,
    wait,
    whenWas,
    areObjectsIdentical
};
