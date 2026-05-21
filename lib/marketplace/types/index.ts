export interface Listing {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  images: string[];
  condition: "new" | "used" | "refurbished";
  location: string;
  status: "active" | "sold" | "reserved" | "removed";
  createdAt: string;
  views: number;
  inquiries: number;
}

export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  quantity: number;
  totalPrice: number;
  currency: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "disputed";
  escrowStatus: "held" | "released" | "refunded";
  shippingAddress?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Escrow {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: "pending" | "funded" | "released" | "disputed" | "refunded";
  fundedAt?: string;
  releasedAt?: string;
  disputeReason?: string;
}

export interface TrustScore {
  userId: string;
  score: number;
  transactions: number;
  disputes: number;
  resolvedDisputes: number;
  verified: boolean;
}
