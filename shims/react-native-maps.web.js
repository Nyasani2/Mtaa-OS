// react-native-maps web shim — prevents Metro crash on web
import React from 'react';
import { View } from 'react-native';

export const MapView = () => <View />;
export const Marker = () => null;
export const Callout = () => null;
export const Circle = () => null;
export const Polygon = () => null;
export const Polyline = () => null;
export const Overlay = () => null;
export const Heatmap = () => null;
export const Geojson = () => null;
export const MarkerClusterer = () => null;
export default MapView;
