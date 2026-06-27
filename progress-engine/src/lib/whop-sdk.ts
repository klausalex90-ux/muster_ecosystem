import Whop from "@whop/sdk";

export const whopsdk = new Whop({
  apiKey: process.env.WHOP_API_KEY ?? "missing_whop_api_key",
  appID: process.env.WHOP_APP_ID ?? "missing_whop_app_id",
});
