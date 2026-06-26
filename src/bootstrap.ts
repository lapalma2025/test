/**
 * Wykrywanie błędów startowych — logi w terminalu Metro (czerwone ERROR).
 */
import { LogBox } from 'react-native';

LogBox.ignoreAllLogs(false);

type GlobalWithErrorUtils = typeof globalThis & {
  ErrorUtils?: {
    getGlobalHandler?: () => (error: Error, isFatal?: boolean) => void;
    setGlobalHandler?: (handler: (error: Error, isFatal?: boolean) => void) => void;
  };
};

const g = globalThis as GlobalWithErrorUtils;
const prevHandler = g.ErrorUtils?.getGlobalHandler?.();
g.ErrorUtils?.setGlobalHandler?.((error: Error, isFatal?: boolean) => {
  console.error('[KIDELO CRASH]', isFatal ? 'FATAL' : 'ERROR', error?.message);
  if (error?.stack) console.error(error.stack);
  prevHandler?.(error, isFatal);
});
