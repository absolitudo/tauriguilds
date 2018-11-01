require("dotenv").config();
const firebase = require("firebase-admin");
const functions = require("firebase-functions");
const TauriApi = require("./tauriApi");
const tauriApi = new TauriApi(
    process.env.TAURI_API_KEY,
    process.env.TAURI_API_SECRET
);

firebase.initializeApp(JSON.parse(process.env.FIREBASE_CONFIG));

exports.helloWorld = functions.https.onRequest((request, response) => {
    firebase
        .database()
        .ref("tauriguilds")
        .set({
            hi: "hello"
        })
        .then(something => response.send("set?"));
});

exports.getGuilds = functions.https.onRequest((request, response) => {
    firebase
        .database()
        .ref("tauriguilds")
        .once("value")
        .then(snapshot => {
            response.send(snapshot.val());
        });
});
