import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { HTTPMethod } from '../types';

const HTTP_METHODS: HTTPMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

interface MethodSelectorProps {
  value: HTTPMethod;
  onChange: (method: HTTPMethod) => void;
}

export function MethodSelector({ value, onChange }: MethodSelectorProps) {
  const { t } = useTranslation();

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[140px]" aria-label={t('tools.api.method')}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {HTTP_METHODS.map((method) => (
          <SelectItem key={method} value={method}>
            {method}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
