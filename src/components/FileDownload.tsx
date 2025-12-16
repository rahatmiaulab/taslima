import { useState } from "react";
import { Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const FileDownload = () => {
  const [fileCode, setFileCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleDownload = async () => {
    if (!fileCode.trim()) {
      toast.error("Please enter a file code");
      return;
    }

    setIsSearching(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSearching(false);
      // In a real app, this would fetch the file from the server
      toast.info("Demo mode: File download would start here");
    }, 1000);
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
          🔍 Enter the file code or scan QR code
        </p>

        <div className="space-y-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Enter file code..."
              value={fileCode}
              onChange={(e) => setFileCode(e.target.value)}
              className="h-14 pl-12 bg-white/10 border-white/30 text-white placeholder:text-white/50 text-lg rounded-2xl"
              onKeyPress={(e) => e.key === "Enter" && handleDownload()}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
          </div>

          <Button
            onClick={handleDownload}
            disabled={isSearching}
            size="lg"
            className="w-full bg-gradient-to-r from-gradient-blue to-gradient-purple hover:opacity-90 text-white shadow-lg"
          >
            {isSearching ? (
              "Searching..."
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Find & Download
              </>
            )}
          </Button>
        </div>

        <div className="mt-8 pt-8 border-t border-white/20">
          <p className="text-center text-white/60 text-sm mb-4">Or use your camera to scan QR code</p>
          <div className="bg-white/10 rounded-2xl p-8 text-center">
            <div className="w-48 h-48 mx-auto rounded-xl border-2 border-dashed border-white/30 flex items-center justify-center">
              <p className="text-white/50 text-sm">QR Scanner Placeholder</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
