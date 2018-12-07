function validateGuildRequest(req, res, next) {
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

function validatePlayerRequest(req, res, next) {
    try {
        req.body.guildName = req.body.guildName.trim().replace(/\s+/, " ");
    } catch (err) {
        res.send(JSON.stringify({ err: "Invalid guild name." }));
    }

    try {
        req.body.playerName = req.body.playerName.trim().replace(/\s+/, " ");
    } catch (err) {
        res.send(JSON.stringify({ err: "Invalid player name." }));
    }

    try {
        req.body.realm = req.body.realm.trim().replace(/\s+/, " ");
    } catch (err) {
        res.send(JSON.stringify({ err: "Invalid realm name." }));
    }

    next();
}

module.exports = {
    validateGuildRequest,
    validatePlayerRequest
};
