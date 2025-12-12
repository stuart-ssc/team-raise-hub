import { useCallback, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { LandingPageBlock as LandingPageBlockType } from './types';
import { LandingPageBlock } from './LandingPageBlock';
import { useTemplateEditor } from './useTemplateEditor';
import { useTemplateHistory } from './useTemplateHistory';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LandingPageEditorProps {
  initialBlocks: LandingPageBlockType[];
  onBlocksChange: (blocks: LandingPageBlockType[]) => void;
  onSelectionChange?: (blockId: string | null) => void;
}

export function LandingPageEditor({
  initialBlocks,
  onBlocksChange,
  onSelectionChange,
}: LandingPageEditorProps) {
  const {
    blocks,
    selectedBlockId,
    addBlock,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    moveBlock,
    selectBlock,
    resetBlocks,
  } = useTemplateEditor({
    initialBlocks,
    onBlocksChange,
  });

  const { canUndo, canRedo, pushState, undo, redo, reset } = useTemplateHistory(initialBlocks);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sync selection changes
  useEffect(() => {
    onSelectionChange?.(selectedBlockId);
  }, [selectedBlockId, onSelectionChange]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          const prevBlocks = undo();
          if (prevBlocks) {
            resetBlocks(prevBlocks);
            onBlocksChange(prevBlocks);
          }
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          const nextBlocks = redo();
          if (nextBlocks) {
            resetBlocks(nextBlocks);
            onBlocksChange(nextBlocks);
          }
        } else if (e.key === 'd' && selectedBlockId) {
          e.preventDefault();
          duplicateBlock(selectedBlockId);
        }
      } else if (e.key === 'Delete' && selectedBlockId) {
        e.preventDefault();
        deleteBlock(selectedBlockId);
      } else if (e.key === 'Escape') {
        selectBlock(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBlockId, undo, redo, duplicateBlock, deleteBlock, selectBlock, resetBlocks, onBlocksChange]);

  // Push state to history on block changes
  const handleBlockUpdate = useCallback((id: string, updates: Partial<LandingPageBlockType>) => {
    updateBlock(id, updates);
    // Debounce history push
    setTimeout(() => pushState(blocks), 100);
  }, [updateBlock, pushState, blocks]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((block) => block.id === active.id);
      const newIndex = blocks.findIndex((block) => block.id === over.id);
      moveBlock(oldIndex, newIndex);
      pushState(blocks);
    }
  };

  const handleDelete = useCallback((id: string) => {
    deleteBlock(id);
    pushState(blocks);
  }, [deleteBlock, pushState, blocks]);

  const handleDuplicate = useCallback((id: string) => {
    duplicateBlock(id);
    pushState(blocks);
  }, [duplicateBlock, pushState, blocks]);

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-2">
        {blocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            <p className="text-lg font-medium">No blocks yet</p>
            <p className="text-sm">Add blocks from the toolbar to get started</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              {blocks.map((block) => (
                <LandingPageBlock
                  key={block.id}
                  block={block}
                  isSelected={block.id === selectedBlockId}
                  onSelect={() => selectBlock(block.id)}
                  onUpdate={(updates) => handleBlockUpdate(block.id, updates)}
                  onDelete={() => handleDelete(block.id)}
                  onDuplicate={() => handleDuplicate(block.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </ScrollArea>
  );
}

export { useTemplateEditor, useTemplateHistory };
