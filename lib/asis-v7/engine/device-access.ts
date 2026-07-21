/**
 * ASIS v7 Device Access Engine
 * Accesses device photos, documents, contacts via Expo APIs
 * Permission-gated, privacy-first
 * Kamos Theory: device data = observation → personal context → growth
 */

import { PhotoQuery, DocumentQuery } from '../types';

// ─── Photo Access ───────────────────────────────────────────────

interface PhotoAsset {
  id: string;
  uri: string;
  width: number;
  height: number;
  creationTime: number;
  modificationTime: number;
  mediaType: 'photo' | 'video' | 'audio' | 'unknown';
  filename: string;
  albumId?: string;
}

export class PhotoAccessEngine {
  private hasPermission: boolean = false;
  private mediaLibrary: any = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Dynamic import to avoid web crashes
      const { MediaLibrary } = await import('expo-media-library');
      this.mediaLibrary = MediaLibrary;

      const { status } = await MediaLibrary.requestPermissionsAsync();
      this.hasPermission = status === 'granted';
    } catch (error) {
      console.warn('[ASIS Device] MediaLibrary not available:', error);
      this.hasPermission = false;
    }
  }

  /**
   * Search photos by query criteria
   */
  async searchPhotos(query: PhotoQuery): Promise<PhotoAsset[]> {
    if (!this.hasPermission || !this.mediaLibrary) {
      return [];
    }

    try {
      const options: any = {
        mediaType: ['photo'],
        sortBy: ['creationTime'],
        first: 50,
      };

      // Date range filter
      if (query.dateRange) {
        options.createdAfter = query.dateRange.start;
        options.createdBefore = query.dateRange.end;
      }

      // Album filter
      if (query.album) {
        const albums = await this.mediaLibrary.getAlbumsAsync();
        const album = albums.find((a: any) =>
          a.title.toLowerCase().includes(query.album!.toLowerCase())
        );
        if (album) {
          options.album = album.id;
        }
      }

      const { assets } = await this.mediaLibrary.getAssetsAsync(options);

      // Filter by person name (basic filename/content matching)
      let results = assets;
      if (query.person) {
        const personLower = query.person.toLowerCase();
        results = assets.filter((asset: any) =>
          asset.filename.toLowerCase().includes(personLower)
        );
      }

      return results.map((asset: any) => ({
        id: asset.id,
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        creationTime: asset.creationTime,
        modificationTime: asset.modificationTime,
        mediaType: asset.mediaType,
        filename: asset.filename,
        albumId: asset.albumId,
      }));
    } catch (error) {
      console.warn('[ASIS Device] Photo search failed:', error);
      return [];
    }
  }

  /**
   * Get recent photos
   */
  async getRecentPhotos(count: number = 10): Promise<PhotoAsset[]> {
    return this.searchPhotos({
      dateRange: {
        start: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
        end: Date.now(),
      },
    });
  }

  /**
   * Get photos from specific date
   */
  async getPhotosFromDate(date: Date): Promise<PhotoAsset[]> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

    return this.searchPhotos({
      dateRange: { start: startOfDay, end: endOfDay },
    });
  }

  /**
   * Get photo count
   */
  async getPhotoCount(): Promise<number> {
    if (!this.hasPermission || !this.mediaLibrary) return 0;

    try {
      const { totalCount } = await this.mediaLibrary.getAssetsAsync({
        mediaType: ['photo'],
        first: 0,
      });
      return totalCount;
    } catch {
      return 0;
    }
  }

  /**
   * Check permission status
   */
  async checkPermission(): Promise<boolean> {
    if (!this.mediaLibrary) {
      await this.initialize();
    }
    return this.hasPermission;
  }

  /**
   * Request permission
   */
  async requestPermission(): Promise<boolean> {
    return this.initialize().then(() => this.hasPermission);
  }
}

// ─── Document Access ────────────────────────────────────────────

