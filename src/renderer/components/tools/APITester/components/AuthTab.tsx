import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        <TabsTrigger value="bearer">{t('tools.api.auth.bearerToken')}</TabsTrigger>
        <TabsTrigger value="basic">{t('tools.api.auth.basicAuth')}</TabsTrigger>
        <TabsTrigger value="apikey">{t('tools.api.auth.apiKey')}</TabsTrigger>
      </TabsList>

      <TabsContent value="bearer" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bearer-token">{t('tools.api.auth.bearerToken')}</Label>
          <Input
            id="bearer-token"
            type="text"
            placeholder={t('tools.api.auth.bearerTokenPlaceholder')}
            value={bearerToken}
            onChange={(e) => handleBearerTokenChange(e.target.value)}
          />
        </div>
      </TabsContent>

      <TabsContent value="basic" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">{t('tools.api.auth.username')}</Label>
          <Input
            id="username"
            type="text"
            placeholder={t('tools.api.auth.username')}
            value={username}
            onChange={(e) => handleBasicAuthChange(e.target.value, password)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t('tools.api.auth.password')}</Label>
          <Input
            id="password"
            type="password"
            placeholder={t('tools.api.auth.password')}
            value={password}
            onChange={(e) => handleBasicAuthChange(username, e.target.value)}
          />
        </div>
      </TabsContent>

      <TabsContent value="apikey" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key">{t('tools.api.auth.apiKey')}</Label>
          <Input
            id="api-key"
            type="text"
            placeholder={t('tools.api.auth.apiKeyPlaceholder')}
            value={apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
