export function useRouter() {
  return {
    push: (url: string) => { console.log('navigate to', url); },
    replace: (url: string) => { console.log('replace with', url); },
    back: () => { console.log('go back'); },
    forward: () => { console.log('go forward'); },
    refresh: () => { console.log('refresh'); },
    prefetch: (url: string) => { console.log('prefetch', url); },
  };
}

export function usePathname() {
  return '/';
}

export function useSearchParams() {
  return new URLSearchParams();
}

export function useParams() {
  return {};
}

export function redirect(url: string) {
  console.log('redirect to', url);
}

export function notFound() {
  console.log('not found');
}
