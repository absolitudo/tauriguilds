require("dotenv").config();
const app = require("express")();
const cors = require("cors");
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const {
    getGuildData,
    getPlayerProgression,
    mergeOldGuildData,
    whenWas,
    wait
} = require("./helpers.js");
const updater = require("./updater");
const dbUser = process.env.MONGODB_USER;
const dbPass = process.env.MONGODB_PASSWORD;
const port = process.env.PORT || 3001;
const mongoUrl = `mongodb://${dbUser}:${dbPass}@ds125368.mlab.com:25368/tauriguilds`;
const {
    validateGuildRequest,
    validatePlayerRequest
} = require("./middlewares");

MongoClient.connect(
    mongoUrl,
    { useNewUrlParser: true },
    (err, client) => {
        if (err) {
            console.log(err);
        }

        const db = client.db("tauriguilds");
        const guildsCollection = db.collection("guilds");
        const maintence = db.collection("maintence");

        app.use(
            cors({
                origin: "http://localhost:3000", //https://tauriguilds.github.io
                optionsSuccessStatus: 200
            })
        );
        app.use(bodyParser.json());

        app.get("/getguilds", async (req, res) => {
            try {
                res.send(
                    await guildsCollection
                        .find({})
                        .project({
                            progression: 1,
                            guildName: 1,
                            lastUpdated: 1,
                            gFaction: 1,
                            realm: 1,
                            guildMembersCount: 1
                        })
                        .toArray()
                );
            } catch (err) {
                res.send({
                    err
                });
            }
        });

        app.post("/getguild", validateGuildRequest, async (req, res) => {
            const guildName = req.body.guildName;
            const realm = req.body.realm;
            try {
                const guild = await guildsCollection.findOne({
                    guildName: new RegExp(guildName, "i"),
                    realm
                });

                if (guild) {
                    res.send(guild);
                } else {
                    res.redirect(307, "/addguild");
                }
            } catch (err) {
                res.send({
                    err
                });
            }
        });

        app.post("/addguild", validateGuildRequest, async (req, res) => {
            const guildName = req.body.guildName;
            const realm = req.body.realm;
            let updateId = 0;
            try {
                let oldGuildData = await guildsCollection.findOne({
                    guildName: new RegExp(guildName, "i"),
                    realm
                });

                if (oldGuildData && whenWas(oldGuildData.lastUpdated) < 3) {
                    res.send(oldGuildData);
                } else {
                    if (updater.isUpdating(guildName))
                        throw guildName +
                            " is currently updating, guild updates can take minutes depending on the amount of guild members.";

                    updateId = updater.update(guildName);
                    let newGuildData = await getGuildData(realm, guildName);

                    if (oldGuildData) {
                        let data = mergeOldGuildData(
                            oldGuildData,
                            newGuildData
                        );
                        await guildsCollection.updateOne(
                            {
                                guildName: new RegExp(guildName, "i")
                            },
                            { $set: data }
                        );

                        res.send(data);
                    } else {
                        await guildsCollection.insertOne(newGuildData);
                        res.send(newGuildData);
                    }
                    updater.updateFinished(guildName, updateId);
                }
            } catch (err) {
                updater.updateFinished(guildName, updateId);

                res.send({
                    err
                });
            }
        });

        app.post("/updateplayer", validatePlayerRequest, async (req, res) => {
            const guildName = req.body.guildName;
            const playerId = req.body.playerId;
            const realm = req.body.realm;
            const updateId = 0;
            try {
                const guild = await guildsCollection.findOne({
                    guildName: new RegExp(guildName, "i"),
                    realm
                });

                if (!guild) throw "Guild not found";

                let player = guild.guildList[playerId];

                if (!player) throw "Player not found";

                if (
                    whenWas(player.lastUpdated) &&
                    whenWas(player.lastUpdated) < 1
                )
                    throw "Can't update yet, please wait an hour.";

                if (updater.isUpdating(playerId))
                    throw player.name + " is currently updating";

                updateId = updater.update(playerId);

                let data = await getPlayerProgression(realm, player.name);
                let newPlayer = { ...player, ...data };

                guildsCollection.updateOne(
                    {
                        guildName: new RegExp(guildName, "i"),
                        realm
                    },
                    {
                        $set: {
                            [`guildList.${playerId}`]: newPlayer
                        }
                    }
                );
                updater.updateFinished(playerId, updateId);
                res.send(newPlayer);
            } catch (err) {
                updater.updateFinished(playerId, updateId);
                res.send({
                    err
                });
            }
        });

        app.listen(port, () => console.log(`Server listening on port ${port}`));

        setInterval(() => {
            if (whenWas(maintence.findOne().lastUpdated) >= 47) {
                dbMaintence();
            }
        }, 1000 * 60 * 60 * 60 * 4);

        async function dbMaintence() {
            console.log("db maintence started");
            let guilds = await guildsCollection.find({}).toArray();
            let i = 0;
            maintence.updateOne(
                {},
                {
                    $set: {
                        delays: 0,
                        guildsUpdated: 0
                    }
                }
            );
            while (i < guilds.length) {
                await wait(1000 * 10);
                console.log(
                    "updating guild:",
                    guilds[i].guildName,
                    i + 1 + "/" + guilds.length
                );
                try {
                    let newGuildData = await getGuildData(
                        guilds[i].realm,
                        guilds[i].guildName
                    );

                    newGuildData = mergeOldGuildData(guilds[i], newGuildData);

                    guildsCollection.updateOne(
                        {
                            guildName: new RegExp(guilds[i].guildname, "i"),
                            realm: guilds[i].realm
                        },
                        { $set: newGuildData }
                    );

                    i++;
                } catch (err) {
                    console.log(err);
                    if (err === "guild not found") {
                        guildsCollection.deleteOne({
                            guildName: new RegExp(guilds[i].guildname, "i"),
                            realm: guilds[i].realm
                        });
                        i++;
                    }
                    maintence.updateOne(
                        {},
                        {
                            $push: {
                                errors: {
                                    err,
                                    guildName: guilds[i].guildName,
                                    date: new Date().getTime() / 1000
                                }
                            },
                            $inc: {
                                delays: 1,
                                totalNumOfDelays: 1
                            }
                        }
                    );
                }
            }

            maintence.updateOne(
                {},
                {
                    $set: {
                        lastUpdated: new Date().getTime() / 1000
                    }
                }
            );

            console.log("db maintence done");
        }
    }
);
