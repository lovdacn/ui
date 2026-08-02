import * as React from 'react';
import { Platform, View, useColorScheme } from 'react-native';

import {
  PreviewDesignSystemProvider,
} from '@/components/design-system/preview-design-system';
import { CustomizerDashboard } from '@/components/previews/customizer-dashboard';
import type { PresetConfig } from '@/lib/generated/preset-catalog';
import type { PreviewColorScheme } from '@/lib/preview-theme';

const PRESET_MESSAGE = 'lvcn:preset';
const READY_MESSAGE = 'lvcn:ready';
const APPLIED_MESSAGE = 'lvcn:applied';

type PreviewDesign = {
  preset?: string;
  colorScheme: PreviewColorScheme;
  revision: number;
};

function getParentOrigin() {
  if (typeof document === 'undefined' || !document.referrer) return null;
  try {
    return new URL(document.referrer).origin;
  } catch {
    return null;
  }
}

function postToParent(message: Record<string, unknown>) {
  window.parent?.postMessage(message, getParentOrigin() ?? '*');
}

function readInitialDesign(systemColorScheme: string | null | undefined): PreviewDesign {
  const fallbackScheme: PreviewColorScheme = systemColorScheme === 'dark' ? 'dark' : 'light';
  if (typeof window === 'undefined') {
    return { colorScheme: fallbackScheme, revision: 0 };
  }

  const params = new URLSearchParams(window.location.search);
  const requestedScheme = params.get('colorScheme');
  return {
    preset: params.get('preset') ?? undefined,
    colorScheme:
      requestedScheme === 'dark' || requestedScheme === 'light'
        ? requestedScheme
        : fallbackScheme,
    revision: 0,
  };
}

export default function CustomizerPreviewPage() {
  const systemColorScheme = useColorScheme();
  const [design, setDesign] = React.useState<PreviewDesign>(() =>
    readInitialDesign(systemColorScheme)
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    function onMessage(event: MessageEvent) {
      if (event.source !== window.parent) return;
      const parentOrigin = getParentOrigin();
      if (parentOrigin && event.origin !== parentOrigin) return;

      const data = event.data as {
        type?: string;
        preset?: string;
        colorScheme?: string;
        revision?: number;
      };
      if (!data || data.type !== PRESET_MESSAGE) return;

      setDesign((current) => ({
        preset: typeof data.preset === 'string' ? data.preset : current.preset,
        colorScheme:
          data.colorScheme === 'dark' || data.colorScheme === 'light'
            ? data.colorScheme
            : current.colorScheme,
        revision: typeof data.revision === 'number' ? data.revision : current.revision + 1,
      }));
    }

    window.addEventListener('message', onMessage);
    postToParent({ type: READY_MESSAGE });
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const handleApplied = React.useCallback(
    ({ config, warnings }: { config: PresetConfig; warnings: readonly string[] }) => {
      if (typeof window === 'undefined') return;
      postToParent({
        type: APPLIED_MESSAGE,
        // Keep these three values exact: the parent reveals the frame only on a raw match.
        preset: design.preset,
        colorScheme: design.colorScheme,
        revision: design.revision,
        normalizedConfig: config,
        warnings,
      });
    },
    [design]
  );

  return (
    <PreviewDesignSystemProvider
      preset={design.preset}
      colorScheme={design.colorScheme}
      revision={design.revision}
      onApplied={handleApplied}
    >
      <View
        className="flex-1 w-full bg-background"
        style={Platform.OS === 'web' ? ({ height: '100vh' } as any) : undefined}
      >
        <CustomizerDashboard topPad={24} />
      </View>
    </PreviewDesignSystemProvider>
  );
}
