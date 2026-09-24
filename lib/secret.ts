import { InfisicalSDK } from "@infisical/sdk";

export const secret = new InfisicalSDK({
  siteUrl: "https://app.infisical.com",
});

await secret.auth().universalAuth.login({
  clientId: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
});
