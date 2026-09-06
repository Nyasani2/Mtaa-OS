// @ts-nocheck
import DomainHubScreen from '@/lib/hubs/DomainHubScreen';
export default function ProfessionalPortfolioScreen() {
  return <DomainHubScreen config={{
    title: 'Professional Portfolio', subtitle: 'Showcase your work', icon: 'briefcase', color: '#8b5cf6',
    tiles: [{ label: 'Projects', icon: 'folder-open', route: '/(os)/profile/professional/portfolio' }, { label: 'Skills', icon: 'hammer', route: '/(os)/profile/professional' }, { label: 'Certifications', icon: 'award', route: '/(os)/profile/professional' }]
  }} />;
}
