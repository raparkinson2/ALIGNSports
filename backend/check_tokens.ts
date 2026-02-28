import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, key);

// Check all push tokens
const { data: tokens, error: tokenErr } = await supabase
  .from("push_tokens")
  .select("*")
  .order("last_seen", { ascending: false });

console.log("=== push_tokens ===");
console.log("Error:", tokenErr?.message);
console.log("Rows:", JSON.stringify(tokens, null, 2));

// Also check a sample of players to confirm ID format
const { data: players, error: playerErr } = await supabase
  .from("players")
  .select("id, first_name, last_name, email")
  .limit(5);

console.log("\n=== sample players ===");
console.log("Error:", playerErr?.message);
console.log("Rows:", JSON.stringify(players, null, 2));
