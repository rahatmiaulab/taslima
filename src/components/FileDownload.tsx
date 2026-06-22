import { useState, useEffect } from "react";
import { Download, Search, FileIcon, Clock, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface FileDownloadProps {
  initialCode?: string;
}

export const FileDownload = ({ initialCode }: FileDownloadProps) => {
  const [fileCode, setFileCode] = useState(initialCode || "");
  const [isSearching, setIsSearching] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [fileInfo, setFileInfo] = useState<any>(null);

  useEffect(() => {
    if (initialCode) {
      handleSearch(initialCode);
    }
  }, [initialCode]);

  const handleSearch = async (code?: string) => {
    const searchCode = code || fileCode;
    if (!searchCode.trim()) {
      toast.error("Please enter a file code");
      return;
    }

    setIsSearching(true);

    try {
      const { data, error } = await supabase.functions.invoke('get-download', {
        body: { code: searchCode.trim().toLowerCase() },
      });

      if (error || !data?.signedUrl) {
        toast.error(data?.error || "File not found or has expired");
        setFileInfo(null);
        return;
      }

      setFileInfo({ ...data.file, signedUrl: data.signedUrl });
      toast.success("File found!");
    } catch (err: any) {
      toast.error(err.message || "Failed to search for file");
      console.error(err);
      setFileInfo(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDownload = async () => {
    if (!fileInfo?.signedUrl) return;

    setIsDownloading(true);

    try {
      const response = await fetch(fileInfo.signedUrl);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileInfo.file_name;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Download started!");
    } catch (err: any) {
      toast.error(err.message || "Failed to download file");
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - new Date().getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Less than 1 hour';
    if (hours < 24) return `${hours} hours`;
    return `${Math.floor(hours / 24)} days`;
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="space-y-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Enter file code..."
              value={fileCode}
              onChange={(e) => setFileCode(e.target.value)}
              className="h-14 pl-12 pr-4 bg-white/5 border-white/20 text-white placeholder:text-white/40 text-lg rounded-xl focus:border-accent focus:ring-accent/20"
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          </div>

          <Button
            onClick={() => handleSearch()}
            disabled={isSearching}
            size="lg"
            className="w-full h-14 bg-gradient-to-r from-accent to-primary hover:opacity-90 text-white text-lg font-semibold shadow-lg shadow-accent/30"
          >
            {isSearching ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Searching...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Find File
              </span>
            )}
          </Button>

          {fileInfo && (
            <div className="mt-6 space-y-4">
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shrink-0">
                    <FileIcon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-lg truncate mb-1">{fileInfo.file_name}</p>
                    <p className="text-sm text-white/60 mb-3">
                      {formatFileSize(fileInfo.file_size)}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-white/50">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Expires in {getTimeRemaining(fileInfo.expires_at)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-white/50">
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>{fileInfo.download_count} downloads</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                size="lg"
                className="w-full h-14 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white text-lg font-semibold shadow-lg shadow-primary/30"
              >
                {isDownloading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Downloading...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Download File
                  </span>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};