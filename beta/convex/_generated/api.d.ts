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
import type * as conversations from "../conversations.js";
import type * as crons from "../crons.js";
import type * as friends from "../friends.js";
import type * as http from "../http.js";
import type * as messages from "../messages.js";
import type * as router from "../router.js";
import type * as unreadMessages from "../unreadMessages.js";
import type * as users from "../users.js";
import type * as voiceCalls from "../voiceCalls.js";

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
  conversations: typeof conversations;
  crons: typeof crons;
  friends: typeof friends;
  http: typeof http;
  messages: typeof messages;
  router: typeof router;
  unreadMessages: typeof unreadMessages;
  users: typeof users;
  voiceCalls: typeof voiceCalls;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
