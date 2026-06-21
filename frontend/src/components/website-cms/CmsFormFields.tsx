import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { LocalizedText } from '@/lib/home-cms';
import { EMPTY_LOCALIZED } from '@/lib/home-cms';
import { apiAssetUrl } from '@/lib/api';

const LANGS = [
  { key: 'en' as const, label: 'English' },
  { key: 'ar' as const, label: 'Arabic' },
  { key: 'am' as const, label: 'Amharic' },
];

export function LocalizedFields({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: LocalizedText;
  onChange: (v: LocalizedText) => void;
  multiline?: boolean;
}) {
  const merged = { ...EMPTY_LOCALIZED, ...value };

  return (
    <div className="space-y-3 rounded-2xl border border-border p-4">
      <Label className="text-sm font-bold">{label}</Label>
      <Tabs defaultValue="en">
        <TabsList className="grid w-full grid-cols-3">
          {LANGS.map((l) => (
            <TabsTrigger key={l.key} value={l.key}>{l.label}</TabsTrigger>
          ))}
        </TabsList>
        {LANGS.map((l) => (
          <TabsContent key={l.key} value={l.key} className="mt-3">
            {multiline ? (
              <Textarea
                rows={4}
                value={merged[l.key]}
                onChange={(e) => onChange({ ...merged, [l.key]: e.target.value })}
                dir={l.key === 'ar' ? 'rtl' : 'ltr'}
              />
            ) : (
              <Input
                value={merged[l.key]}
                onChange={(e) => onChange({ ...merged, [l.key]: e.target.value })}
                dir={l.key === 'ar' ? 'rtl' : 'ltr'}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export function ImageUploadField({
  label,
  imageUrl,
  onChange,
  onUpload,
}: {
  label: string;
  imageUrl: string | null;
  onChange: (url: string | null) => void;
  onUpload: (file: File) => Promise<string>;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await onUpload(file);
      onChange(url);
    } finally {
      setUploading(false);
    }
  };

  const preview = imageUrl ? apiAssetUrl(imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`) : '';

  return (
    <div className="space-y-3 rounded-2xl border border-border p-4">
      <Label className="text-sm font-bold">{label}</Label>
      {preview ? (
        <img src={preview} alt="" className="h-32 w-full max-w-sm rounded-xl object-cover border" />
      ) : (
        <div className="h-32 max-w-sm rounded-xl bg-muted/40 flex items-center justify-center text-xs text-muted-foreground">
          No image
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Input
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="max-w-xs"
        />
        {imageUrl && (
          <button
            type="button"
            className="text-sm text-red-600 hover:underline"
            onClick={() => onChange(null)}
          >
            Remove image
          </button>
        )}
        {uploading && <span className="text-xs text-muted-foreground">Uploading…</span>}
      </div>
    </div>
  );
}
