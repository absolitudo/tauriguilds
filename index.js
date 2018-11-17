require("dotenv").config();
const app = require("express")();
const cors = require("cors");
const bodyParser = require("body-parser");
const TauriApi = require("./tauriApi");
const MongoClient = require("mongodb").MongoClient;
const dbUser = process.env.MONGODB_USER;
const dbPass = process.env.MONGODB_PASSWORD;
const port = process.env.PORT || 3000;
const mongoUrl = `mongodb://${dbUser}:${dbPass}@ds251223.mlab.com:51223/tauriguilds`;
const tauri = new TauriApi(
    process.env.TAURI_API_KEY,
    process.env.TAURI_API_SECRET
);

MongoClient.connect(
    mongoUrl,
    { useNewUrlParser: true },
    (err, client) => {
        if (err) {
            console.log(err);
        }

        const db = client.db("tauriguilds");
        const compactguilds = db.collection("compactguilds");
        const extendedguilds = db.collection("extendedguilds");

        app.use(
            cors({
                origin: "https://tauriguilds.github.io",
                optionsSuccessStatus: 200
            })
        );
        app.use(bodyParser.json());

        app.get("/getGuilds", async (req, res) => {
            const guilds = await compactguilds.find().toArray();
            res.send(guilds);
        });

        app.post("/getGuild", async (req, res) => {
            const guildName = req.body.guildName;
            const realm = req.body.realm || "tauri";
            const guild = await extendedguilds.findOne({
                guildName: new RegExp(guildName, "i")
            });

            if (!guild || whenWas(guild.lastUpdated) > 2) {
                try {
                    const guildData = await getGuildData(guildName, realm);

                    if (!guild) {
                        compactguilds.insertOne(guildData.compact);
                        extendedguilds.insertOne(guildData.extended);
                    } else {
                        compactguilds.updateOne(
                            {
                                guildName
                            },
                            { $set: guildData.compact }
                        );
                        extendedguilds.updateOne(
                            {
                                guildName
                            },
                            { $set: guildData.extended }
                        );
                    }

                    res.send(guildData.extended);
                } catch (err) {
                    res.send({ err });
                }
            } else {
                res.send(guild);
            }
        });

        app.listen(port, () => console.log(`Server listening on port ${port}`));
    }
);

async function getGuildData(guildName, realm) {
    return new Promise(async (resolve, reject) => {
        let guildData = await tauri.getGuild(guildName, realm);

        if (!guildData.success) {
            reject(guildData.errorstring);
        } else {
            const trimmedRoster = trimRoster(guildData.response.guildList);
            const rosterAchievements = await getRosterAchievements(
                trimmedRoster
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
    let memberMuliplyr = 0;

    for (let member in roster) {
        memberMuliplyr++;
        if (roster[member].rank < 5) {
            trimmedRoster.push(roster[member]);
        }
    }

    memberMuliplyr = memberMuliplyr > 80 ? memberMuliplyr / 80 : 1;
    let memberCounter = 0;

    trimmedRoster = trimmedRoster.filter(member => {
        let rando = Math.round(Math.random()) === 1;
        if (
            memberCounter < 10 ||
            (rando && memberCounter < 20 * memberMuliplyr) ||
            member.rank === 0
        ) {
            memberCounter++;
            return true;
        }
        return false;
    });

    return trimmedRoster;
}

async function getRosterAchievements(roster) {
    let rosterAchievements = [];

    for (let member of roster) {
        rosterAchievements.push(await tauri.getAchievements(member.name));
    }

    return rosterAchievements
        .filter(data => data.success)
        .map(data => data.response);
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

module.exports = getGuildData;
