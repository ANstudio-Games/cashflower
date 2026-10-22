import React from 'react';
import { TextInput, type TextInputProps } from 'react-native';

/** Group rupiah for editing, but keep form state unformatted for calculations/saving. */
export function NumberInput({ keyboardType = 'number-pad', value, onChangeText, ...props }: TextInputProps) {
  const decimal = keyboardType === 'decimal-pad';
  const raw = (value ?? '').replace(',', '.');
  const [integer, fraction] = raw.split('.');
  const formatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    + (decimal && fraction !== undefined ? `,${fraction}` : '');

  return (
    <TextInput
      {...props}
      value={formatted}
      keyboardType={keyboardType}
      onChangeText={text => {
        // A dot typed at the end by a decimal keyboard is a decimal mark,
        // whereas existing dots in the displayed value are thousands separators.
        if (decimal && !formatted.includes(',') && text === `${formatted}.`) {
          onChangeText?.(`${raw}.`);
          return;
        }
        let next = text.replace(/\./g, '').replace(/[^\d,]/g, '');
        if (!decimal) next = next.replace(/,/g, '');
        if (!/^\d*(,\d*)?$/.test(next)) return;

        // Deleting a grouping dot must delete the preceding digit as well;
        // otherwise formatting would immediately put the dot back.
        if (text.length === formatted.length - 1 && next === raw.replace('.', ',')) {
          let index = 0;
          while (index < text.length && text[index] === formatted[index]) index++;
          if (formatted[index] === '.' && index > 0) {
            next = (formatted.slice(0, index - 1) + formatted.slice(index + 1)).replace(/\./g, '');
          }
        }
        onChangeText?.(next.replace(',', '.'));
      }}
      inputMode={decimal ? 'decimal' : 'numeric'}
    />
  );
}
