// Trust Firebase Authentication ID tokens (project debrief-3ef06).
// Convex validates the JWT against Google's public keys for this issuer and
// exposes the result via ctx.auth.getUserIdentity() — where identity.subject
// is the Firebase uid.
export default {
  providers: [
    {
      domain: "https://securetoken.google.com/debrief-3ef06",
      applicationID: "debrief-3ef06",
    },
  ],
};
