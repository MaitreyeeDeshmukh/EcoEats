// src/components/ui/Input.tsx
import { View, TextInput, Text, type TextInputProps } from 'react-native';

interface InputProps extends Omit<TextInputProps, 'className'> {
  label?: string;
  error?: string;
  className?: string;
}

export function Input({
  label,
  error,
  className = '',
  ...props
}: InputProps) {
  return (
    <View className={`mb-4 ${className}`}>
      {label && (
        <Text className="text-sm font-body font-medium text-gray-700 mb-1">
          {label}
        </Text>
      )}
      <TextInput
        className={`
          bg-white border rounded-btn px-4 py-3 font-body text-base
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${props.editable === false ? 'bg-gray-100 text-gray-500' : 'text-gray-900'}
        `}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
      {error && (
        <Text className="text-sm text-red-500 mt-1 font-body">
          {error}
        </Text>
      )}
    </View>
  );
}
