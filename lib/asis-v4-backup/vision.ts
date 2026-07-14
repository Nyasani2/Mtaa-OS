/**
 * ASIS v4 Vision Engine
 * Canvas pixel analysis, image understanding, drawing generation
 */

export interface ImageAnalysis {
  description: string;
  dominantColors: string[];
  brightness: number;
  complexity: number;
  edges: number;
}

export interface DrawingPattern {
  type: 'line' | 'circle' | 'rectangle' | 'curve' | 'text' | 'unknown';
  confidence: number;
  bounds: { x: number; y: number; w: number; h: number };
}

export class VisionEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  private getCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d')!;
    }
    return { canvas: this.canvas, ctx: this.ctx! };
  }

  async analyzeImage(file: File | Blob): Promise<ImageAnalysis> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const { canvas, ctx } = this.getCanvas();
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const analysis = this.processPixels(imageData, canvas.width, canvas.height);
        resolve(analysis);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  }

  private processPixels(imageData: ImageData, width: number, height: number): ImageAnalysis {
    const data = imageData.data;
    const totalPixels = width * height;

    // Color histogram
    const colorBuckets: Record<string, number> = {};
    let totalBrightness = 0;
    let edgeCount = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      totalBrightness += brightness;

      // Bucket colors
      const bucket = `${Math.round(r / 32) * 32},${Math.round(g / 32) * 32},${Math.round(b / 32) * 32}`;
      colorBuckets[bucket] = (colorBuckets[bucket] || 0) + 1;

      // Simple edge detection (compare with next pixel)
      if (i < data.length - 4) {
        const nextBrightness = (data[i + 4] + data[i + 5] + data[i + 6]) / 3;
        if (Math.abs(brightness - nextBrightness) > 50) {
          edgeCount++;
        }
      }
    }

    // Top colors
    const sortedColors = Object.entries(colorBuckets)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([color]) => `rgb(${color})`);

    const avgBrightness = totalBrightness / totalPixels;
    const edgeRatio = edgeCount / totalPixels;

    // Complexity estimate
    const uniqueColors = Object.keys(colorBuckets).length;
    const complexity = Math.min(10, (uniqueColors / 100) + (edgeRatio * 100));

    // Description
    let description = `Image: ${width}x${height}px. `;
    description += `Brightness: ${avgBrightness > 128 ? 'bright' : 'dark'} (${Math.round(avgBrightness)}/255). `;
    description += `Complexity: ${complexity > 5 ? 'high' : complexity > 2 ? 'medium' : 'low'}. `;
    description += `Dominant colors: ${sortedColors.slice(0, 3).join(', ')}. `;
    description += `Edge density: ${(edgeRatio * 100).toFixed(1)}%.`;

    return {
      description,
      dominantColors: sortedColors,
      brightness: avgBrightness,
      complexity,
      edges: edgeCount,
    };
  }

  analyzeDrawing(canvas: HTMLCanvasElement): DrawingPattern[] {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const patterns: DrawingPattern[] = [];

    // Simple stroke detection: find connected components
    const visited = new Set<number>();
    const data = imageData.data;
    const w = canvas.width;
    const h = canvas.height;

    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const idx = (y * w + x) * 4;
        if (visited.has(idx)) continue;

        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        if (brightness < 200) { // Dark pixel = potential stroke
          const bounds = this.floodFill(data, w, h, x, y, visited);
          if (bounds.w > 10 || bounds.h > 10) {
            patterns.push({
              type: this.classifyShape(bounds),
              confidence: 0.6,
              bounds,
            });
          }
        }
      }
    }

    return patterns;
  }

  private floodFill(data: Uint8ClampedArray, w: number, h: number, sx: number, sy: number, visited: Set<number>): { x: number; y: number; w: number; h: number } {
    let minX = sx, maxX = sx, minY = sy, maxY = sy;
    const stack = [[sx, sy]];

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const idx = (y * w + x) * 4;
      if (visited.has(idx) || x < 0 || x >= w || y < 0 || y >= h) continue;

      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      if (brightness >= 200) continue;

      visited.add(idx);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);

      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }

  private classifyShape(bounds: { w: number; h: number }): DrawingPattern['type'] {
    const ratio = bounds.w / (bounds.h || 1);
    if (ratio > 3 || ratio < 0.33) return 'line';
    if (ratio > 0.8 && ratio < 1.2) return 'circle';
    if (ratio > 0.5 && ratio < 2) return 'rectangle';
    return 'curve';
  }

  generateDrawing(description: string, canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const lower = description.toLowerCase();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;

    if (lower.includes('circle') || lower.includes('round')) {
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 50, 0, Math.PI * 2);
      ctx.stroke();
    } else if (lower.includes('square') || lower.includes('box')) {
      ctx.strokeRect(canvas.width / 2 - 50, canvas.height / 2 - 50, 100, 100);
    } else if (lower.includes('triangle')) {
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, canvas.height / 2 - 50);
      ctx.lineTo(canvas.width / 2 - 50, canvas.height / 2 + 50);
      ctx.lineTo(canvas.width / 2 + 50, canvas.height / 2 + 50);
      ctx.closePath();
      ctx.stroke();
    } else if (lower.includes('line') || lower.includes('arrow')) {
      ctx.beginPath();
      ctx.moveTo(50, canvas.height / 2);
      ctx.lineTo(canvas.width - 50, canvas.height / 2);
      ctx.stroke();
    } else {
      // Abstract pattern
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.stroke();
      }
    }
  }
}

export const visionEngine = new VisionEngine();
