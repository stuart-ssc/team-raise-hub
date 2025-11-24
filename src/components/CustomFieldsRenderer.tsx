import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CustomField {
  id: string;
  field_name: string;
  field_type: string;
  field_options: string[] | null;
  is_required: boolean;
  help_text: string | null;
}

interface CustomFieldsRendererProps {
  fields: CustomField[];
  values: Record<string, any>;
  onChange: (fieldId: string, value: any) => void;
}

export function CustomFieldsRenderer({ fields, values, onChange }: CustomFieldsRendererProps) {
  const renderField = (field: CustomField) => {
    const value = values[field.id] || '';

    switch (field.field_type) {
      case 'text':
      case 'email':
      case 'url':
      case 'phone':
        return (
          <Input
            type={field.field_type}
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
            required={field.is_required}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
            required={field.is_required}
            rows={4}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
            required={field.is_required}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
            required={field.is_required}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={value === true || value === 'true'}
              onCheckedChange={(checked) => onChange(field.id, checked)}
            />
            <span className="text-sm">{field.help_text || 'Yes'}</span>
          </div>
        );

      case 'select':
        return (
          <Select 
            value={value} 
            onValueChange={(val) => onChange(field.id, val)}
            required={field.is_required}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              {(field.field_options || []).map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'file':
        return (
          <div>
            <Input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onChange(field.id, file);
                }
              }}
              accept="image/*,.pdf,.doc,.docx"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Max 25MB. Or provide a link below:
            </p>
            <Input
              type="url"
              placeholder="Or paste a link to the file..."
              className="mt-2"
              onChange={(e) => onChange(`${field.id}_url`, e.target.value)}
            />
          </div>
        );

      default:
        return (
          <Input
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
            required={field.is_required}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {fields.map((field) => (
        <div key={field.id}>
          <Label>
            {field.field_name}
            {field.is_required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {field.help_text && field.field_type !== 'checkbox' && (
            <p className="text-sm text-muted-foreground mb-2">{field.help_text}</p>
          )}
          {renderField(field)}
        </div>
      ))}
    </div>
  );
}
