import { useState, useCallback } from "react";
import { Upload, X, Download, Copy, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import QRCode from "qrcode";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Allowed file types for security
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf', 'text/plain', 'text/csv',
  'application/zip', 'application/x-zip-compressed',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'audio/mpeg', 'audio/wav', 'audio/ogg',
  'video/mp4', 'video/webm', 'video/quicktime'
];

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export const FileUpload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [shareLink, setShareLink] = useState<string>("");
  const [shareCode, setShareCode] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }
    if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
      return "This file type is not allowed for security reasons";
    }
    return null;
  };

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
      const error = validateFile(files[0]);
      if (error) {
        toast.error(error);
        return;
      }
      setSelectedFile(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const error = validateFile(files[0]);
      if (error) {
        toast.error(error);
        return;
      }
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
          cacheControl: '172800',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('shared_files')
        .insert({
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          file_type: selectedFile.type || 'application/octet-stream',
          storage_path: storagePath,
          share_code: shareCode,
        });

      if (dbError) throw dbError;

      // Generate share link
      const link = `${window.location.origin}/?code=${shareCode}`;
      setShareLink(link);

      // Generate QR code with modern styling
      const qr = await QRCode.toDataURL(link, {
        width: 280,
        margin: 2,
        color: {
          dark: "#1a1a2e",
          light: "#FFFFFF",
        },
      });
      setQrCodeUrl(qr);
      setShareCode(shareCode);
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
    setShareCode("");
    setCopied(false);
    setCodeCopied(false);
  };

  const copyCode = async () => {
    if (shareCode) {
      await navigator.clipboard.writeText(shareCode);
      setCodeCopied(true);
      toast.success("Code copied!");
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };
  const copyLink = async () => {
    if (shareLink) {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
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
    <div className="space-y-6">
      <div className="glass-card rounded-3xl p-6 md:p-8 shadow-2xl">
        {!selectedFile ? (
          <div
            className={`relative border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all duration-300 ${
              isDragging
                ? "border-primary bg-primary/10 scale-[1.02]"
                : "border-white/20 hover:border-white/40 hover:bg-white/5"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30">
              <Upload className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Drop your file here</h3>
            <p className="text-white/60 mb-6">or click to browse</p>
            <input
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <Button
                variant="outline"
                size="lg"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/40"
                asChild
              >
                <span>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Select File
                </span>
              </Button>
            </label>
            <p className="text-xs text-white/40 mt-6">
              Images, documents, audio, video • Max 500MB
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-white/10">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{selectedFile.name}</p>
                  <p className="text-sm text-white/50">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={removeFile}
                className="text-white/50 hover:text-white hover:bg-white/10 shrink-0"
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
                className="w-full h-14 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white text-lg font-semibold shadow-lg shadow-primary/30"
              >
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Uploading...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Generate QR Code
                  </span>
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-6 flex flex-col items-center">
                  <img src={qrCodeUrl} alt="QR Code" className="w-56 h-56 mb-4" />
                  <p className="text-sm text-gray-500 text-center">
                    Scan to download instantly
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={copyLink}
                    variant="outline"
                    className="h-12 bg-white/10 hover:bg-white/20 text-white border-white/20"
                  >
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? "Copied!" : "Copy Link"}
                  </Button>
                  <Button
                    onClick={downloadQR}
                    variant="outline"
                    className="h-12 bg-white/10 hover:bg-white/20 text-white border-white/20"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Save QR
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};