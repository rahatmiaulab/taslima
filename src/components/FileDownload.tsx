import { useState, useEffect } from "react";
import { Download, Search, FileIcon } from "lucide-react";
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
      const { data, error } = await supabase
        .from('shared_files')
        .select('*')
        .eq('share_code', searchCode.trim().toLowerCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast.error("File not found or has expired");
        } else {
          throw error;
        }
        setFileInfo(null);
        return;
      }

      // Check if file has expired
      if (new Date(data.expires_at) < new Date()) {
        toast.error("This file has expired and is no longer available");
        setFileInfo(null);
        return;
      }

      setFileInfo(data);
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
    if (!fileInfo) return;

    try {
      // Get download URL from storage
      const { data, error } = await supabase.storage
        .from('shared-files')
        .download(fileInfo.storage_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileInfo.file_name;
      link.click();
      URL.revokeObjectURL(url);

      // Update download count
      await supabase
        .from('shared_files')
        .update({ download_count: fileInfo.download_count + 1 })
        .eq('id', fileInfo.id);

      toast.success("Download started!");
    } catch (err: any) {
      toast.error(err.message || "Failed to download file");
      console.error(err);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="glass-card rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gradient-blue to-gradient-purple flex items-center justify-center shadow-lg">
            <Download className="w-8 h-8 text-white" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center mb-2 text-white">Download File</h2>
        <p className="text-center text-white/80 mb-8">
          🔍 Enter the file code to download
        </p>

        <div className="space-y-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Enter file code..."
              value={fileCode}
              onChange={(e) => setFileCode(e.target.value)}
              className="h-14 pl-12 bg-white/10 border-white/30 text-white placeholder:text-white/50 text-lg rounded-2xl"
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
          </div>

          <Button
            onClick={() => handleSearch()}
            disabled={isSearching}
            size="lg"
            className="w-full bg-gradient-to-r from-gradient-blue to-gradient-purple hover:opacity-90 text-white shadow-lg"
          >
            {isSearching ? (
              "Searching..."
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Find File
              </>
            )}
          </Button>

          {fileInfo && (
            <div className="bg-white/10 rounded-2xl p-6 space-y-4 mt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gradient-blue to-gradient-purple flex items-center justify-center flex-shrink-0">
                  <FileIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-lg mb-1 break-words">{fileInfo.file_name}</p>
                  <p className="text-sm text-white/60">
                    {(fileInfo.file_size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <p className="text-xs text-white/50 mt-2">
                    Expires: {new Date(fileInfo.expires_at).toLocaleString()}
                  </p>
                  <p className="text-xs text-white/50">
                    Downloads: {fileInfo.download_count}
                  </p>
                </div>
              </div>

              <Button
                onClick={handleDownload}
                size="lg"
                className="w-full bg-gradient-to-r from-gradient-purple to-gradient-pink hover:opacity-90 text-white shadow-lg"
              >
                <Download className="w-5 h-5 mr-2" />
                Download File
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
