import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const REQUIRED_TABLES = [
  "app_settings",
  "attachments",
  "audit_log",
  "comments",
  "criteria",
  "criterion_scales",
  "poles",
  "profiles",
  "project_themes",
  "projects",
  "scores_calculated",
  "scores_raw",
  "themes",
  "user_roles",
  "weight_profiles",
  "weights",
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { host, port, database, username, password } = await req.json();

    if (!host || !port || !database || !username) {
      return new Response(
        JSON.stringify({ success: false, error: "Paramètres de connexion incomplets." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { Client } = await import("https://deno.land/x/postgres@v0.19.3/mod.ts");

    const client = new Client({
      hostname: host,
      port: parseInt(port, 10),
      database,
      user: username,
      password: password || "",
      tls: { enabled: false },
      connection: { attempts: 1 },
    });

    await client.connect();

    // Get version
    const versionResult = await client.queryObject("SELECT version()");
    const version = (versionResult.rows[0] as Record<string, string>)?.version || "PostgreSQL";

    // Check for required tables
    const tablesResult = await client.queryObject<{ tablename: string }>(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
    );
    const existingTables = tablesResult.rows.map(r => r.tablename);
    const missingTables = REQUIRED_TABLES.filter(t => !existingTables.includes(t));

    await client.end();

    return new Response(
      JSON.stringify({
        success: true,
        version,
        schema_valid: missingTables.length === 0,
        missing_tables: missingTables,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
