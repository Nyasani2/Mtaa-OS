import React from 'react';

interface LinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  [key: string]: any;
}

export default function Link({ href, children, ...props }: LinkProps) {
  return React.createElement('a', { href, ...props }, children);
}
