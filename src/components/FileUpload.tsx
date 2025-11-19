import { useState, useCallback } from "react";
import { Upload, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import QRCode from "qrcode";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const FileUpload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [shareLink, setShareLink] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
    }
  };

  const generateQRCode = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique share code
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_share_code');

      if (codeError) throw codeError;

      const shareCode = codeData;
      const fileExt = selectedFile.name.split('.').pop();
      const storagePath = `${shareCode}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('shared-files')
        .upload(storagePath, selectedFile, {
          cacheControl: '172800', // 48 hours
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('shared_files')
        .insert({
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          file_type: selectedFile.type,
          storage_path: storagePath,
          share_code: shareCode,
        });

      if (dbError) throw dbError;

      // Generate share link
      const link = `${window.location.origin}/?code=${shareCode}`;
      setShareLink(link);

      // Generate QR code
      const qr = await QRCode.toDataURL(link, {
        width: 256,
        margin: 2,
        color: {
          dark: "#6B21A8",
          light: "#FFFFFF",
        },
      });
      setQrCodeUrl(qr);
      toast.success("File uploaded successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload file");
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setQrCodeUrl("");
    setShareLink("");
  };

  const copyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      toast.success("Link copied to clipboard!");
    }
  };

  const downloadQR = () => {
    if (qrCodeUrl) {
      const link = document.createElement("a");
      link.download = "qr-code.png";
      link.href = qrCodeUrl;
      link.click();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="glass-card rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gradient-purple to-gradient-pink flex items-center justify-center shadow-lg">
            <Upload className="w-8 h-8 text-white" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center mb-2 text-white">Upload Your File</h2>
        <p className="text-center text-white/80 mb-8">
          ✨ Share files securely • 🔒 Expires in 48 hours
        </p>

        {!selectedFile ? (
          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
              isDragging
                ? "border-primary bg-primary/10 scale-105"
                : "border-white/30 bg-white/5 hover:border-white/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-white/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-white/60" />
            </div>
            <p className="text-lg font-medium text-white mb-2">Click to browse or drag & drop</p>
            <p className="text-sm text-white/60">All file types • Max 500MB</p>
            <input
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <Button
                variant="secondary"
                size="lg"
                className="mt-6 bg-white/20 hover:bg-white/30 text-white border-white/30"
                asChild
              >
                <span>Browse Files</span>
              </Button>
            </label>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white/10 rounded-2xl p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gradient-purple to-gradient-pink flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-white">{selectedFile.name}</p>
                  <p className="text-sm text-white/60">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={removeFile}
                className="text-white/60 hover:text-white hover:bg-white/10"
                disabled={isUploading}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {!qrCodeUrl ? (
              <Button
                onClick={generateQRCode}
                disabled={isUploading}
                size="lg"
                className="w-full bg-gradient-to-r from-gradient-purple to-gradient-pink hover:opacity-90 text-white shadow-lg"
              >
                <Upload className="w-5 h-5 mr-2" />
                {isUploading ? "Uploading..." : "Upload & Generate QR Code"}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-6 flex flex-col items-center">
                  <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64 mb-4" />
                  <p className="text-sm text-gray-600 text-center mb-4">
                    Scan this QR code to download the file
                  </p>
                  <div className="flex gap-2 w-full">
                    <Button
                      onClick={copyLink}
                      variant="outline"
                      className="flex-1"
                    >
                      Copy Link
                    </Button>
                    <Button
                      onClick={downloadQR}
                      variant="outline"
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download QR
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-center text-white/60 text-sm">
        Files are automatically deleted after 48 hours
      </p>
    </div>
  );
};
