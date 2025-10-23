import { memo } from 'react';
import { Code, Settings, Download, Github, Info, Sun, Moon } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Switch } from './ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

export const Header = memo(function Header() {
  const { darkMode, toggleDarkMode, installPWA, canInstallPWA } = useAppStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Code className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Dev Utils Hub</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Developer Tools Collection
            </p>
          </div>
        </div>

        {/* Actions */}
        <TooltipProvider>
          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-muted-foreground" />
                  <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
                  <Moon className="h-4 w-4 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle dark mode</p>
              </TooltipContent>
            </Tooltip>

            {/* Settings Menu */}
            <Tooltip>
              <DropdownMenu>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Settings className="h-5 w-5" />
                      <span className="sr-only">Settings</span>
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Settings</p>
                </TooltipContent>
                <DropdownMenuContent align="end" className="w-56">
                  {canInstallPWA && (
                    <>
                      <DropdownMenuItem onClick={installPWA}>
                        <Download className="mr-2 h-4 w-4" />
                        <span>Install PWA</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <a
                      href="https://github.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer"
                    >
                      <Github className="mr-2 h-4 w-4" />
                      <span>GitHub</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Info className="mr-2 h-4 w-4" />
                    <span>About</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </header>
  );
});
