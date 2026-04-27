import { useState, useCallback } from 'react';

export function useDateRange(initialDays: number = 7) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const initialStart = new Date(today);
  initialStart.setDate(initialStart.getDate() - Math.floor(initialDays / 2));
  
  const initialEnd = new Date(today);
  initialEnd.setDate(initialEnd.getDate() + Math.ceil(initialDays / 2));

  const [dateRange, setDateRange] = useState({
    start: initialStart,
    end: initialEnd,
  });

  const changeRange = useCallback((direction: 'prev' | 'next') => {
    const daysDiff = Math.ceil(
      (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
    );

    setDateRange(prev => {
      const newStart = new Date(prev.start);
      const newEnd = new Date(prev.end);

      if (direction === 'next') {
        newStart.setDate(newStart.getDate() + daysDiff);
        newEnd.setDate(newEnd.getDate() + daysDiff);
      } else {
        newStart.setDate(newStart.getDate() - daysDiff);
        newEnd.setDate(newEnd.getDate() - daysDiff);
      }

      return { start: newStart, end: newEnd };
    });
  }, [dateRange]);

  const setRange = useCallback((start: Date, end: Date) => {
    setDateRange({ start, end });
  }, []);

  return {
    dateRange,
    changeRange,
    setRange,
  };
}
