import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { password, action, id } = body as { password?: string; action?: string; id?: string };

    const ADMIN = Deno.env.get("ADMIN_PASSWORD") ?? "";
    if (!ADMIN || !password || !timingSafeEqual(password, ADMIN)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (action === "delete") {
      if (!id) {
        return new Response(JSON.stringify({ error: "Missing id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: row } = await supabase
        .from("shared_files")
        .select("storage_path")
        .eq("id", id)
        .maybeSingle();
      if (row?.storage_path) {
        await supabase.storage.from("shared-files").remove([row.storage_path]);
      }
      await supabase.from("shared_files").delete().eq("id", id);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // default: list
    const { data: files, error } = await supabase
      .from("shared_files")
      .select("*")
      .order("uploaded_at", { ascending: false });
    if (error) throw error;

    const withUrls = await Promise.all(
      (files ?? []).map(async (f) => {
        const { data: signed } = await supabase.storage
          .from("shared-files")
          .createSignedUrl(f.storage_path, 600);
        return { ...f, signedUrl: signed?.signedUrl ?? null };
      }),
    );

    return new Response(JSON.stringify({ files: withUrls }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
