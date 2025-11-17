import { useEffect, useRef } from 'react';

export function usePerformanceMonitor(label: string) {
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTimeRef.current;

      if (duration > 0.1) { // Only log if there was actual work
        console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);

        if (duration > 50) {
          console.warn(`[Performance Warning] ${label} took ${duration.toFixed(2)}ms (>50ms threshold)`);
        }
      }
    };
  });
}
