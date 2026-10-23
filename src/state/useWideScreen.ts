import { useEffect, useState } from 'react';

const QUERY = '(min-width: 1024px)';

/** True on the laptop layout (sidebar beside the page), updated when the window is resized. */
export function useWideScreen(): boolean {
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia(QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = () => setWide(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return wide;
}
