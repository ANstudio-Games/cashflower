import React, { useLayoutEffect, useRef } from 'react';
import { Platform, TextInput, type TextInputProps } from 'react-native';

/** Plain numeric editing; grouping belongs to display text, not editable values. */
export function NumberInput({ keyboardType = 'number-pad', onChangeText, ...props }: TextInputProps) {
  const decimal = keyboardType === 'decimal-pad';
  const ref = useRef<TextInput>(null);
  useLayoutEffect(() => {
    if (Platform.OS === 'web' && ref.current) {
      // RN Web writes type=text during its own layout; apply numeric semantics afterward.
      const input = ref.current as unknown as HTMLInputElement;
      const applyType = () => {
        if (input.type !== 'number') input.setAttribute('type', 'number');
      };
      applyType();
      input.setAttribute('min', '0');
      input.setAttribute('step', decimal ? 'any' : '1');
      const observer = new MutationObserver(applyType);
      observer.observe(input, { attributes: true, attributeFilter: ['type'] });
      return () => observer.disconnect();
    }
  });
  return (
    <TextInput
      {...props}
      keyboardType={keyboardType}
      onChangeText={text => {
        const valid = decimal ? /^\d*([.,]\d*)?$/.test(text) : /^\d*$/.test(text);
        if (valid) onChangeText?.(text);
      }}
      inputMode={decimal ? 'decimal' : 'numeric'}
      ref={ref}
    />
  );
}
