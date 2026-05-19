export class ArchitectureGuard {
  constructor(..._args: any[]) {}

  activate() {
    console.log('🛡️ architecture guard active');
  }
}

export default ArchitectureGuard;
