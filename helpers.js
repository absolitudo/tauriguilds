require("dotenv").config();
const abbreviations = require("./abbreviations.json");
const TauriApi = require("./tauriApi");
const raidsConst = require("./raids.json");
const tauri = new TauriApi(
    process.env.TAURI_API_KEY,
    process.env.TAURI_API_SECRET
);

async function getGuildData(guildName, realm) {
    return new Promise(async (resolve, reject) => {
        let guildData = await tauri.getGuild(guildName, realm);

        if (!guildData.success) {
            reject(guildData.errorstring);
        } else {
            const trimmedRoster = trimRoster(guildData.response.guildList);
            const rosterAchievements = await getRosterAchievements(
                trimmedRoster,
                guildData.response.realm
            );
            const progression = getProgression(rosterAchievements);

            guildData.response.progression = progression;
            guildData.response.lastUpdated = new Date().getTime() / 1000;

            resolve({
                compact: getCompactGuildData(guildData.response),
                extended: guildData.response
            });
        }
    });
}

function trimRoster(roster) {
    let trimmedRoster = [];

    for (let member in roster) {
        if (
            roster[member].rank < 5 &&
            roster[member].level === 90 &&
            !/\balt\b/gi.test(roster[member]["rank_name"])
        ) {
            trimmedRoster.push(roster[member]);
        }
    }

    let n =
        trimmedRoster.length / 3 < 10
            ? trimmedRoster.length > 10
                ? 10
                : trimmedRoster.length
            : Math.floor(trimmedRoster.length / 3);

    return trimmedRoster.sort(() => 0.5 - Math.random()).slice(0, n);
}

async function getRosterAchievements(roster) {
    let rosterAchievements = [];

    for (let member of roster) {
        let data = await tauri.getAchievements(member.name, member.realm);
        if (data.success) {
            rosterAchievements.push(data.response);
        }
    }

    return rosterAchievements;
}

function getProgression(roster) {
    let raids = JSON.parse(JSON.stringify(raidsConst));

    for (let member of roster) {
        for (let achievement in member["Achievements"]) {
            const achievementName = member["Achievements"][achievement].name;

            for (let instance in raids) {
                if (raids[instance][achievementName]) {
                    if (typeof raids[instance][achievementName] === "boolean") {
                        raids[instance][achievementName] = 0;
                    }

                    raids[instance][achievementName] += 1;
                }
            }
        }
    }

    for (let instance in raids) {
        for (let achievement in raids[instance]) {
            if (raids[instance][achievement] > 2) {
                raids[instance][achievement] = true;
            } else {
                raids[instance][achievement] = false;
            }
        }
    }

    return abbreviateProgression(raids);
}

function getCompactGuildData(guildData) {
    const {
        progression,
        guildName,
        lastUpdated,
        gFaction,
        realm,
        guildMembersCount
    } = guildData;
    return {
        progression,
        guildName,
        gFaction,
        realm,
        lastUpdated,
        guildMembersCount
    };
}

function whenWas(time) {
    return Math.round((new Date().getTime() / 1000 - Number(time)) / 3600);
}

function abbreviateProgression(progression) {
    let abbriviatedProg = { ...progression };

    for (let raid in abbriviatedProg) {
        let totalBosses = 0;
        let heroicDefeated = 0;

        for (let boss in progression[raid]) {
            if (progression[raid][boss]) {
                heroicDefeated++;
            }
            totalBosses++;
        }

        abbriviatedProg[raid].abbreviation = `${
            abbreviations[raid]
        } ${heroicDefeated}/${totalBosses} HC`;
    }

    return abbriviatedProg;
}

module.exports = {
    getGuildData,
    trimRoster,
    getRosterAchievements,
    getProgression,
    getCompactGuildData,
    whenWas,
    abbreviateProgression
};
