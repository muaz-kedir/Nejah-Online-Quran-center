import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RichTextEditor } from './RichTextEditor';

const LANGS = [
  { key: 'en' as const, label: 'English' },
  { key: 'ar' as const, label: 'Arabic' },
  { key: 'am' as const, label: 'Amharic' },
];

const EMPTY_LOCALIZED = { en: '', ar: '', am: '' };

export function LocalizedRichTextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: { en: string; ar: string; am: string };
  onChange: (v: { en: string; ar: string; am: string }) => void;
  placeholder?: string;
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
            <RichTextEditor
              value={merged[l.key]}
              onChange={(html) => onChange({ ...merged, [l.key]: html })}
              placeholder={placeholder}
              dir={l.key === 'ar' ? 'rtl' : 'ltr'}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
