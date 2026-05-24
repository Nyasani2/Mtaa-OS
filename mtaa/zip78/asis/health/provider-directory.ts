import { IProviderDirectory } from './interfaces';
import { HealthProvider } from './types';

export class ProviderDirectory implements IProviderDirectory {
  private providers: Map<string, HealthProvider> = new Map();

  async search(query: string, filters?: { type?: string; location?: string; specialization?: string }): Promise<HealthProvider[]> {
    let results = Array.from(this.providers.values());
    if (query) { const q = query.toLowerCase(); results = results.filter(p => p.name.toLowerCase().includes(q) || p.type.includes(q) || (p.specialization?.some(s => s.toLowerCase().includes(q)) ?? false) || p.location.city.toLowerCase().includes(q) || p.location.country.toLowerCase().includes(q)); }
    if (filters?.type) results = results.filter(p => p.type === filters.type);
    if (filters?.location) results = results.filter(p => p.location.city.toLowerCase().includes(filters.location!.toLowerCase()) || p.location.country.toLowerCase().includes(filters.location!.toLowerCase()));
    if (filters?.specialization) results = results.filter(p => p.specialization?.some(s => s.toLowerCase().includes(filters.specialization!.toLowerCase())));
    return results;
  }

  async getById(providerId: string): Promise<HealthProvider | null> { return this.providers.get(providerId) || null; }
  async registerProvider(provider: Omit<HealthProvider, 'id'>): Promise<HealthProvider> { const p: HealthProvider = { ...provider, id: `hp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` }; this.providers.set(p.id, p); return p; }
  async verifyProvider(providerId: string): Promise<HealthProvider> { const p = this.providers.get(providerId); if (!p) throw new Error('Not found'); const v = { ...p, isVerified: true }; this.providers.set(providerId, v); return v; }

  seedSampleProviders(): void {
    [
      { name: 'Aga Khan University Hospital', type: 'hospital', specialization: ['cardiology', 'oncology', 'pediatrics'], location: { lat: -1.264, lng: 36.811, address: '3rd Parklands Avenue', city: 'Nairobi', country: 'Kenya' }, contact: { phone: '+254 20 366 2000', email: 'info@aku.edu', website: 'https://hospitals.aku.edu/nairobi' }, isVerified: true, languages: ['English', 'Swahili'] },
      { name: 'Lagos University Teaching Hospital', type: 'hospital', specialization: ['general', 'surgery', 'maternity'], location: { lat: 6.524, lng: 3.379, address: 'Idi-Araba', city: 'Lagos', country: 'Nigeria' }, contact: { phone: '+234 1 493 0000', email: 'info@luth.gov.ng' }, isVerified: true, languages: ['English', 'Yoruba', 'Igbo', 'Hausa'] },
      { name: 'Accra Medical Centre', type: 'clinic', specialization: ['general_practice', 'dental', 'ophthalmology'], location: { lat: 5.603, lng: -0.187, address: 'Korle Bu', city: 'Accra', country: 'Ghana' }, contact: { phone: '+233 30 266 0000' }, isVerified: true, languages: ['English', 'Twi', 'Ga'] },
    ].forEach(p => this.registerProvider(p));
  }
}
