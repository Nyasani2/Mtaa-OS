import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  color?: string;
}

interface UnifiedMapProps {
  latitude?: number;
  longitude?: number;
  zoom?: number;
  markers?: MapMarker[];
  route?: Array<{ latitude: number; longitude: number }>;
  showUserLocation?: boolean;
  onMapPress?: (coords: { latitude: number; longitude: number }) => void;
  style?: any;
  mapType?: 'standard' | 'satellite' | 'hybrid';
}

const DEFAULT_COORDS = { lat: -1.2921, lng: 36.8219 };
const TILE_SIZE = 256;

function latLngToTileXY(lat: number, lng: number, zoom: number) {
  const latRad = (lat * Math.PI) / 180;
  const n = Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * n;
  const y = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n;
  return { x, y, n };
}

export default function UnifiedMap({
  latitude = DEFAULT_COORDS.lat,
  longitude = DEFAULT_COORDS.lng,
  zoom = 14,
  markers = [],
  showUserLocation = true,
  onMapPress,
  route,
  style,
}: UnifiedMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 400, h: 300 });
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [centerLat, setCenterLat] = useState(latitude);
  const [centerLng, setCenterLng] = useState(longitude);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startLat: 0, startLng: 0 });
  const [tileErrors, setTileErrors] = useState<Set<string>>(new Set());
  const [loadedTiles, setLoadedTiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setSize({ w: rect.width || 400, h: rect.height || 300 });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => { setCenterLat(latitude); }, [latitude]);
  useEffect(() => { setCenterLng(longitude); }, [longitude]);
  useEffect(() => { setCurrentZoom(zoom); }, [zoom]);

  const tiles = useMemo(() => {
    const centerTile = latLngToTileXY(centerLat, centerLng, currentZoom);
    const cols = Math.ceil(size.w / TILE_SIZE) + 2;
    const rows = Math.ceil(size.h / TILE_SIZE) + 2;
    const result: Array<{ x: number; y: number; z: number; left: number; top: number; key: string }> = [];

    const centerPixelX = size.w / 2;
    const centerPixelY = size.h / 2;
    const centerTileLeft = centerPixelX - (centerTile.x % 1) * TILE_SIZE;
    const centerTileTop = centerPixelY - (centerTile.y % 1) * TILE_SIZE;

    for (let row = -Math.floor(rows / 2); row < Math.ceil(rows / 2); row++) {
      for (let col = -Math.floor(cols / 2); col < Math.ceil(cols / 2); col++) {
        const tx = Math.floor(centerTile.x) + col;
        const ty = Math.floor(centerTile.y) + row;
        if (tx < 0 || ty < 0 || tx >= centerTile.n || ty >= centerTile.n) continue;
        result.push({
          x: tx, y: ty, z: currentZoom,
          left: centerTileLeft + col * TILE_SIZE,
          top: centerTileTop + row * TILE_SIZE,
          key: `${currentZoom}/${tx}/${ty}`,
        });
      }
    }
    return result;
  }, [centerLat, centerLng, currentZoom, size.w, size.h]);

  const markerPixels = useMemo(() => {
    const centerTile = latLngToTileXY(centerLat, centerLng, currentZoom);
    const centerPixelX = size.w / 2;
    const centerPixelY = size.h / 2;

    return markers.map((m: any) => {
      const mTile = latLngToTileXY(m.latitude, m.longitude, currentZoom);
      const dx = (mTile.x - centerTile.x) * TILE_SIZE;
      const dy = (mTile.y - centerTile.y) * TILE_SIZE;
      return {
        ...m,
        left: centerPixelX + dx,
        top: centerPixelY + dy,
      };
    });
  }, [markers, centerLat, centerLng, currentZoom, size.w, size.h]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLat: centerLat,
      startLng: centerLng,
    };
  }, [centerLat, centerLng]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const metersPerPixel = 156543.03392 * Math.cos(centerLat * Math.PI / 180) / Math.pow(2, currentZoom);
    const lngDelta = (dx * metersPerPixel) / (111320 * Math.cos(centerLat * Math.PI / 180));
    const latDelta = -(dy * metersPerPixel) / 110540;
    setCenterLat(dragRef.current.startLat + latDelta);
    setCenterLng(dragRef.current.startLng + lngDelta);
  }, [isDragging, centerLat, currentZoom]);

  const handleMouseUp = useCallback(() => { setIsDragging(false); }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isDragging) return;
    if (!onMapPress || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const centerPixelX = size.w / 2;
    const centerPixelY = size.h / 2;
    const dx = clickX - centerPixelX;
    const dy = clickY - centerPixelY;
    const metersPerPixel = 156543.03392 * Math.cos(centerLat * Math.PI / 180) / Math.pow(2, currentZoom);
    const lngDelta = (dx * metersPerPixel) / (111320 * Math.cos(centerLat * Math.PI / 180));
    const latDelta = -(dy * metersPerPixel) / 110540;
    onMapPress({ latitude: centerLat + latDelta, longitude: centerLng + lngDelta });
  }, [isDragging, onMapPress, centerLat, centerLng, currentZoom, size.w, size.h]);

  const handleZoomIn = () => setCurrentZoom(z => Math.min(z + 1, 19));
  const handleZoomOut = () => setCurrentZoom(z => Math.max(z - 1, 3));

  const allLoaded = tiles.length > 0 && tiles.every((t: any) => loadedTiles.has(t.key) || tileErrors.has(t.key));
  const hasVisibleTiles = tiles.some((t: any) => loadedTiles.has(t.key));

  return (
    <View style={[styles.container, style]}>
      <div
        ref={containerRef}
        style={{
          width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
          backgroundColor: '#d4dadc', cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
      >
        {!hasVisibleTiles && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#1a1a2e', zIndex: 5,
          }}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 14 }}>Loading map...</Text>
          </div>
        )}

        {tiles.map((tile: any) => (
          <img
            key={tile.key}
            src={`https://tile.openstreetmap.org/${tile.key}.png`}
            alt=""
            style={{
              position: 'absolute', left: tile.left, top: tile.top,
              width: TILE_SIZE, height: TILE_SIZE,
              pointerEvents: 'none', userSelect: 'none',
              opacity: tileErrors.has(tile.key) ? 0 : 1,
            }}
            onLoad={() => setLoadedTiles(prev => new Set(prev).add(tile.key))}
            onError={() => setTileErrors(prev => new Set(prev).add(tile.key))}
            draggable={false}
          />
        ))}

        {route && route.length > 1 && (
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}>
            <polyline
              points={route.map((coord: any) => {
                const mTile = latLngToTileXY(coord.latitude, coord.longitude, currentZoom);
                const centerTile = latLngToTileXY(centerLat, centerLng, currentZoom);
                const dx = (mTile.x - centerTile.x) * TILE_SIZE;
                const dy = (mTile.y - centerTile.y) * TILE_SIZE;
                return `${size.w / 2 + dx},${size.h / 2 + dy}`;
              }).join(' ')}
              fill="none" stroke="#3b82f6" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        )}

        {markerPixels.map((m: any) => (
          <div key={m.id} style={{ position: 'absolute', left: m.left - 15, top: m.top - 30, width: 30, height: 30, pointerEvents: 'none', zIndex: 3 }}>
            <svg width="30" height="30" viewBox="0 0 30 30">
              <path d="M15 2C8.925 2 4 6.925 4 13c0 7.75 11 15 11 15s11-7.25 11-15c0-6.075-4.925-11-11-11z"
                fill={m.color || '#ef4444'} stroke="white" strokeWidth="2" />
              <circle cx="15" cy="13" r="4" fill="white" />
            </svg>
            {m.title && (
              <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', padding: '2px 8px', borderRadius: 4,
                fontSize: 11, whiteSpace: 'nowrap', fontFamily: 'system-ui, sans-serif' }}>
                {m.title}
              </div>
            )}
          </div>
        ))}

        {showUserLocation && (
          <div style={{ position: 'absolute', left: size.w / 2 - 8, top: size.h / 2 - 8, width: 16, height: 16,
            borderRadius: '50%', backgroundColor: '#3b82f6', border: '3px solid white',
            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3)', pointerEvents: 'none', zIndex: 4 }} />
        )}

        <div style={{ position: 'absolute', bottom: 4, right: 4, fontSize: 9, color: '#666',
          backgroundColor: 'rgba(255,255,255,0.8)', padding: '1px 4px', borderRadius: 2,
          fontFamily: 'system-ui, sans-serif', pointerEvents: 'none', zIndex: 10 }}>
          © OpenStreetMap
        </div>
      </div>

      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomBtn} onPress={handleZoomIn}>
          <Text style={styles.zoomText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomBtn} onPress={handleZoomOut}>
          <Text style={styles.zoomText}>−</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden', borderRadius: 12 },
  zoomControls: { position: 'absolute', right: 12, bottom: 50, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 8, overflow: 'hidden', zIndex: 20 },
  zoomBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  zoomText: { fontSize: 20, fontWeight: 'bold', color: 'white' },
});
