import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { code } = await req.json();
    if (!code || typeof code !== "string" || code.length > 32) {
      return new Response(JSON.stringify({ error: "Invalid code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const normalized = code.trim().toLowerCase();
    const { data, error } = await supabase.rpc("get_file_by_code", { _code: normalized });
    if (error) throw error;
    const file = Array.isArray(data) ? data[0] : data;
    if (!file) {
      return new Response(JSON.stringify({ error: "File not found or expired" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: signed, error: signErr } = await supabase.storage
      .from("shared-files")
      .createSignedUrl(file.storage_path, 300);
    if (signErr) throw signErr;

    await supabase.rpc("increment_download_count", { _code: normalized });

    return new Response(
      JSON.stringify({
        file: {
          file_name: file.file_name,
          file_size: file.file_size,
          file_type: file.file_type,
          share_code: file.share_code,
          expires_at: file.expires_at,
          download_count: (file.download_count ?? 0) + 1,
        },
        signedUrl: signed.signedUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
