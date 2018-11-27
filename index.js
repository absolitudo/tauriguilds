require("dotenv").config();
const app = require("express")();
const cors = require("cors");
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const { getGuildData, whenWas } = require("./helpers.js");
const dbUser = process.env.MONGODB_USER;
const dbPass = process.env.MONGODB_PASSWORD;
const port = process.env.PORT || 3000;
const mongoUrl = `mongodb://${dbUser}:${dbPass}@ds251223.mlab.com:51223/tauriguilds`;

const { validateGetGuildRequest } = require("./middlewares");

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

        app.post("/getGuild", validateGetGuildRequest, async (req, res) => {
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
                                guildName: new RegExp(guildName, "i")
                            },
                            { $set: guildData.compact }
                        );
                        extendedguilds.updateOne(
                            {
                                guildName: new RegExp(guildName, "i")
                            },
                            { $set: guildData.extended }
                        );
                    }

                    res.send(guildData.extended);
                } catch (err) {
                    res.send(JSON.stringify({ err }));
                }
            } else {
                res.send(guild);
            }
        });

        app.listen(port, () => console.log(`Server listening on port ${port}`));
    }
);
