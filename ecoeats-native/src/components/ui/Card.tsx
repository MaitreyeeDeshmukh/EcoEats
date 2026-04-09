// src/components/ui/Card.tsx
import { View, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: ViewStyle;
}

export function Card({ children, className = '', style }: CardProps) {
  return (
    <View
      className={`
        bg-white rounded-card shadow-card p-4
        ${className}
      `}
      style={style}
    >
      {children}
    </View>
  );
}
