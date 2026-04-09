// src/components/ui/Badge.tsx
import { View, Text } from 'react-native';
import type { ReactNode } from 'react';
import type { DietaryTag } from '@/types/models';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  dietary?: DietaryTag;
  size?: 'sm' | 'md';
}

const dietaryColors: Record<DietaryTag, string> = {
  vegetarian: 'bg-green-100 text-green-800',
  vegan: 'bg-emerald-100 text-emerald-800',
  halal: 'bg-teal-100 text-teal-800',
  kosher: 'bg-blue-100 text-blue-800',
  'gluten-free': 'bg-amber-100 text-amber-800',
};

const variantColors = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  error: 'bg-red-100 text-red-800',
};

export function Badge({
  children,
  variant = 'default',
  dietary,
  size = 'sm',
}: BadgeProps) {
  const colorClasses = dietary ? dietaryColors[dietary] : variantColors[variant];
  
  const sizeClasses = {
    sm: 'px-2 py-0.5',
    md: 'px-3 py-1',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
  };

  return (
    <View
      className={`
        rounded-full self-start
        ${colorClasses.split(' ')[0]}
        ${sizeClasses[size]}
      `}
    >
      <Text
        className={`
          font-body font-medium capitalize
          ${colorClasses.split(' ')[1]}
          ${textSizeClasses[size]}
        `}
      >
        {children}
      </Text>
    </View>
  );
}
