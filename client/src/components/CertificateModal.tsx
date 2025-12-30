import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Download, Share2, Medal } from "lucide-react";
import html2canvas from "html2canvas";

interface CertificateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  sceneName: string;
  date: string;
  certificateId: string;
}

export default function CertificateModal({ 
  open, 
  onOpenChange, 
  userName, 
  sceneName, 
  date,
  certificateId 
}: CertificateModalProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (certificateRef.current) {
      const canvas = await html2canvas(certificateRef.current);
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `红色文化传承证书-${certificateId}.png`;
      link.click();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-transparent border-none shadow-none p-0">
        <div className="relative flex flex-col items-center">
          {/* Certificate Card */}
          <div 
            ref={certificateRef}
            className="w-full aspect-[1.414/1] bg-[#fdfbf7] rounded-lg shadow-2xl p-8 border-[12px] border-double border-[#8B0000] relative overflow-hidden flex flex-col items-center justify-center text-center"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
               <Medal className="w-96 h-96 text-[#8B0000]" />
            </div>
            
            {/* Header */}
            <div className="mb-8">
              <Medal className="w-16 h-16 text-[#8B0000] mx-auto mb-4" />
              <h1 className="text-4xl font-serif font-bold text-[#8B0000] tracking-widest mb-2">红色文化传承证书</h1>
              <p className="text-[#8B0000]/60 uppercase tracking-[0.5em] text-xs">Certificate of Red Culture Inheritance</p>
            </div>

            {/* Content */}
            <div className="space-y-6 max-w-lg z-10">
              <p className="text-lg text-zinc-800 font-serif">
                兹证明
              </p>
              <h2 className="text-3xl font-bold text-zinc-900 border-b-2 border-zinc-200 pb-2 px-8 inline-block min-w-[200px]">
                {userName}
              </h2>
              <p className="text-lg text-zinc-800 font-serif leading-relaxed">
                于 <span className="font-bold">{date}</span> 在数字体验馆中完成了
                <br />
                <span className="text-[#8B0000] font-bold text-xl mx-2">“{sceneName}”</span>
                <br />
                的沉浸式学习体验，特发此证，以资鼓励。
              </p>
            </div>

            {/* Footer */}
            <div className="mt-12 w-full flex justify-between items-end px-12 z-10">
              <div className="text-left">
                <p className="text-xs text-zinc-500 mb-1">证书编号</p>
                <p className="font-mono text-sm text-zinc-700">{certificateId}</p>
              </div>
              <div className="text-right">
                <div className="w-32 h-12 bg-contain bg-no-repeat bg-right-bottom opacity-80" style={{ backgroundImage: "url('/images/logo-seal.png')" }}></div>
                <p className="text-sm font-bold text-[#8B0000] mt-2">冀忆红途 · 数字体验馆</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-6">
            <Button onClick={handleDownload} className="bg-white text-black hover:bg-zinc-100">
              <Download className="w-4 h-4 mr-2" /> 保存证书
            </Button>
            <Button variant="outline" className="bg-black/50 text-white border-white/20 hover:bg-black/70">
              <Share2 className="w-4 h-4 mr-2" /> 分享成就
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
