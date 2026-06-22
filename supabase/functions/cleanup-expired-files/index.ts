import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: expired, error: selErr } = await supabase
      .from("shared_files")
      .select("id, storage_path")
      .lt("expires_at", new Date().toISOString());

    if (selErr) throw selErr;

    let removedStorage = 0;
    let removedRows = 0;

    if (expired && expired.length > 0) {
      const paths = expired.map((f) => f.storage_path);
      const { error: storageErr } = await supabase.storage.from("shared-files").remove(paths);
      if (storageErr) console.error("storage remove err:", storageErr);
      else removedStorage = paths.length;

      const ids = expired.map((f) => f.id);
      const { error: delErr, count } = await supabase
        .from("shared_files")
        .delete({ count: "exact" })
        .in("id", ids);
      if (delErr) throw delErr;
      removedRows = count ?? 0;
    }

    return new Response(
      JSON.stringify({ ok: true, removedStorage, removedRows }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
