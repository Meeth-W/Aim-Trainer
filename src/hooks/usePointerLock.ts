import { useEffect, useState, useCallback, RefObject } from 'react';

export function usePointerLock(elementRef: RefObject<HTMLElement | null>) {
  const [isLocked, setIsLocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handlePointerLockChange = useCallback(() => {
    if (!elementRef.current) return;
    setIsLocked(document.pointerLockElement === elementRef.current);
  }, [elementRef]);

  const handleFullscreenChange = useCallback(() => {
    if (!elementRef.current) return;
    setIsFullscreen(document.fullscreenElement === elementRef.current);
  }, [elementRef]);

  const lockPointer = useCallback(() => {
    const el = elementRef.current;
    if (!el) return;

    const requestLock = () => {
      // In some browsers pointer lock request can fail, handle promise if returned
      try {
        const promise = el.requestPointerLock() as unknown as Promise<void> | undefined;
        if (promise && typeof promise.catch === 'function') {
          promise.catch((err) => console.error('Pointer Lock failed:', err));
        }
      } catch (err) {
        console.error('Pointer Lock failed synchronously:', err);
      }
    };

    // Attempt Fullscreen first, then lock pointer inside it
    if (document.fullscreenElement !== el) {
      el.requestFullscreen()
        .then(() => {
          // Add small delay to ensure fullscreen rendering has completed
          setTimeout(requestLock, 100);
        })
        .catch((err) => {
          console.error('Fullscreen failed, fallback to raw pointer lock:', err);
          requestLock();
        });
    } else {
      requestLock();
    }
  }, [elementRef]);

  const unlockPointer = useCallback(() => {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('mozpointerlockchange', handlePointerLockChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitpointerlockchange', handlePointerLockChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozpointerlockchange', handlePointerLockChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitpointerlockchange', handlePointerLockChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [handlePointerLockChange, handleFullscreenChange]);

  return {
    isLocked,
    isFullscreen,
    lockPointer,
    unlockPointer,
  };
}
