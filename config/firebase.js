const admin = require("firebase-admin");
const serviceAccount = require("./notification-d02b2-firebase-adminsdk-fbsvc-25911f99bb.json");
// const serviceAccount = JSON.parse(
//   Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf-8")
// );
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
