import React from 'react'
import { View } from 'react-native'
import OSMorphEngine, { MorphState } from './OSMorphEngine'

type Props = {
  morph: MorphState | null
  children: React.ReactNode
}

export default function OSMorphHost({ morph, children }: Props) {
  return (
    <View style={{ flex: 1 }}>
      {children}

      {/* OVERLAY LAYER (OS TRANSITION LAYER) */}
      {morph?.active && (
        <OSMorphEngine state={morph}>
          <View
            style={{
              flex: 1,
              backgroundColor: '#0B0F1A',
            }}
          />
        </OSMorphEngine>
      )}
    </View>
  )
}
