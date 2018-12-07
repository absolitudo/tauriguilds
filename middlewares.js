function validateGuildRequest(req, res, next) {
    try {
        req.body.guildName = req.body.guildName
            .trim()
            .replace(/\s+/, " ")
            .toLowerCase();
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
        req.body.guildName = req.body.guildName
            .trim()
            .replace(/\s+/, " ")
            .toLowerCase();
    } catch (err) {
        res.send(JSON.stringify({ err: "Invalid guild name." }));
    }

    try {
        req.body.playerId = Number(req.body.playerId.toString().trim());
    } catch (err) {
        res.send(JSON.stringify({ err: "Invalid player id." }));
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
