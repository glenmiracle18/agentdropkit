import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

const { GET, POST } = toNextJsHandler(auth);

export { GET, POST };