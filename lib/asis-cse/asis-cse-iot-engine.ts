// @ts-nocheck
/**
 * ASIS CSE — IoT Home Automation Engine
 * Controls smart devices via local network HTTP requests.
 */

export interface IoTDevice {
  id: string;
  name: string;
  type: 'light' | 'lock' | 'thermostat' | 'camera';
  state: 'on' | 'off' | 'locked' | 'unlocked' | number;
  ipAddress: string;
}

export class IoTEngine {
  private devices: Map<string, IoTDevice> = new Map();

  constructor() {
    // Register mock devices for demonstration
    this.registerDevice({ id: 'light_1', name: 'Living Room Light', type: 'light', state: 'off', ipAddress: '192.168.1.101' });
    this.registerDevice({ id: 'lock_1', name: 'Front Door', type: 'lock', state: 'locked', ipAddress: '192.168.1.102' });
    this.registerDevice({ id: 'ac_1', name: 'Bedroom AC', type: 'thermostat', state: 24, ipAddress: '192.168.1.103' });
  }

  registerDevice(device: IoTDevice): void {
    this.devices.set(device.id, device);
  }

  getDevices(): IoTDevice[] {
    return Array.from(this.devices.values());
  }

  async executeCommand(deviceId: string, command: string, value?: any): Promise<{ success: boolean; message: string }> {
    const device = this.devices.get(deviceId);
    if (!device) return { success: false, message: 'Device not found' };

    // Simulate HTTP request to local device
    // In production: await fetch(`http://${device.ipAddress}/api/${command}`, { method: 'POST', body: JSON.stringify({ value }) });
    
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network latency

    if (device.type === 'light') {
      device.state = command === 'turn_on' ? 'on' : 'off';
    } else if (device.type === 'lock') {
      device.state = command === 'lock' ? 'locked' : 'unlocked';
    } else if (device.type === 'thermostat') {
      device.state = typeof value === 'number' ? value : device.state;
    }

    return { success: true, message: `${device.name} is now ${device.state}` };
  }

  parseVoiceCommand(query: string): { deviceId?: string; command?: string; value?: any } {
    const lower = query.toLowerCase();
    if (lower.includes('light')) return { deviceId: 'light_1', command: lower.includes('on') ? 'turn_on' : 'turn_off' };
    if (lower.includes('door') || lower.includes('lock')) return { deviceId: 'lock_1', command: lower.includes('lock') ? 'lock' : 'unlock' };
    if (lower.includes('ac') || lower.includes('temperature')) {
      const tempMatch = lower.match(/(\d+)/);
      return { deviceId: 'ac_1', command: 'set_temp', value: tempMatch ? parseInt(tempMatch[1]) : 24 };
    }
    return {};
  }
}

export const iotEngine = new IoTEngine();
