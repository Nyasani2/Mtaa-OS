/**
 * Health Pharmacies Edge Function
 * CRUD + geo search for normal and herbal pharmacies
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    );

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    switch (path) {
      case 'list': {
        const type = url.searchParams.get('type');
        const city = url.searchParams.get('city');
        const lat = parseFloat(url.searchParams.get('lat') || '0');
        const lng = parseFloat(url.searchParams.get('lng') || '0');
        const radius = parseFloat(url.searchParams.get('radius') || '10'); // km
        const limit = parseInt(url.searchParams.get('limit') || '50');

        let query = supabase
          .from('health_pharmacies')
          .select('*')
          .eq('is_active', true)
          .order('name')
          .limit(limit);

        if (type) query = query.eq('type', type);
        if (city) query = query.ilike('city', `%${city}%`);

        // Simple distance filter using Haversine approximation
        if (lat && lng) {
          const latRange = radius / 111; // ~111km per degree
          const lngRange = radius / (111 * Math.cos(lat * Math.PI / 180));
          query = query
            .gte('latitude', lat - latRange)
            .lte('latitude', lat + latRange)
            .gte('longitude', lng - lngRange)
            .lte('longitude', lng + lngRange);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Calculate exact distances if lat/lng provided
        let results = data || [];
        if (lat && lng) {
          results = results.map((p: any) => ({
            ...p,
            distance_km: haversine(lat, lng, p.latitude, p.longitude),
          })).sort((a: any, b: any) => a.distance_km - b.distance_km);
        }

        return new Response(JSON.stringify({ pharmacies: results, count: results.length }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'nearby': {
        const lat = parseFloat(url.searchParams.get('lat') || '0');
        const lng = parseFloat(url.searchParams.get('lng') || '0');
        const radius = parseFloat(url.searchParams.get('radius') || '5');
        const type = url.searchParams.get('type');

        if (!lat || !lng) {
          return new Response(JSON.stringify({ error: 'lat and lng required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        let query = supabase
          .from('health_pharmacies')
          .select('*')
          .eq('is_active', true);

        if (type) query = query.eq('type', type);

        const { data, error } = await query;
        if (error) throw error;

        const pharmacies = (data || [])
          .map((p: any) => ({
            ...p,
            distance_km: haversine(lat, lng, p.latitude, p.longitude),
          }))
          .filter((p: any) => p.distance_km <= radius)
          .sort((a: any, b: any) => a.distance_km - b.distance_km);

        return new Response(JSON.stringify({ pharmacies, count: pharmacies.length }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'detail': {
        const id = url.searchParams.get('id');
        if (!id) {
          return new Response(JSON.stringify({ error: 'id required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data, error } = await supabase
          .from('health_pharmacies')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ pharmacy: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'create': {
        if (req.method !== 'POST') {
          return new Response(JSON.stringify({ error: 'POST required' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const body = await req.json();
        const { data, error } = await supabase
          .from('health_pharmacies')
          .insert(body)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ pharmacy: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown endpoint' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (err: any) {
    console.error('Health Pharmacies Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
