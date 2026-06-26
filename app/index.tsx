import { Redirect } from 'expo-router';
import { useProfileStore } from '@/stores/profile';

export default function Index() {
  const isOnboarded = useProfileStore((s) => s.isOnboarded);
  return <Redirect href={isOnboarded ? '/(tabs)/trasa' : '/onboarding'} />;
}
