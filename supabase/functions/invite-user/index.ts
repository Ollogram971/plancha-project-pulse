import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type AppRole = "admin" | "validateur" | "contributeur" | "lecteur";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function isValidEmail(email: string) {
  // Practical validation (not RFC-perfect) + length limit
  if (email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")?.trim();
    const SUPABASE_PUBLISHABLE_KEY = Deno.env.get("SUPABASE_ANON_KEY")?.trim();
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();

    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing required environment variables");
      return json(500, { error: "Server misconfiguration" });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json(401, { error: "Unauthorized" });
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return json(401, { error: "Unauthorized" });
    }

    const { email, role } = (await req.json()) as { email?: string; role?: AppRole };

    if (!email || !isValidEmail(email)) {
      return json(400, { error: "Invalid email" });
    }

    const allowedRoles: AppRole[] = ["admin", "validateur", "contributeur", "lecteur"];
    if (!role || !allowedRoles.includes(role)) {
      return json(400, { error: "Invalid role" });
    }

    // Verify caller identity (publishable client)
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      console.warn("Unauthorized caller", authError?.message);
      return json(401, { error: "Unauthorized" });
    }

    // Admin client for privileged operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Server-side authorization: caller must be admin
    const { data: adminRows, error: roleCheckError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .limit(1);

    if (roleCheckError) {
      console.error("Role check failed", roleCheckError);
      return json(500, { error: "Authorization check failed" });
    }

    if (!adminRows || adminRows.length === 0) {
      return json(403, { error: "Forbidden" });
    }

    // Invite the user
    const { data: inviteData, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email);

    if (inviteError || !inviteData?.user?.id) {
      console.error("Invite failed", inviteError);
      return json(400, { error: inviteError?.message ?? "Invite failed" });
    }

    const invitedUserId = inviteData.user.id;

    // Ensure a single role row for this user
    const { error: deleteRoleError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", invitedUserId);

    if (deleteRoleError) {
      console.error("Failed clearing roles", deleteRoleError);
      return json(500, { error: "Failed to assign role" });
    }

    const { error: insertRoleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: invitedUserId, role });

    if (insertRoleError) {
      console.error("Failed inserting role", insertRoleError);
      return json(500, { error: "Failed to assign role" });
    }

    return json(200, { success: true });
  } catch (error) {
    console.error("invite-user error", error);
    return json(500, { error: "Internal server error" });
  }
});
