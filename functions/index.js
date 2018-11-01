const firebase = require("firebase-admin");
const functions = require("firebase-functions");
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
