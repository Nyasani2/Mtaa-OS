export interface CallLog {
  id: string;
  number: string;
  name?: string;
  type: 'incoming' | 'outgoing' | 'missed';
  timestamp: string;
  duration?: string;
}

export interface ActiveCall {
  id: string;
  number: string;
  name?: string;
  status: 'dialing' | 'ringing' | 'connected' | 'ended';
  duration: string;
  startTime: number;
}

export interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  phoneNumbers?: string[];
  emails?: string[];
  company?: string;
  notes?: string;
  createdAt: string;
}
