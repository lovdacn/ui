import { useEffect, useState } from 'react';
import { useColorScheme as useNWColorScheme } from 'nativewind';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const { colorScheme } = useNWColorScheme();

  if (hasHydrated) {
    return colorScheme ?? 'light';
  }

  return 'light';
}
