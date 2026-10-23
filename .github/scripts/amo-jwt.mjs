// Generates a short-lived JWT (60 seconds) for the addons.mozilla.org API v5,
// which authenticates requests with an "Authorization: JWT <token>" header.
//
// Reads AMO_API_KEY (the JWT issuer) and AMO_API_SECRET (the JWT secret) from
// the environment and prints the token to stdout. Never log the secret.
//
// See https://addons-server.readthedocs.io/en/latest/topics/api/auth.html.
import crypto from "node:crypto";

const apiKey = process.env.AMO_API_KEY;
const apiSecret = process.env.AMO_API_SECRET;
if (!apiKey || !apiSecret) {
  console.error("AMO_API_KEY and AMO_API_SECRET must be set.");
  process.exit(1);
}

const b64u = (object) => Buffer.from(JSON.stringify(object)).toString("base64url");
const iat = Math.floor(Date.now() / 1000);
const input =
  b64u({ alg: "HS256", typ: "JWT" }) +
  "." +
  b64u({ iss: apiKey, iat, exp: iat + 60, jti: crypto.randomBytes(16).toString("hex") });
const signature = crypto.createHmac("sha256", apiSecret).update(input).digest("base64url");

process.stdout.write(`${input}.${signature}`);
