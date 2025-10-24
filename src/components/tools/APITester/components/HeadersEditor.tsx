import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import type { Header } from '../types';

interface HeadersEditorProps {
  headers: Header[];
  onChange: (headers: Header[]) => void;
}

export function HeadersEditor({ headers, onChange }: HeadersEditorProps) {
  const handleAddHeader = () => {
    onChange([...headers, { key: '', value: '', enabled: true }]);
  };

  const handleUpdateKey = (index: number, key: string) => {
    const updatedHeaders = [...headers];
    updatedHeaders[index] = { ...updatedHeaders[index], key };
    onChange(updatedHeaders);
  };

  const handleUpdateValue = (index: number, value: string) => {
    const updatedHeaders = [...headers];
    updatedHeaders[index] = { ...updatedHeaders[index], value };
    onChange(updatedHeaders);
  };

  const handleToggleEnabled = (index: number) => {
    const updatedHeaders = [...headers];
    updatedHeaders[index] = {
      ...updatedHeaders[index],
      enabled: !updatedHeaders[index].enabled,
    };
    onChange(updatedHeaders);
  };

  const handleDelete = (index: number) => {
    const updatedHeaders = headers.filter((_, i) => i !== index);
    onChange(updatedHeaders);
  };

  if (headers.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 text-muted-foreground">
          <p>No headers added yet</p>
        </div>
        <Button onClick={handleAddHeader} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Header
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Enabled</TableHead>
            <TableHead>Key</TableHead>
            <TableHead>Value</TableHead>
            <TableHead className="w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {headers.map((header, index) => (
            <TableRow key={index}>
              <TableCell>
                <Checkbox
                  checked={header.enabled}
                  onCheckedChange={() => handleToggleEnabled(index)}
                  aria-label={`Enable ${header.key || 'header'}`}
                />
              </TableCell>
              <TableCell>
                <Input
                  value={header.key}
                  onChange={(e) => handleUpdateKey(index, e.target.value)}
                  placeholder="Header name"
                  className="h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={header.value}
                  onChange={(e) => handleUpdateValue(index, e.target.value)}
                  placeholder="Header value"
                  className="h-8"
                />
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(index)}
                  aria-label={`Delete header ${header.key || index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button onClick={handleAddHeader} className="w-full" variant="outline">
        <Plus className="mr-2 h-4 w-4" />
        Add Header
      </Button>
    </div>
  );
}
