// Verifies a JWT against the secret belonging to the service it CLAIMS
// to be — not a shared global secret. This means a token signed with
// service A's secret cannot be validated as service B, even if an
// attacker edits the unverified 'service' claim, because the signature
// check below always re-derives the expected secret from the registry
// and will fail if it doesn't match the key that actually signed it.

const jwt = require("jsonwebtoken");
const { getSecret, hasIdentity } = require("./identity-registry");

function verifyToken(token) {
  // Step 1: decode WITHOUT verifying, purely to read the claimed service
  // name. This payload is untrusted until step 2 confirms the signature.
  const unverified = jwt.decode(token);

  if (!unverified || typeof unverified !== "object" || !unverified.service) {
    return null;
  }

  const claimedService = unverified.service;

  if (!hasIdentity(claimedService)) {
    return null;
  }

  const secret = getSecret(claimedService);

  try {
    // Step 2: verify signature + expiry using THAT service's own secret.
    const verified = jwt.verify(token, secret);
    return verified;
  } catch (err) {
    return null;
  }
}

module.exports = { verifyToken };