interface DocumentAsset {
  name: string;
  uri: string;
  size: number;
  modificationTime: number;
  type: string;
}

export class DocumentAccessEngine {
  private fileSystem: any = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      const FileSystem = await import('expo-file-system');
      this.fileSystem = FileSystem;
    } catch (error) {
      console.warn('[ASIS Device] FileSystem not available:', error);
    }
  }

  /**
   * Search documents by name/content
   */
  async searchDocuments(query: DocumentQuery): Promise<DocumentAsset[]> {
    if (!this.fileSystem) {
      return [];
    }

    try {
      const documentDirectory = this.fileSystem.documentDirectory;
      if (!documentDirectory) return [];

      const files = await this.fileSystem.readDirectoryAsync(documentDirectory);
      const results: DocumentAsset[] = [];

      for (const file of files) {
        // Filter by file type
        if (query.fileTypes && query.fileTypes.length > 0) {
          const ext = file.split('.').pop()?.toLowerCase();
          if (!ext || !query.fileTypes.includes(ext)) continue;
        }

        // Filter by name
        if (!file.toLowerCase().includes(query.text.toLowerCase())) continue;

        const fileInfo = await this.fileSystem.getInfoAsync(`${documentDirectory}${file}`);
        if (fileInfo.exists) {
          results.push({
            name: file,
            uri: fileInfo.uri,
            size: fileInfo.size || 0,
            modificationTime: fileInfo.modificationTime || 0,
            type: file.split('.').pop() || 'unknown',
          });
        }
      }

      return results;
    } catch (error) {
      console.warn('[ASIS Device] Document search failed:', error);
      return [];
    }
  }

  /**
   * Get all documents
   */
  async getAllDocuments(): Promise<DocumentAsset[]> {
    return this.searchDocuments({ text: '' });
  }

  /**
   * Read document content (text files only)
   */
  async readDocument(uri: string): Promise<string | null> {
    if (!this.fileSystem) return null;

    try {
      const content = await this.fileSystem.readAsStringAsync(uri);
      return content;
    } catch (error) {
      console.warn('[ASIS Device] Read document failed:', error);
      return null;
    }
  }

  /**
   * Get document count and total size
   */
  async getDocumentStats(): Promise<{ count: number; totalSize: number }> {
    const docs = await this.getAllDocuments();
    return {
      count: docs.length,
      totalSize: docs.reduce((sum, d) => sum + d.size, 0),
    };
  }
}

// ─── Contact Access ─────────────────────────────────────────────

interface ContactInfo {
  id: string;
  name: string;
  phoneNumbers: string[];
  emails: string[];
  imageUri?: string;
}

export class ContactAccessEngine {
  private hasPermission: boolean = false;
  private contactsModule: any = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      const Contacts = await import('expo-contacts');
      this.contactsModule = Contacts;

      const { status } = await Contacts.requestPermissionsAsync();
      this.hasPermission = status === 'granted';
    } catch (error) {
      console.warn('[ASIS Device] Contacts not available:', error);
    }
  }

  /**
   * Search contacts by name or phone
   */
  async searchContacts(query: string): Promise<ContactInfo[]> {
    if (!this.hasPermission || !this.contactsModule) {
      return [];
    }

    try {
      const { data } = await this.contactsModule.getContactsAsync({
        name: query,
        fields: [this.contactsModule.Fields.PhoneNumbers, this.contactsModule.Fields.Emails, this.contactsModule.Fields.Image],
      });

      return data.map((contact: any) => ({
        id: contact.id,
        name: contact.name || '',
        phoneNumbers: (contact.phoneNumbers || []).map((p: any) => p.number),
        emails: (contact.emails || []).map((e: any) => e.email),
        imageUri: contact.image?.uri,
      }));
    } catch (error) {
      console.warn('[ASIS Device] Contact search failed:', error);
      return [];
    }
  }

  /**
   * Get all contacts count
   */
  async getContactsCount(): Promise<number> {
    if (!this.hasPermission || !this.contactsModule) return 0;

    try {
      const { total } = await this.contactsModule.getContactsAsync({
        fields: [],
        pageSize: 1,
      });
      return total;
    } catch {
      return 0;
    }
  }
}

