// import { useState, useEffect } from "react";
// import { TrendingUp, FileIcon, Download } from "lucide-react";
// import { supabase } from "@/integrations/supabase/client";

// interface FileData {
//   id: string;
//   file_name: string;
//   file_size: number;
//   download_count: number;
//   uploaded_at: string;
// }

// export const TopDownloads = () => {
//   const [files, setFiles] = useState<FileData[]>([]);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     fetchTopFiles();
//   }, []);

//   const fetchTopFiles = async () => {
//     try {
//       const { data, error } = await supabase
//         .from('shared_files')
//         .select('id, file_name, file_size, download_count, uploaded_at')
//         .gt('expires_at', new Date().toISOString())
//         .order('download_count', { ascending: false })
//         .limit(20);

//       if (error) throw error;
//       setFiles(data || []);
//     } catch (err) {
//       console.error('Failed to fetch top files:', err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const formatFileSize = (bytes: number) => {
//     if (bytes < 1024) return `${bytes} B`;
//     if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
//     return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
//   };

//   const getTimeAgo = (date: string) => {
//     const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
//     if (seconds < 60) return 'just now';
//     if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
//     if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
//     return `${Math.floor(seconds / 86400)}d ago`;
//   };

//   if (isLoading) {
//     return (
//       <div className="glass-card rounded-3xl p-8 animate-pulse">
//         <div className="h-8 bg-white/10 rounded w-48 mb-6"></div>
//         <div className="space-y-3">
//           {[...Array(5)].map((_, i) => (
//             <div key={i} className="h-16 bg-white/5 rounded-xl"></div>
//           ))}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="glass-card rounded-3xl p-6 md:p-8">
//       <div className="flex items-center gap-3 mb-6">
//         <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
//           <TrendingUp className="w-5 h-5 text-white" />
//         </div>
//         <h3 className="text-xl font-bold text-white">Top 20 Downloads</h3>
//       </div>

//       {files.length === 0 ? (
//         <p className="text-white/60 text-center py-8">No files uploaded yet</p>
//       ) : (
//         <div className="space-y-2">
//           {files.map((file, index) => (
//             <div
//               key={file.id}
//               className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
//             >
//               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm font-bold text-white shrink-0">
//                 {index + 1}
//               </div>
//               <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
//                 <FileIcon className="w-4 h-4 text-white/70" />
//               </div>
//               <div className="flex-1 min-w-0">
//                 <p className="text-sm font-medium text-white truncate">{file.file_name}</p>
//                 <p className="text-xs text-white/50">{formatFileSize(file.file_size)} • {getTimeAgo(file.uploaded_at)}</p>
//               </div>
//               <div className="flex items-center gap-1 text-white/60 shrink-0">
//                 <Download className="w-3.5 h-3.5" />
//                 <span className="text-sm font-medium">{file.download_count}</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };
