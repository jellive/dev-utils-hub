import { useEffect, useState } from 'react';
import { ExternalLink, Github } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  // Get version from package.json via import.meta.env
  const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';

  // Get Electron versions via API
  const [platformInfo, setPlatformInfo] = useState<{
    electron: string;
    chrome: string;
    node: string;
  }>({
    electron: 'N/A',
    chrome: 'N/A',
    node: 'N/A',
  });

  useEffect(() => {
    const loadPlatformInfo = async () => {
      if (window.api?.getPlatformInfo) {
        try {
          const info = await window.api.getPlatformInfo();
          setPlatformInfo({
            electron: info.versions.electron || 'N/A',
            chrome: info.versions.chrome || 'N/A',
            node: info.versions.node || 'N/A',
          });
        } catch (error) {
          console.error('Failed to get platform info:', error);
        }
      }
    };
    loadPlatformInfo();
  }, []);

  const handleOpenGitHub = () => {
    window.open('https://github.com/yourusername/dev-utils-hub', '_blank');
  };

  const handleReportIssue = () => {
    window.open('https://github.com/yourusername/dev-utils-hub/issues/new', '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-2">
            {/* App Icon */}
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-foreground">DU</span>
            </div>
            <div>
              <DialogTitle className="text-2xl">Dev Utils Hub</DialogTitle>
              <DialogDescription>개발자를 위한 유틸리티 모음</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Version Information */}
          <div>
            <h3 className="text-sm font-semibold mb-2">버전 정보</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>앱 버전:</span>
                <span className="font-mono">{appVersion}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Tech Stack */}
          <div>
            <h3 className="text-sm font-semibold mb-2">기술 스택</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Electron:</span>
                <span className="font-mono">{platformInfo.electron}</span>
              </div>
              <div className="flex justify-between">
                <span>Chromium:</span>
                <span className="font-mono">{platformInfo.chrome}</span>
              </div>
              <div className="flex justify-between">
                <span>Node.js:</span>
                <span className="font-mono">{platformInfo.node}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Links */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleOpenGitHub}
            >
              <Github className="h-4 w-4 mr-2" />
              GitHub Repository
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleReportIssue}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
          </div>

          <Separator />

          {/* Copyright */}
          <div className="text-center text-sm text-muted-foreground">
            © 2025 Dev Utils Hub
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
