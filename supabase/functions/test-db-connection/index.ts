import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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

    // Attempt a real PostgreSQL connection using Deno's postgres driver
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
    
    // Run a simple query to verify the connection works
    const result = await client.queryObject("SELECT version()");
    const version = (result.rows[0] as Record<string, string>)?.version || "PostgreSQL";

    await client.end();

    return new Response(
      JSON.stringify({ success: true, version }),
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
