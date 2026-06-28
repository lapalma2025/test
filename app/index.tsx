import { Redirect } from 'expo-router';

// NavGuard w _layout.tsx obsługuje całą logikę routingu — tu tylko punkt startowy.
export default function Index() {
  return <Redirect href="/auth" />;
}
