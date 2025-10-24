import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';

export interface QueryParam {
  key: string;
  value: string;
}

interface QueryParamsEditorProps {
  params: QueryParam[];
  onChange: (params: QueryParam[]) => void;
}

export function QueryParamsEditor({ params, onChange }: QueryParamsEditorProps) {
  const handleAdd = () => {
    onChange([...params, { key: '', value: '' }]);
  };

  const handleDelete = (index: number) => {
    const newParams = params.filter((_, i) => i !== index);
    onChange(newParams);
  };

  const handleKeyChange = (index: number, key: string) => {
    const newParams = [...params];
    newParams[index] = { ...newParams[index], key };
    onChange(newParams);
  };

  const handleValueChange = (index: number, value: string) => {
    const newParams = [...params];
    newParams[index] = { ...newParams[index], value };
    onChange(newParams);
  };

  if (params.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Query Parameters</span>
            <Badge variant="secondary">0</Badge>
          </div>
          <Button variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" />
            Add Parameter
          </Button>
        </div>
        <div className="p-8 text-center text-muted-foreground border rounded-md">
          No query parameters
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Query Parameters</span>
          <Badge variant="secondary">{params.length}</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-1" />
          Add Parameter
        </Button>
      </div>

      <div className="border rounded-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3 text-sm font-semibold">Key</th>
              <th className="text-left p-3 text-sm font-semibold">Value</th>
              <th className="w-16"></th>
            </tr>
          </thead>
          <tbody>
            {params.map((param, index) => (
              <tr key={index} className="border-t">
                <td className="p-2">
                  <Input
                    value={param.key}
                    onChange={(e) => handleKeyChange(index, e.target.value)}
                    placeholder="Key"
                    className="border-0 focus-visible:ring-0"
                  />
                </td>
                <td className="p-2">
                  <Input
                    value={param.value}
                    onChange={(e) => handleValueChange(index, e.target.value)}
                    placeholder="Value"
                    className="border-0 focus-visible:ring-0"
                  />
                </td>
                <td className="p-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(index)}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
