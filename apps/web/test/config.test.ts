import { describe, expect, it } from "vitest";
import { readAuthConfig } from "../src/auth/config";
const jwt = (role: string) => `header.${btoa(JSON.stringify({ role }))}.signature`;
describe("configuração pública", () => {
  it("aceita publishable ou anon e recusa credenciais privadas", () => {
    expect(readAuthConfig("https://project.supabase.co", "sb_publishable_example")).not.toBeNull();
    expect(readAuthConfig("https://project.supabase.co", jwt("anon"))).not.toBeNull();
    expect(readAuthConfig("https://project.supabase.co", jwt("service_role"))).toBeNull();
    expect(readAuthConfig("https://project.supabase.co", "sb_secret_example")).toBeNull();
    expect(readAuthConfig("postgresql://user:password@host/db", "sb_publishable_example")).toBeNull();
    expect(readAuthConfig(undefined, undefined)).toBeNull();
  });
});