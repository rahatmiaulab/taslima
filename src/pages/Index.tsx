import { useState, useEffect } from "react";
import { Zap, Upload, Download, Shield, Clock, QrCode } from "lucide-react";
import { FileUpload } from "@/components/FileUpload";
import { FileDownload } from "@/components/FileDownload";
import { TopDownloads } from "@/components/TopDownloads";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [activeTab, setActiveTab] = useState("upload");
  const [shareCode, setShareCode] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setShareCode(code);
      setActiveTab("download");
    }
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 pointer-events-none" />
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="text-center max-w-3xl mx-auto">
            {/* Logo */}
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-xl shadow-primary/30 rotate-3">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                <span className="text-white">taslima</span>
                <span className="gradient-text"> share</span>
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl text-white/80 font-light mb-8">
              Share files instantly with QR codes
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-white/80">Secure</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-white/80">48h expiry</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
                <QrCode className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-white/80">QR sharing</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upload/Download Section */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 glass-card p-1.5 mb-6 h-auto rounded-xl">
                <TabsTrigger 
                  value="upload" 
                  className="flex items-center gap-2 text-white/70 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary py-3.5 rounded-lg text-base font-medium transition-all"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </TabsTrigger>
                <TabsTrigger 
                  value="download"
                  className="flex items-center gap-2 text-white/70 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-primary py-3.5 rounded-lg text-base font-medium transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <FileUpload />
              </TabsContent>
              
              <TabsContent value="download" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <FileDownload initialCode={shareCode} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Top Downloads Sidebar */}
          <div className="lg:col-span-1">
            <TopDownloads />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6">
        <div className="container mx-auto px-4 text-center space-y-2">
          <p className="text-sm text-white/40">
            Files are automatically deleted after 48 hours • All uploads are encrypted
          </p>
          <a href="/admin" className="text-xs text-white/30 hover:text-white/60 transition-colors">Admin</a>
        </div>
      </footer>
    </div>
  );
};

export default Index;