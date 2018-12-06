require("dotenv").config();
const app = require("express")();
const cors = require("cors");
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const { getGuildData, mergeOldGuildData, whenWas } = require("./helpers.js");
const dbUser = process.env.MONGODB_USER;
const dbPass = process.env.MONGODB_PASSWORD;
const port = process.env.PORT || 3000;
const mongoUrl = `mongodb://${dbUser}:${dbPass}@ds125368.mlab.com:25368/tauriguilds`;
const { valiDateGuildRequest } = require("./middlewares");

MongoClient.connect(
    mongoUrl,
    { useNewUrlParser: true },
    (err, client) => {
        if (err) {
            console.log(err);
        }

        const db = client.db("tauriguilds");
        const guildsCollection = db.collection("guilds");

        app.use(
            cors({
                origin: "https://tauriguilds.github.io",
                optionsSuccessStatus: 200
            })
        );
        app.use(bodyParser.json());

        app.get("/getguilds", async (req, res) => {
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
        });

        app.post("/getguild", valiDateGuildRequest, async (req, res) => {
            const guildName = req.body.guildName;

            res.send(
                await guildsCollection.findOne({
                    guildName: new RegExp(guildName, "i")
                })
            );
        });

        app.post("/addguild", valiDateGuildRequest, async (req, res) => {
            const guildName = req.body.guildName;
            const realm = req.body.realm;

            try {
                let oldGuildData = await guildsCollection.findOne({
                    guildName: new RegExp(guildName, "i")
                });

                if (oldGuildData && whenWas(oldGuildData.lastUpdated) < 3) {
                    res.send(oldGuildData);
                }

                let newGuildData = await getGuildData(realm, guildName);

                if (oldGuildData) {
                    let data = mergeOldGuildData(oldGuildDat, newGuildData);
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
            } catch (err) {
                res.send(err);
            }
        });

        app.post("/addmember");

        app.listen(port, () => console.log(`Server listening on port ${port}`));
    }
);
