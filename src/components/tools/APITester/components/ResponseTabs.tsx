import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText, List } from 'lucide-react';
import type { ResponseData } from '../types';

interface ResponseTabsProps {
  response: ResponseData;
  onTabChange?: (tab: string) => void;
}

export function ResponseTabs({ response, onTabChange }: ResponseTabsProps) {
  const [activeTab, setActiveTab] = useState('body');

  const headerCount = Object.keys(response.headers).length;

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onTabChange?.(value);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="w-full justify-start border-b rounded-none h-auto p-0">
        <TabsTrigger
          value="body"
          className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
        >
          <FileText className="h-4 w-4" />
          Body
        </TabsTrigger>
        <TabsTrigger
          value="headers"
          className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
        >
          <List className="h-4 w-4" />
          Headers
          <Badge variant="secondary" className="ml-1">
            {headerCount}
          </Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="body" className="p-4">
        <pre className="text-sm font-mono whitespace-pre-wrap break-all">
          {response.body || <span className="text-muted-foreground">No body content</span>}
        </pre>
      </TabsContent>

      <TabsContent value="headers" className="p-4">
        {headerCount === 0 ? (
          <div className="text-sm text-muted-foreground">No headers</div>
        ) : (
          <div className="space-y-2">
            {Object.entries(response.headers).map(([key, value]) => (
              <div key={key} className="flex gap-2 text-sm">
                <span className="font-semibold min-w-[200px]">{key}:</span>
                <span className="font-mono text-muted-foreground break-all">{value}</span>
              </div>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
