import { ReactNode } from 'react';
import { View } from 'react-native';

type Props = {
  children: ReactNode
}

export default function OSBackground({ children }: Props) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#050510',
      }}
    >
      {children}
    </View>
  )
}
