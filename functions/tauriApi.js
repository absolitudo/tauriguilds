require("dotenv").config();
const fetch = require("node-fetch");

let baseurl = "http://chapi.tauri.hu/apiIndex.php";
let apiSecret = process.env.TAURI_SECRET;
let apiKey = process.env.TAURI_API_KEY;
let url = baseurl + "?apikey=" + apiKey;

let obj = {
    secret: apiSecret,
    url: "character-sheet",
    params: {
        r: "[HU] Tauri WoW Server",
        n: "Metcol"
    }
};

fetch(url, {
    method: "POST",
    body: encodeURIComponent(JSON.stringify(obj))
})
    .then(res => res.json())
    .then(res => console.log(res));
