import { useState, useCallback } from 'react';
import { LandingPageBlock, LandingPageBlockType } from './types';

interface UseTemplateEditorProps {
  initialBlocks?: LandingPageBlock[];
  onBlocksChange?: (blocks: LandingPageBlock[]) => void;
}

export function useTemplateEditor({ initialBlocks = [], onBlocksChange }: UseTemplateEditorProps = {}) {
  const [blocks, setBlocks] = useState<LandingPageBlock[]>(initialBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const generateId = () => crypto.randomUUID();

  const updateBlocks = useCallback((newBlocks: LandingPageBlock[]) => {
    setBlocks(newBlocks);
    setIsDirty(true);
    onBlocksChange?.(newBlocks);
  }, [onBlocksChange]);

  const addBlock = useCallback((type: LandingPageBlockType, index?: number) => {
    const newBlock: LandingPageBlock = {
      id: generateId(),
      type,
      content: '',
      styles: getDefaultStylesForType(type),
    };

    const newBlocks = [...blocks];
    if (index !== undefined) {
      newBlocks.splice(index, 0, newBlock);
    } else {
      newBlocks.push(newBlock);
    }
    
    updateBlocks(newBlocks);
    setSelectedBlockId(newBlock.id);
    return newBlock;
  }, [blocks, updateBlocks]);

  const updateBlock = useCallback((id: string, updates: Partial<LandingPageBlock>) => {
    const newBlocks = blocks.map(block =>
      block.id === id ? { ...block, ...updates } : block
    );
    updateBlocks(newBlocks);
  }, [blocks, updateBlocks]);

  const deleteBlock = useCallback((id: string) => {
    const newBlocks = blocks.filter(block => block.id !== id);
    updateBlocks(newBlocks);
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
  }, [blocks, selectedBlockId, updateBlocks]);

  const duplicateBlock = useCallback((id: string) => {
    const index = blocks.findIndex(block => block.id === id);
    if (index === -1) return null;

    const originalBlock = blocks[index];
    const newBlock: LandingPageBlock = {
      ...JSON.parse(JSON.stringify(originalBlock)),
      id: generateId(),
    };

    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    updateBlocks(newBlocks);
    setSelectedBlockId(newBlock.id);
    return newBlock;
  }, [blocks, updateBlocks]);

  const moveBlock = useCallback((fromIndex: number, toIndex: number) => {
    const newBlocks = [...blocks];
    const [movedBlock] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, movedBlock);
    updateBlocks(newBlocks);
  }, [blocks, updateBlocks]);

  const selectBlock = useCallback((id: string | null) => {
    setSelectedBlockId(id);
  }, []);

  const getSelectedBlock = useCallback(() => {
    return blocks.find(block => block.id === selectedBlockId) || null;
  }, [blocks, selectedBlockId]);

  const resetBlocks = useCallback((newBlocks: LandingPageBlock[]) => {
    setBlocks(newBlocks);
    setSelectedBlockId(null);
    setIsDirty(false);
  }, []);

  const markClean = useCallback(() => {
    setIsDirty(false);
  }, []);

  return {
    blocks,
    selectedBlockId,
    isDirty,
    addBlock,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    moveBlock,
    selectBlock,
    getSelectedBlock,
    resetBlocks,
    markClean,
  };
}

function getDefaultStylesForType(type: LandingPageBlockType): LandingPageBlock['styles'] {
  switch (type) {
    case 'hero':
      return {
        heroTitle: 'Welcome to {{school_name}}',
        heroSubtitle: 'Supporting our community through fundraising',
        heroBackgroundColor: '#1e40af',
        heroHeight: '400px',
        heroOverlayOpacity: '0.5',
        textAlign: 'center',
      };
    case 'heading':
      return {
        fontSize: '2rem',
        fontWeight: 'bold',
        textAlign: 'center',
      };
    case 'paragraph':
      return {
        fontSize: '1rem',
        textAlign: 'left',
      };
    case 'button':
      return {
        buttonText: 'Learn More',
        buttonUrl: '#',
        buttonColor: '#2563eb',
        buttonVariant: 'solid',
        textAlign: 'center',
      };
    case 'image':
      return {
        imageUrl: '',
        imageAlt: 'Image',
        imageWidth: '100%',
      };
    case 'divider':
      return {
        padding: '1rem',
      };
    case 'spacer':
      return {
        spacerHeight: '2rem',
      };
    case 'stats-row':
      return {
        stats: [
          { label: 'Total Raised', value: '{{total_raised_formatted}}', icon: 'dollar' },
          { label: 'Campaigns', value: '{{campaign_count}}', icon: 'target' },
          { label: 'Supporters', value: '{{supporter_count}}', icon: 'users' },
        ],
        backgroundColor: '#f8fafc',
        padding: '2rem',
      };
    case 'cta-box':
      return {
        ctaTitle: 'Ready to Support?',
        ctaDescription: 'Join our community of supporters today.',
        ctaButtonText: 'Donate Now',
        ctaButtonUrl: '#campaigns',
        backgroundColor: '#eff6ff',
        padding: '2rem',
      };
    case 'testimonial':
      return {
        testimonialQuote: 'This program has made a real difference in our community.',
        testimonialAuthor: 'Parent Name',
        testimonialRole: 'Parent',
        backgroundColor: '#ffffff',
        padding: '2rem',
      };
    case 'campaign-list':
      return {
        campaignListTitle: 'Active Campaigns',
        campaignListLimit: 6,
      };
    case 'contact-info':
      return {
        showAddress: true,
        showPhone: true,
        showEmail: true,
        showWebsite: true,
        backgroundColor: '#f8fafc',
        padding: '2rem',
      };
    case 'two-column':
      return {
        columnRatio: '50-50',
        leftColumnContent: [],
        rightColumnContent: [],
        padding: '2rem',
      };
    case 'feature-grid':
      return {
        features: [
          { icon: 'dollar', title: 'Feature 1', description: 'Description of this feature' },
          { icon: 'users', title: 'Feature 2', description: 'Description of this feature' },
          { icon: 'bar-chart', title: 'Feature 3', description: 'Description of this feature' },
          { icon: 'shield', title: 'Feature 4', description: 'Description of this feature' },
        ],
        featureColumns: 2,
        backgroundColor: '#ffffff',
      };
    case 'how-it-works':
      return {
        steps: [
          { stepNumber: 1, title: 'Step 1', description: 'First step description' },
          { stepNumber: 2, title: 'Step 2', description: 'Second step description' },
          { stepNumber: 3, title: 'Step 3', description: 'Third step description' },
        ],
        backgroundColor: '#f8fafc',
      };
    case 'pricing-highlight':
      return {
        pricingTitle: '100% of Donations',
        pricingSubtitle: 'Go directly to your cause',
        pricingHighlight: '100%',
        pricingDescription: 'No hidden fees, no platform cuts.',
        backgroundColor: '#f0fdf4',
        textColor: '#166534',
      };
    default:
      return {};
  }
}
