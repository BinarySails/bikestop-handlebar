import { getMeHandlerUrl } from "./api";

const baseUrl = getMeHandlerUrl().replace(/\/auth\/me$/, "");

console.info("[api] base URL:", baseUrl);
