import React from 'react';

const createIcon = (name: string) => {
  const Icon = (props: any) => React.createElement('svg', { 
    width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
    ...props 
  });
  Icon.displayName = name;
  return Icon;
};

export const Activity = createIcon('Activity');
export const AlertCircle = createIcon('AlertCircle');
export const AlertTriangle = createIcon('AlertTriangle');
export const ArrowLeft = createIcon('ArrowLeft');
export const ArrowRight = createIcon('ArrowRight');
export const Bell = createIcon('Bell');
export const Building2 = createIcon('Building2');
export const Calendar = createIcon('Calendar');
export const Check = createIcon('Check');
export const ChevronDown = createIcon('ChevronDown');
export const ChevronLeft = createIcon('ChevronLeft');
export const ChevronRight = createIcon('ChevronRight');
export const ChevronUp = createIcon('ChevronUp');
export const Clock = createIcon('Clock');
export const CreditCard = createIcon('CreditCard');
export const Download = createIcon('Download');
export const Edit = createIcon('Edit');
export const Eye = createIcon('Eye');
export const EyeOff = createIcon('EyeOff');
export const FileText = createIcon('FileText');
export const Filter = createIcon('Filter');
export const Heart = createIcon('Heart');
export const Home = createIcon('Home');
export const Image = createIcon('Image');
export const Info = createIcon('Info');
export const Key = createIcon('Key');
export const Lock = createIcon('Lock');
export const LogOut = createIcon('LogOut');
export const Mail = createIcon('Mail');
export const MapPin = createIcon('MapPin');
export const Menu = createIcon('Menu');
export const MessageCircle = createIcon('MessageCircle');
export const MoreHorizontal = createIcon('MoreHorizontal');
export const MoreVertical = createIcon('MoreVertical');
export const Phone = createIcon('Phone');
export const Pill = createIcon('Pill');
export const Play = createIcon('Play');
export const Plus = createIcon('Plus');
export const RefreshCw = createIcon('RefreshCw');
export const Save = createIcon('Save');
export const Search = createIcon('Search');
export const Settings = createIcon('Settings');
export const Shield = createIcon('Shield');
export const ShoppingBag = createIcon('ShoppingBag');
export const Star = createIcon('Star');
export const Stethoscope = createIcon('Stethoscope');
export const Syringe = createIcon('Syringe');
export const Trash = createIcon('Trash');
export const Truck = createIcon('Truck');
export const Upload = createIcon('Upload');
export const User = createIcon('User');
export const Users = createIcon('Users');
export const Video = createIcon('Video');
export const X = createIcon('X');
export const XCircle = createIcon('XCircle');
export const Zap = createIcon('Zap');

export function createLucideIcon(name: string) {
  return createIcon(name);
}