// ─── Device Info ────────────────────────────────────────────────

export interface DeviceInfo {
  brand: string;
  manufacturer: string;
  modelName: string;
  modelId: string;
  designName: string;
  productName: string;
  deviceYearClass: number | null;
  totalMemory: number | null;
  supportedCpuArchitectures: string[] | null;
  osName: string;
  osVersion: string;
  osBuildId: string | null;
  osInternalBuildId: string | null;
  osBuildFingerprint: string | null;
  platformApiLevel: number | null;
  deviceName: string | null;
}

export async function getDeviceInfo(): Promise<DeviceInfo | null> {
  try {
    const Device = await import('expo-device');
    return {
      brand: Device.brand || 'Unknown',
      manufacturer: Device.manufacturer || 'Unknown',
      modelName: Device.modelName || 'Unknown',
      modelId: Device.modelId || 'Unknown',
      designName: Device.designName || 'Unknown',
      productName: Device.productName || 'Unknown',
      deviceYearClass: Device.deviceYearClass || null,
      totalMemory: Device.totalMemory || null,
      supportedCpuArchitectures: Device.supportedCpuArchitectures || null,
      osName: Device.osName || 'Unknown',
      osVersion: Device.osVersion || 'Unknown',
      osBuildId: Device.osBuildId || null,
      osInternalBuildId: Device.osInternalBuildId || null,
      osBuildFingerprint: Device.osBuildFingerprint || null,
      platformApiLevel: Device.platformApiLevel || null,
      deviceName: Device.deviceName || null,
    };
  } catch (error) {
    console.warn('[ASIS Device] Device info not available:', error);
    return null;
  }
}

// ─── Singleton Instances ────────────────────────────────────────

let photoEngine: PhotoAccessEngine | null = null;
let documentEngine: DocumentAccessEngine | null = null;
let contactEngine: ContactAccessEngine | null = null;

export function getPhotoEngine(): PhotoAccessEngine {
  if (!photoEngine) photoEngine = new PhotoAccessEngine();
  return photoEngine;
}

export function getDocumentEngine(): DocumentAccessEngine {
  if (!documentEngine) documentEngine = new DocumentAccessEngine();
  return documentEngine;
}

export function getContactEngine(): ContactAccessEngine {
  if (!contactEngine) contactEngine = new ContactAccessEngine();
  return contactEngine;
}

// ─── Unified Device Access ──────────────────────────────────────

export class DeviceAccess {
  private photoEngine: PhotoAccessEngine;
  private documentEngine: DocumentAccessEngine;
  private contactEngine: ContactAccessEngine;

  constructor() {
    this.photoEngine = getPhotoEngine();
    this.documentEngine = getDocumentEngine();
    this.contactEngine = getContactEngine();
  }

  async searchPhotos(query: PhotoQuery): Promise<PhotoAsset[]> {
    return this.photoEngine.searchPhotos(query);
  }

  async searchDocuments(query: DocumentQuery): Promise<DocumentAsset[]> {
    return this.documentEngine.searchDocuments(query);
  }

  async searchContacts(query: string): Promise<ContactInfo[]> {
    return this.contactEngine.searchContacts(query);
  }

  async getDeviceStats(): Promise<{
    photos: number;
    documents: { count: number; size: number };
    contacts: number;
    device: DeviceInfo | null;
  }> {
    const [photos, docs, contacts, device] = await Promise.all([
      this.photoEngine.getPhotoCount(),
      this.documentEngine.getDocumentStats(),
      this.contactEngine.getContactsCount(),
      getDeviceInfo(),
    ]);

    return { photos, documents: docs, contacts, device };
  }
}
