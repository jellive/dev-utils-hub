import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Download } from 'lucide-react';

export interface ExportOptions {
  count: number | 'all';
  format: 'txt' | 'json' | 'csv';
  includeMetadata: boolean;
}

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: ExportOptions) => void;
  totalCount: number;
  title?: string;
  description?: string;
}

type CountPreset = '10' | '50' | '100' | '500' | 'all' | 'custom';

export function ExportDialog({
  open,
  onOpenChange,
  onExport,
  totalCount,
  title = '히스토리 내보내기',
  description = '내보낼 항목 수와 파일 형식을 선택하세요',
}: ExportDialogProps) {
  const [countPreset, setCountPreset] = useState<CountPreset>('all');
  const [customCount, setCustomCount] = useState('');
  const [format, setFormat] = useState<'txt' | 'json' | 'csv'>('json');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [customCountError, setCustomCountError] = useState('');

  const validateCustomCount = (value: string): boolean => {
    if (!value.trim()) {
      setCustomCountError('개수를 입력하세요');
      return false;
    }

    const num = parseInt(value);
    if (isNaN(num)) {
      setCustomCountError('숫자를 입력하세요');
      return false;
    }

    if (num < 1) {
      setCustomCountError('1 이상의 값을 입력하세요');
      return false;
    }

    if (num > 10000) {
      setCustomCountError('10000 이하의 값을 입력하세요');
      return false;
    }

    if (num > totalCount) {
      setCustomCountError(`최대 ${totalCount}개까지 가능합니다`);
      return false;
    }

    setCustomCountError('');
    return true;
  };

  const handleCustomCountChange = (value: string) => {
    setCustomCount(value);
    if (value.trim()) {
      validateCustomCount(value);
    } else {
      setCustomCountError('');
    }
  };

  const handleExport = () => {
    let finalCount: number | 'all';

    if (countPreset === 'all') {
      finalCount = 'all';
    } else if (countPreset === 'custom') {
      if (!validateCustomCount(customCount)) {
        return;
      }
      finalCount = parseInt(customCount);
    } else {
      finalCount = parseInt(countPreset);
    }

    onExport({
      count: finalCount,
      format,
      includeMetadata,
    });

    // Reset form
    setCountPreset('all');
    setCustomCount('');
    setFormat('json');
    setIncludeMetadata(true);
    setCustomCountError('');
    onOpenChange(false);
  };

  const isExportDisabled = countPreset === 'custom' && (!customCount || !!customCountError);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Count Selection */}
          <div className="grid gap-2">
            <Label htmlFor="count-preset">내보낼 개수</Label>
            <Select
              value={countPreset}
              onValueChange={(value) => {
                setCountPreset(value as CountPreset);
                setCustomCountError('');
              }}
            >
              <SelectTrigger id="count-preset">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">최근 10개</SelectItem>
                <SelectItem value="50">최근 50개</SelectItem>
                <SelectItem value="100">최근 100개</SelectItem>
                <SelectItem value="500">최근 500개</SelectItem>
                <SelectItem value="all">전체 ({totalCount}개)</SelectItem>
                <SelectItem value="custom">사용자 지정</SelectItem>
              </SelectContent>
            </Select>

            {/* Custom Count Input */}
            {countPreset === 'custom' && (
              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="1 ~ 10000"
                  value={customCount}
                  onChange={(e) => handleCustomCountChange(e.target.value)}
                  min={1}
                  max={10000}
                  className={customCountError ? 'border-red-500' : ''}
                />
                {customCountError && (
                  <p className="text-sm text-red-500">{customCountError}</p>
                )}
              </div>
            )}
          </div>

          {/* Format Selection */}
          <div className="grid gap-2">
            <Label htmlFor="format">파일 형식</Label>
            <Select value={format} onValueChange={(value) => setFormat(value as 'txt' | 'json' | 'csv')}>
              <SelectTrigger id="format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON (.json)</SelectItem>
                <SelectItem value="txt">텍스트 (.txt)</SelectItem>
                <SelectItem value="csv">CSV (.csv)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Include Metadata */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-metadata"
              checked={includeMetadata}
              onCheckedChange={(checked) => setIncludeMetadata(checked as boolean)}
            />
            <Label
              htmlFor="include-metadata"
              className="text-sm font-normal cursor-pointer"
            >
              메타데이터 포함 (생성 시간, 도구 정보 등)
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleExport} disabled={isExportDisabled}>
            <Download className="mr-2 h-4 w-4" />
            내보내기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
