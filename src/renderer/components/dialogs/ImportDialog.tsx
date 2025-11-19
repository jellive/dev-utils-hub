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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, AlertTriangle } from 'lucide-react';

export interface ImportOptions {
  skipDuplicates: boolean;
  replaceExisting: boolean;
}

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (options: ImportOptions) => void;
  title?: string;
  description?: string;
}

export function ImportDialog({
  open,
  onOpenChange,
  onImport,
  title = '히스토리 가져오기',
  description = '가져오기 옵션을 선택하세요',
}: ImportDialogProps) {
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [replaceExisting, setReplaceExisting] = useState(false);

  const handleSkipDuplicatesChange = (checked: boolean) => {
    setSkipDuplicates(checked);
    // Mutual exclusivity: if enabling skip duplicates, disable replace existing
    if (checked && replaceExisting) {
      setReplaceExisting(false);
    }
  };

  const handleReplaceExistingChange = (checked: boolean) => {
    setReplaceExisting(checked);
    // Mutual exclusivity: if enabling replace existing, disable skip duplicates
    if (checked && skipDuplicates) {
      setSkipDuplicates(false);
    }
  };

  const handleImport = () => {
    onImport({
      skipDuplicates,
      replaceExisting,
    });

    // Reset form
    setSkipDuplicates(true);
    setReplaceExisting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Skip Duplicates Option */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="skip-duplicates"
              checked={skipDuplicates}
              onCheckedChange={handleSkipDuplicatesChange}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="skip-duplicates"
                className="text-sm font-normal cursor-pointer"
              >
                중복 항목 건너뛰기
              </Label>
              <p className="text-sm text-muted-foreground">
                기존 히스토리에 동일한 항목이 있으면 건너뜁니다
              </p>
            </div>
          </div>

          {/* Replace Existing Option */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="replace-existing"
              checked={replaceExisting}
              onCheckedChange={handleReplaceExistingChange}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="replace-existing"
                className="text-sm font-normal cursor-pointer"
              >
                기존 데이터 교체
              </Label>
              <p className="text-sm text-muted-foreground">
                현재 히스토리를 삭제하고 가져온 데이터로 교체합니다
              </p>
            </div>
          </div>

          {/* Warning when replace existing is selected */}
          {replaceExisting && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>경고:</strong> 현재 히스토리의 모든 데이터가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
              </AlertDescription>
            </Alert>
          )}

          {/* Informational note */}
          {!skipDuplicates && !replaceExisting && (
            <Alert>
              <AlertDescription>
                중복 항목도 포함하여 모두 가져옵니다. 동일한 항목이 여러 번 저장될 수 있습니다.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleImport} variant={replaceExisting ? 'destructive' : 'default'}>
            <Upload className="mr-2 h-4 w-4" />
            가져오기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
