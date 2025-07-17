const admin = require("firebase-admin");
const serviceAccount = require("./notification-d02b2-firebase-adminsdk-fbsvc-7910afc891.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
