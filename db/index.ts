// Database client. Import in API routes: import { db } from "@/db";
// Query example: const rows = await db.select().from(posts);
// Uses lazy initialization to avoid build-time errors when DATABASE_URL is not set.

import { neon } from "@neondatabase/serverless";
import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let _db: NeonHttpDatabase<typeof schema> | null = null;

export const db: NeonHttpDatabase<typeof schema> = new Proxy(
  {} as NeonHttpDatabase<typeof schema>,
  {
    get(_target, prop) {
      if (!_db) {
        const sql = neon(process.env.DATABASE_URL!);
        _db = drizzle(sql, { schema });
      }
      return (_db as unknown as Record<string | symbol, unknown>)[prop];
    },
  }
);