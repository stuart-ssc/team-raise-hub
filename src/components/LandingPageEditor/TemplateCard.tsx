import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Edit, 
  Copy, 
  Trash2, 
  MoreVertical, 
  Layout,
  School,
  Building2,
  Heart,
  Star,
} from 'lucide-react';
import { LandingPageBlock } from './types';
import { format } from 'date-fns';

interface TemplateCardProps {
  id: string;
  name: string;
  description: string | null;
  templateType: 'school' | 'district' | 'nonprofit';
  blocks: LandingPageBlock[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSetDefault?: () => void;
}

export function TemplateCard({
  id,
  name,
  description,
  templateType,
  blocks,
  isDefault,
  createdAt,
  updatedAt,
  onEdit,
  onDuplicate,
  onDelete,
  onSetDefault,
}: TemplateCardProps) {
  const typeIcon = {
    school: <School className="h-4 w-4" />,
    district: <Building2 className="h-4 w-4" />,
    nonprofit: <Heart className="h-4 w-4" />,
  };

  const typeLabel = {
    school: 'School',
    district: 'District',
    nonprofit: 'Non-Profit',
  };

  const typeColor = {
    school: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    district: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    nonprofit: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  };

  // Count block types for preview
  const blockCounts = blocks.reduce((acc, block) => {
    acc[block.type] = (acc[block.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{name}</h3>
              {isDefault && (
                <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
                  <Star className="h-3 w-3" />
                  Default
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${typeColor[templateType]} flex items-center gap-1`}>
                {typeIcon[templateType]}
                {typeLabel[templateType]}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Template
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              {onSetDefault && !isDefault && (
                <DropdownMenuItem onClick={onSetDefault}>
                  <Star className="h-4 w-4 mr-2" />
                  Set as Default
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {description}
          </p>
        )}

        {/* Block preview */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Layout className="h-3 w-3" />
            <span>{blocks.length} blocks</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(blockCounts).slice(0, 5).map(([type, count]) => (
              <Badge key={type} variant="outline" className="text-xs capitalize">
                {type.replace('-', ' ')} {count > 1 && `×${count}`}
              </Badge>
            ))}
            {Object.keys(blockCounts).length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{Object.keys(blockCounts).length - 5} more
              </Badge>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 text-xs text-muted-foreground">
        <span>Updated {format(new Date(updatedAt), 'MMM d, yyyy')}</span>
      </CardFooter>
    </Card>
  );
}
