export function computeGrid(lat: number, lng: number) {

  const gridSize = 0.01;

  return {
    grid_lat: Math.floor(lat / gridSize),
    grid_lng: Math.floor(lng / gridSize),
  };
}
