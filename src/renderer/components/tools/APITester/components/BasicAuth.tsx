import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Copy, X, Eye, EyeOff } from 'lucide-react';

interface BasicAuthProps {
  onChange: (credentials: { username: string; password: string } | null) => void;
}

export function BasicAuth({ onChange }: BasicAuthProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (value && password) {
      onChange({ username: value, password });
    } else {
      onChange(null);
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (username && value) {
      onChange({ username, password: value });
    } else {
      onChange(null);
    }
  };

  const handleClearUsername = () => {
    setUsername('');
    onChange(null);
  };

  const handleClearPassword = () => {
    setPassword('');
    onChange(null);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Base64 encode username:password
  const encodeCredentials = (user: string, pass: string): string => {
    const credentials = `${user}:${pass}`;
    return btoa(credentials);
  };

  const encodedCredentials = username && password ? encodeCredentials(username, password) : '';
  const authHeader = encodedCredentials ? `Basic ${encodedCredentials}` : '';

  const handleCopyHeader = async () => {
    await navigator.clipboard.writeText(authHeader);
  };

  const hasCredentials = username && password;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <Input
            id="username"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            className="pr-10"
          />
          {username && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={handleClearUsername}
              aria-label="Clear username"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            className="pr-20"
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
            {password && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleClearPassword}
                aria-label="Clear password"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={togglePasswordVisibility}
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={!hasCredentials}
          aria-label="Encode Credentials"
        >
          Encode Credentials
        </Button>
      </div>

      {encodedCredentials && (
        <>
          <div className="space-y-2">
            <Label>Encoded Credentials</Label>
            <div className="rounded-md border bg-muted p-3 font-mono text-sm break-all">
              {encodedCredentials}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Authorization Header</Label>
            <div className="relative">
              <div className="rounded-md border bg-muted p-3 pr-12 font-mono text-sm break-all">
                {authHeader}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={handleCopyHeader}
                aria-label="Copy"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
