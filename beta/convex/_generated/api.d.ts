/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as directMessages from "../directMessages.js";
import type * as friends from "../friends.js";
import type * as http from "../http.js";
import type * as invites from "../invites.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as profiles from "../profiles.js";
import type * as reactions from "../reactions.js";
import type * as router from "../router.js";
import type * as servers from "../servers.js";
import type * as voice from "../voice.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  directMessages: typeof directMessages;
  friends: typeof friends;
  http: typeof http;
  invites: typeof invites;
  messages: typeof messages;
  notifications: typeof notifications;
  profiles: typeof profiles;
  reactions: typeof reactions;
  router: typeof router;
  servers: typeof servers;
  voice: typeof voice;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
