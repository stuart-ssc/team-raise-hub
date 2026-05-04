import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface CustomField {
  id?: string;
  field_name: string;
  field_type: 'text' | 'textarea' | 'number' | 'date' | 'url' | 'email' | 'phone' | 'file' | 'checkbox' | 'select';
  field_options?: string[];
  is_required: boolean;
  help_text?: string;
  display_order: number;
}

interface CustomFieldsSectionProps {
  fields: CustomField[];
  onFieldsChange: (fields: CustomField[]) => void;
}

export function CustomFieldsSection({ fields, onFieldsChange }: CustomFieldsSectionProps) {
  const addField = () => {
    onFieldsChange([
      ...fields,
      {
        field_name: "",
        field_type: "text",
        field_options: [],
        is_required: false,
        help_text: "",
        display_order: fields.length,
      },
    ]);
  };

  const updateField = (index: number, key: string, value: any) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: value };
    onFieldsChange(updated);
  };

  const removeField = (index: number) => {
    onFieldsChange(fields.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={addField} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Field
        </Button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex gap-2 flex-wrap">
              <Input
                placeholder="Field name"
                value={field.field_name}
                onChange={(e) => updateField(index, 'field_name', e.target.value)}
                className="flex-1 min-w-[150px]"
              />
              <Select
                value={field.field_type}
                onValueChange={(v) => updateField(index, 'field_type', v)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="textarea">Long Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="file">File Upload</SelectItem>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                  <SelectItem value="select">Dropdown</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 px-3 border rounded-md">
                <Switch
                  checked={field.is_required}
                  onCheckedChange={(v) => updateField(index, 'is_required', v)}
                />
                <span className="text-sm whitespace-nowrap">Required</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeField(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {field.field_type === 'select' && (
              <div className="space-y-1">
                <Textarea
                  placeholder={"Options (one per line)\nExample:\nSmall\nMedium\nLarge"}
                  value={field.field_options?.join('\n') ?? ''}
                  onChange={(e) => updateField(index, 'field_options', e.target.value.split('\n'))}
                  onBlur={(e) =>
                    updateField(
                      index,
                      'field_options',
                      e.target.value.split('\n').map((o) => o.trim()).filter(Boolean)
                    )
                  }
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">Press Enter to add each option on a new line.</p>
              </div>
            )}

            <Input
              placeholder="Help text (optional)"
              value={field.help_text || ''}
              onChange={(e) => updateField(index, 'help_text', e.target.value)}
            />
          </div>
        ))}

        {fields.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            No custom fields added yet. Click "Add Field" to create one.
          </div>
        )}
      </div>
    </div>
  );
}
