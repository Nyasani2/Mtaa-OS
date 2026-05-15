export class StorageEngine {
  private client: any;
  private cdnBaseUrl: string;

  constructor(client: any, cdnBaseUrl = '') {
    this.client = client;
    this.cdnBaseUrl = cdnBaseUrl;
  }

  async getPublicUrl(path: string, config: { cdnEnabled?: boolean } = {}) {
    const publicUrl =
      this.client?.storage
        ?.from('public')
        ?.getPublicUrl(path)?.data?.publicUrl || '';

    const baseUrl =
      process.env.EXPO_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      '';

    const cdnUrl =
      config.cdnEnabled && this.cdnBaseUrl
        ? publicUrl.replace(baseUrl, this.cdnBaseUrl)
        : undefined;

    return {
      publicUrl,
      cdnUrl,
    };
  }
}
