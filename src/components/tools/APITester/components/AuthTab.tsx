import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type AuthMode = 'bearer' | 'basic' | 'apikey';

export interface AuthConfig {
  mode: AuthMode;
  bearerToken?: string;
  basicAuth?: {
    username: string;
    password: string;
  };
  apiKey?: {
    key: string;
    keyName: string;
    placement: 'header' | 'query';
  };
}

interface AuthTabProps {
  onAuthChange: (config: AuthConfig | null) => void;
}

export function AuthTab({ onAuthChange }: AuthTabProps) {
  const [activeTab, setActiveTab] = useState<AuthMode>('bearer');
  const [bearerToken, setBearerToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');

  const handleBearerTokenChange = (value: string) => {
    setBearerToken(value);
    if (value) {
      onAuthChange({
        mode: 'bearer',
        bearerToken: value,
      });
    } else {
      onAuthChange(null);
    }
  };

  const handleBasicAuthChange = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    if (user && pass) {
      onAuthChange({
        mode: 'basic',
        basicAuth: {
          username: user,
          password: pass,
        },
      });
    } else {
      onAuthChange(null);
    }
  };

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    if (key) {
      onAuthChange({
        mode: 'apikey',
        apiKey: {
          key,
          keyName: 'X-API-Key',
          placement: 'header',
        },
      });
    } else {
      onAuthChange(null);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AuthMode)}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="bearer">Bearer Token</TabsTrigger>
        <TabsTrigger value="basic">Basic Auth</TabsTrigger>
        <TabsTrigger value="apikey">API Key</TabsTrigger>
      </TabsList>

      <TabsContent value="bearer" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bearer-token">Bearer Token</Label>
          <Input
            id="bearer-token"
            type="text"
            placeholder="Enter bearer token (e.g., JWT)"
            value={bearerToken}
            onChange={(e) => handleBearerTokenChange(e.target.value)}
          />
        </div>
      </TabsContent>

      <TabsContent value="basic" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => handleBasicAuthChange(e.target.value, password)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => handleBasicAuthChange(username, e.target.value)}
          />
        </div>
      </TabsContent>

      <TabsContent value="apikey" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key">API Key</Label>
          <Input
            id="api-key"
            type="text"
            placeholder="Enter API key"
            value={apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
