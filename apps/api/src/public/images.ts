import type { Database } from "../stores/repository.ts";
import { availableProductsSql } from "../catalog/repository.ts";

export async function publicImage(db: Database, id: string): Promise<{ data: Buffer; contentType: string } | null> {
  const result = await db.query<{url:string}>(`WITH available AS (${availableProductsSql})
    SELECT i.url FROM marketplace_v2.product_images i JOIN available p ON p.id=i.product_id WHERE i.id=$1`, [id]);
  const match = result.rows[0]?.url.match(/^data:image\/(jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match) return null;
  const data = Buffer.from(match[2], "base64");
  if (match[1] === "jpeg" ? !(data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) : !(data.toString("ascii",0,4) === "RIFF" && data.toString("ascii",8,12) === "WEBP")) return null;
  return { data, contentType: `image/${match[1]}` };
}
