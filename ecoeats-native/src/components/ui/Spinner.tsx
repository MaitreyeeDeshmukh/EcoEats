// src/components/ui/Spinner.tsx
import { View, ActivityIndicator } from 'react-native';

interface SpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  className?: string;
}

export function Spinner({
  size = 'large',
  color = '#1B4332',
  className = '',
}: SpinnerProps) {
  return (
    <View className={`items-center justify-center ${className}`}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

export function FullPageSpinner() {
  return (
    <View className="flex-1 items-center justify-center bg-cream">
      <Spinner />
    </View>
  );
}
