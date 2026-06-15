// Vercel serverless function entry point
// This imports the built server output from TanStack Start (node-server target)
import handler from "../.output/server/index.mjs";

export default handler;
