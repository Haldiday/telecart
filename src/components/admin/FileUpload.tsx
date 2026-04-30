import { useRef, useState } from 'react';
import { FileText, Upload, X } from 'lucide-react';
import { uploadFile } from '@/lib/supabase-helpers';

interface Props {
  label: string;
  value: string | null;
  fileName?: string;
  accept?: string;
  folder: string;
  onChange: (file: { url: string; name: string; type: string }) => void;
  onRemove: () => void;
}

export default function FileUpload({
  label,
  value,
  fileName,
  accept = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  folder,
  onChange,
  onRemove,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const url = await uploadFile(file, folder);
      onChange({
        url,
        name: file.name,
        type: file.type || file.name.split('.').pop() || 'file',
      });
    } catch (error: any) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = '';
    }
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {value ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 p-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{fileName || 'Uploaded file'}</p>
              <p className="text-xs text-muted-foreground">Ready to download</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={uploading}
          className="w-full rounded-lg border-2 border-dashed border-border py-6 transition-colors hover:bg-secondary/50"
        >
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {uploading ? 'Uploading...' : 'Upload file from device'}
            </span>
          </div>
        </button>
      )}
      <input
        ref={ref}
        type="file"
        accept={accept}
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
