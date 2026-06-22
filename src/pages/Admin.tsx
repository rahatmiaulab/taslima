import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Shield, Trash2, Download, FileIcon, ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AdminFile {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  share_code: string;
  storage_path: string;
  uploaded_at: string;
  expires_at: string;
  download_count: number;
  signedUrl: string | null;
}

const SESSION_KEY = "fazshare_admin_pw";

const Admin = () => {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<AdminFile[]>([]);

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      setAuthed(saved);
      loadFiles(saved);
    }
  }, []);

  const loadFiles = async (pw: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-files", {
        body: { password: pw },
      });
      if (error || data?.error) throw new Error(data?.error || "Unauthorized");
      setFiles(data.files || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load");
      sessionStorage.removeItem(SESSION_KEY);
      setAuthed(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-files", {
        body: { password },
      });
      if (error || data?.error) {
        toast.error("Wrong password");
        return;
      }
      sessionStorage.setItem(SESSION_KEY, password);
      setAuthed(password);
      setFiles(data.files || []);
      toast.success("Welcome admin");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(null);
    setFiles([]);
    setPassword("");
  };

  const remove = async (id: string) => {
    if (!authed || !confirm("Delete this file permanently?")) return;
    try {
      const { data, error } = await supabase.functions.invoke("admin-files", {
        body: { password: authed, action: "delete", id },
      });
      if (error || data?.error) throw new Error(data?.error || "Failed");
      setFiles((f) => f.filter((x) => x.id !== id));
      toast.success("File deleted");
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
  };

  const formatSize = (b: number) =>
    b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <form onSubmit={login} className="glass-card rounded-3xl p-8 max-w-md w-full space-y-5">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin access</h1>
            <p className="text-white/60 text-sm mt-1">Enter the admin password to continue</p>
          </div>
          <Input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 bg-white/5 border-white/20 text-white"
            autoFocus
          />
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-gradient-to-r from-primary to-secondary text-white font-semibold"
          >
            {loading ? "Checking..." : "Unlock"}
          </Button>
          <Link to="/" className="block text-center text-sm text-white/60 hover:text-white">
            <ArrowLeft className="w-4 h-4 inline mr-1" /> Back to home
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen container mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Admin panel</h1>
            <p className="text-sm text-white/60">{files.length} files total</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/"><Button variant="outline" className="bg-white/10 text-white border-white/20"><ArrowLeft className="w-4 h-4 mr-2" />Home</Button></Link>
          <Button onClick={logout} variant="outline" className="bg-white/10 text-white border-white/20"><LogOut className="w-4 h-4 mr-2" />Logout</Button>
        </div>
      </div>

      {loading ? (
        <p className="text-white/60 text-center py-12">Loading...</p>
      ) : files.length === 0 ? (
        <p className="text-white/60 text-center py-12">No files uploaded yet</p>
      ) : (
        <div className="grid gap-3">
          {files.map((f) => {
            const expired = new Date(f.expires_at) < new Date();
            return (
              <div key={f.id} className="glass-card rounded-2xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <FileIcon className="w-6 h-6 text-white/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{f.file_name}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-white/50 mt-1">
                    <span className="font-mono uppercase tracking-wider text-accent">{f.share_code}</span>
                    <span>{formatSize(f.file_size)}</span>
                    <span>{f.download_count} downloads</span>
                    <span className={expired ? "text-red-400" : ""}>
                      {expired ? "Expired" : `Expires ${new Date(f.expires_at).toLocaleString()}`}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {f.signedUrl && (
                    <a href={f.signedUrl} target="_blank" rel="noreferrer">
                      <Button size="icon" variant="outline" className="bg-white/10 border-white/20 text-white">
                        <Download className="w-4 h-4" />
                      </Button>
                    </a>
                  )}
                  <Button size="icon" variant="outline" onClick={() => remove(f.id)} className="bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Admin;
