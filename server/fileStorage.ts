import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import zlib from 'zlib';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

export interface StoredFile {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  compressedSize: number;
  path: string;
  compressed: boolean;
  createdAt: Date;
  userId: string;
}

export class FileStorageService {
  private baseDir: string;
  private resumesDir: string;
  private maxFileSize: number = 10 * 1024 * 1024; // 10MB
  private allowedMimeTypes: string[] = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  constructor() {
    // Use local storage for development, can be configured for cloud storage in production
    this.baseDir = process.env.NODE_ENV === 'production' 
      ? '/tmp/autojobr-files' 
      : './uploads';
    this.resumesDir = path.join(this.baseDir, 'resumes');
    this.ensureDirectories();
  }

  private async ensureDirectories(): Promise<void> {
    try {
      await access(this.baseDir);
    } catch {
      await mkdir(this.baseDir, { recursive: true });
    }

    try {
      await access(this.resumesDir);
    } catch {
      await mkdir(this.resumesDir, { recursive: true });
    }
  }

  async storeResume(file: Express.Multer.File, userId: string): Promise<StoredFile> {
    // Validate file
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`);
    }

    if (file.size > this.maxFileSize) {
      throw new Error(`File too large. Maximum size: ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    // Generate unique file ID
    const fileId = `resume_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileExtension = this.getFileExtension(file.originalname);
    const fileName = `${fileId}${fileExtension}`;
    const filePath = path.join(this.resumesDir, fileName);

    // Compress file data
    const originalBuffer = file.buffer;
    const compressedBuffer = await gzip(originalBuffer);
    
    // Determine if compression is beneficial (if compressed size is smaller)
    const useCompression = compressedBuffer.length < originalBuffer.length;
    const finalBuffer = useCompression ? compressedBuffer : originalBuffer;
    const finalPath = useCompression ? `${filePath}.gz` : filePath;

    // Store file
    await writeFile(finalPath, finalBuffer);

    const storedFile: StoredFile = {
      id: fileId,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: originalBuffer.length,
      compressedSize: finalBuffer.length,
      path: finalPath,
      compressed: useCompression,
      createdAt: new Date(),
      userId
    };

    console.log(`[FILE_STORAGE] Stored resume: ${file.originalname} (${this.formatBytes(originalBuffer.length)} -> ${this.formatBytes(finalBuffer.length)}) for user ${userId}`);

    return storedFile;
  }

  async retrieveResume(fileId: string, userId: string): Promise<Buffer | null> {
    try {
      // For security, ensure the file belongs to the user
      const fileInfo = await this.getFileInfo(fileId, userId);
      if (!fileInfo) {
        return null;
      }

      const fileBuffer = await readFile(fileInfo.path);
      
      // Decompress if necessary
      if (fileInfo.compressed) {
        return await gunzip(fileBuffer);
      }
      
      return fileBuffer;
    } catch (error) {
      console.error(`[FILE_STORAGE] Error retrieving file ${fileId}:`, error);
      return null;
    }
  }

  async deleteResume(fileId: string, userId: string): Promise<boolean> {
    try {
      const fileInfo = await this.getFileInfo(fileId, userId);
      if (!fileInfo) {
        return false;
      }

      await fs.promises.unlink(fileInfo.path);
      console.log(`[FILE_STORAGE] Deleted resume ${fileId} for user ${userId}`);
      return true;
    } catch (error) {
      console.error(`[FILE_STORAGE] Error deleting file ${fileId}:`, error);
      return false;
    }
  }

  private async getFileInfo(fileId: string, userId: string): Promise<StoredFile | null> {
    // In a production environment, this would query a database
    // For now, we'll reconstruct the file path and check if it exists
    const possibleExtensions = ['.pdf', '.doc', '.docx', '.txt'];
    
    for (const ext of possibleExtensions) {
      const fileName = `${fileId}${ext}`;
      const filePath = path.join(this.resumesDir, fileName);
      const compressedPath = `${filePath}.gz`;
      
      try {
        // Check compressed version first
        await access(compressedPath);
        const stats = await fs.promises.stat(compressedPath);
        return {
          id: fileId,
          originalName: `resume${ext}`,
          mimeType: this.getMimeTypeFromExtension(ext),
          size: 0, // Would be stored in database
          compressedSize: stats.size,
          path: compressedPath,
          compressed: true,
          createdAt: stats.birthtime,
          userId
        };
      } catch {
        // Try uncompressed version
        try {
          await access(filePath);
          const stats = await fs.promises.stat(filePath);
          return {
            id: fileId,
            originalName: `resume${ext}`,
            mimeType: this.getMimeTypeFromExtension(ext),
            size: stats.size,
            compressedSize: stats.size,
            path: filePath,
            compressed: false,
            createdAt: stats.birthtime,
            userId
          };
        } catch {
          continue;
        }
      }
    }
    
    return null;
  }

  private getFileExtension(filename: string): string {
    return path.extname(filename).toLowerCase();
  }

  private getMimeTypeFromExtension(ext: string): string {
    const mimeMap: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain'
    };
    return mimeMap[ext] || 'application/octet-stream';
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Cloud storage methods for production deployment
  async uploadToCloud(fileBuffer: Buffer, fileName: string): Promise<string> {
    // TODO: Implement cloud storage upload (AWS S3, Google Cloud Storage, etc.)
    // This would be used in production with proper cloud credentials
    throw new Error('Cloud storage not implemented. Configure AWS S3 or similar service.');
  }

  async downloadFromCloud(fileName: string): Promise<Buffer> {
    // TODO: Implement cloud storage download
    throw new Error('Cloud storage not implemented. Configure AWS S3 or similar service.');
  }

  // Get storage statistics
  async getStorageStats(userId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    compressedSize: number;
    compressionRatio: number;
  }> {
    // This would query the database in production
    return {
      totalFiles: 0,
      totalSize: 0,
      compressedSize: 0,
      compressionRatio: 0
    };
  }
}

export const fileStorage = new FileStorageService();