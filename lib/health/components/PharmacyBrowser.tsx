'use client';
import { useState } from 'react';
import { usePharmacies, useSearchMedications } from '../hooks/usePharmacy';
import { useHealthStore } from '../state/health.store';
import { Search, MapPin, Clock, Truck, Star, Plus, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export function PharmacyBrowser() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: pharmacies } = usePharmacies({ verified: true });
  const { data: searchResults } = useSearchMedications(searchQuery);
  const { cart, addToCart } = useHealthStore();
  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search medications by name or generic name..." className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>
      {searchQuery.length > 2 && searchResults && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Search Results</h3>
          <div className="grid gap-3">
            {searchResults.map((med) => (
              <div key={med.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div><p className="font-medium text-gray-900">{med.name}</p><p className="text-sm text-gray-500">{med.generic_name} · {med.category}</p><p className="text-sm font-medium text-emerald-600 mt-1">${med.price}</p></div>
                <button onClick={() => addToCart({ medicationId: med.id, quantity: 1, name: med.name, price: med.price })} className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"><Plus className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Verified Pharmacies</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pharmacies?.map((pharmacy) => (
            <Link key={pharmacy.id} href={`/health/pharmacy/${pharmacy.id}`} className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div><h4 className="font-semibold text-gray-900">{pharmacy.name}</h4><p className="text-sm text-gray-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {pharmacy.address}</p></div>
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg"><Star className="w-4 h-4 text-amber-500 fill-amber-500" /><span className="text-sm font-medium text-amber-700">{pharmacy.rating?.toFixed(1)}</span></div>
              </div>
              <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                {pharmacy.is_24h && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 24h</span>}
                {pharmacy.delivery_available && <span className="flex items-center gap-1 text-emerald-600"><Truck className="w-3 h-3" /> Delivery</span>}
              </div>
            </Link>
          ))}
        </div>
      </div>
      {cart.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg">
          <Link href="/health/pharmacy/cart" className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            <span className="font-medium">{cart.length} items · ${cart.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
