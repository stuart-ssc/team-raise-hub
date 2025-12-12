import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AVAILABLE_VARIABLES } from "./types";

interface VariablePickerProps {
  onInsert: (variable: string) => void;
  templateType?: 'school' | 'district' | 'nonprofit';
}

export function VariablePicker({ onInsert, templateType }: VariablePickerProps) {
  const handleCopy = (variable: string) => {
    const formattedVariable = `{{${variable}}}`;
    navigator.clipboard.writeText(formattedVariable);
    toast.success(`Copied ${formattedVariable} to clipboard`);
  };

  const handleInsert = (variable: string) => {
    onInsert(`{{${variable}}}`);
  };

  // Filter variables based on template type
  const filteredCategories = AVAILABLE_VARIABLES.filter(category => {
    if (templateType === 'district') {
      return category.category !== 'School';
    }
    if (templateType === 'nonprofit') {
      return category.category !== 'School' && category.category !== 'District';
    }
    return true;
  });

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          Template Variables
          <Badge variant="secondary" className="text-xs">
            Click to insert
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <Accordion type="multiple" defaultValue={filteredCategories.map(c => c.category)} className="px-4">
            {filteredCategories.map((category) => (
              <AccordionItem key={category.category} value={category.category}>
                <AccordionTrigger className="text-sm font-medium py-2">
                  {category.category}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1">
                    {category.variables.map((variable) => (
                      <div
                        key={variable.key}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-muted group cursor-pointer"
                        onClick={() => handleInsert(variable.key)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {variable.label}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            <code className="bg-muted px-1 rounded">
                              {`{{${variable.key}}}`}
                            </code>
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(variable.key);
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
