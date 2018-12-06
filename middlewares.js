function valiDateGuildRequest(req, res, next) {
    const guildName = req.body.guildName;

    try {
        req.body.guildName = req.body.guildName.trim().replace(/\s+/, " ");
    } catch (err) {
        res.send(JSON.stringify({ err: "Invalid guild name." }));
    }

    try {
        req.body.realm = req.body.realm.trim().replace(/\s+/, " ");
    } catch (err) {
        req.body.realm = "[HU] Tauri WoW Server";
    }
    next();
}

module.exports = {
    valiDateGuildRequest
};
