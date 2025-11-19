import { useState, useEffect } from "react";
import { Zap } from "lucide-react";
import { FileUpload } from "@/components/FileUpload";
import { FileDownload } from "@/components/FileDownload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [activeTab, setActiveTab] = useState("upload");
  const [shareCode, setShareCode] = useState<string>("");

  // Check for share code in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setShareCode(code);
      setActiveTab("download");
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gradient-purple to-gradient-pink flex items-center justify-center shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-5xl font-bold">
              <span className="text-white">FAZ</span>
              <span className="gradient-text">share</span>
            </h1>
          </div>
          <p className="text-lg text-white/90">
            ⚡ Share files instantly with QR codes • 🔒 Secure • ⏱️ Expires in 48 hours
          </p>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 glass-card p-1.5 mb-8 h-auto">
            <TabsTrigger 
              value="upload" 
              className="text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-gradient-purple data-[state=active]:to-gradient-pink data-[state=active]:text-white py-3 rounded-xl text-base font-medium"
            >
              📤 Upload File
            </TabsTrigger>
            <TabsTrigger 
              value="download"
              className="text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-gradient-blue data-[state=active]:to-gradient-purple data-[state=active]:text-white py-3 rounded-xl text-base font-medium"
            >
              📥 Download File
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="mt-0">
            <FileUpload />
          </TabsContent>
          
          <TabsContent value="download" className="mt-0">
            <FileDownload initialCode={shareCode} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
