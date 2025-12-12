import { useState, useCallback } from 'react';
import { LandingPageBlock } from './types';

interface HistoryState {
  blocks: LandingPageBlock[];
  timestamp: number;
}

const MAX_HISTORY_SIZE = 50;

export function useTemplateHistory(initialBlocks: LandingPageBlock[] = []) {
  const [history, setHistory] = useState<HistoryState[]>([
    { blocks: initialBlocks, timestamp: Date.now() }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const pushState = useCallback((blocks: LandingPageBlock[]) => {
    setHistory(prev => {
      // Remove any future states if we're not at the end
      const newHistory = prev.slice(0, currentIndex + 1);
      
      // Add new state
      newHistory.push({ blocks: JSON.parse(JSON.stringify(blocks)), timestamp: Date.now() });
      
      // Limit history size
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift();
        return newHistory;
      }
      
      return newHistory;
    });
    setCurrentIndex(prev => Math.min(prev + 1, MAX_HISTORY_SIZE - 1));
  }, [currentIndex]);

  const undo = useCallback((): LandingPageBlock[] | null => {
    if (!canUndo) return null;
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    return JSON.parse(JSON.stringify(history[newIndex].blocks));
  }, [canUndo, currentIndex, history]);

  const redo = useCallback((): LandingPageBlock[] | null => {
    if (!canRedo) return null;
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    return JSON.parse(JSON.stringify(history[newIndex].blocks));
  }, [canRedo, currentIndex, history]);

  const reset = useCallback((blocks: LandingPageBlock[]) => {
    setHistory([{ blocks: JSON.parse(JSON.stringify(blocks)), timestamp: Date.now() }]);
    setCurrentIndex(0);
  }, []);

  const getCurrentState = useCallback((): LandingPageBlock[] => {
    return JSON.parse(JSON.stringify(history[currentIndex].blocks));
  }, [history, currentIndex]);

  return {
    canUndo,
    canRedo,
    pushState,
    undo,
    redo,
    reset,
    getCurrentState,
    historyLength: history.length,
    currentIndex,
  };
}
