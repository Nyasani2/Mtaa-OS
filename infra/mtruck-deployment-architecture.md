# MTRUCK OS DEPLOYMENT ARCHITECTURE

## 1. Edge Layer (City Nodes)
- Nairobi Node
- Mombasa Node
- Kampala Node
Each handles:
- GPS ingestion
- Dispatch execution
- Local routing

## 2. Regional Layer (East Africa Cluster)
- Aggregates city data
- Runs predictive AI
- Controls surge pricing

## 3. Core Cloud Layer
- Global dispatch brain
- Marketplace system
- Payment & settlement engine
- App Store registry

## 4. Real-time Sync
- Supabase Realtime (event streaming)
- WebSocket fleet updates
- Event bus (MTAA OS backbone)

## 5. Scaling Rule
- Each 10,000 vehicles = new edge node
- Each node is independent but synced via event bus
