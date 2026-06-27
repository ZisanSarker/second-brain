import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class StorageService implements OnModuleInit {
  private client!: Minio.Client;
  private readonly uploadBucket: string;
  private readonly documentsBucket: string;
  private readonly thumbnailsBucket: string;
  private readonly generatedBucket: string;

  constructor(private config: ConfigService) {
    this.uploadBucket = this.config.get('MINIO_UPLOAD_BUCKET', 'uploads');
    this.documentsBucket = this.config.get('MINIO_DOCUMENTS_BUCKET', 'documents');
    this.thumbnailsBucket = this.config.get('MINIO_THUMBNAILS_BUCKET', 'thumbnails');
    this.generatedBucket = this.config.get('MINIO_GENERATED_BUCKET', 'generated');
  }

  async onModuleInit() {
    this.client = new Minio.Client({
      endPoint: this.config.get('MINIO_ENDPOINT', 'localhost'),
      port: Number(this.config.get('MINIO_PORT', '9000')),
      useSSL: this.config.get('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.config.get('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: this.config.get('MINIO_SECRET_KEY', 'minioadmin'),
    });

    await this.ensureBuckets();
  }

  private async ensureBuckets() {
    const buckets = [
      this.uploadBucket,
      this.documentsBucket,
      this.thumbnailsBucket,
      this.generatedBucket,
    ];

    for (const bucket of buckets) {
      const exists = await this.client.bucketExists(bucket);
      if (!exists) {
        await this.client.makeBucket(bucket);
      }
    }
  }

  async uploadTemp(
    workspaceId: string,
    userId: string,
    fileName: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    const key = `uploads/${workspaceId}/${userId}/${crypto.randomUUID()}_${fileName}`;
    await this.client.putObject(this.uploadBucket, key, buffer, buffer.length, {
      'Content-Type': mimeType,
    });
    return key;
  }

  async moveToPermanent(
    tempKey: string,
    workspaceId: string,
    documentId: string,
    versionNumber: number,
  ): Promise<string> {
    const fileName = tempKey.split('/').pop()!;
    const permanentKey = `documents/${workspaceId}/${documentId}/${versionNumber}/${fileName}`;

    await this.client.copyObject(
      this.documentsBucket,
      permanentKey,
      `/${this.uploadBucket}/${tempKey}`,
    );

    await this.client.removeObject(this.uploadBucket, tempKey);

    return permanentKey;
  }

  async getPresignedUrl(key: string, bucket?: string): Promise<string> {
    const targetBucket = bucket ?? this.documentsBucket;
    return this.client.presignedGetObject(targetBucket, key, 60 * 60);
  }

  async getPresignedUploadUrl(
    workspaceId: string,
    userId: string,
    fileName: string,
  ): Promise<{ url: string; key: string }> {
    const key = `uploads/${workspaceId}/${userId}/${crypto.randomUUID()}_${fileName}`;
    const url = await this.client.presignedPutObject(this.uploadBucket, key, 15 * 60);
    return { url, key };
  }

  async deleteObject(key: string, bucket?: string) {
    const targetBucket = bucket ?? this.documentsBucket;
    await this.client.removeObject(targetBucket, key);
  }

  async deletePrefix(prefix: string, bucket?: string) {
    const targetBucket = bucket ?? this.documentsBucket;
    const objects = this.client.listObjects(targetBucket, prefix, true);
    const objectsToRemove: Minio.BucketItem[] = [];

    for await (const obj of objects) {
      objectsToRemove.push(obj);
    }

    if (objectsToRemove.length > 0) {
      const names = objectsToRemove.map((o) => o.name).filter(Boolean) as string[];
      if (names.length > 0) {
        await this.client.removeObjects(targetBucket, names);
      }
    }
  }

  async getObject(key: string, bucket?: string): Promise<Buffer> {
    const targetBucket = bucket ?? this.documentsBucket;
    const stream = await this.client.getObject(targetBucket, key);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
    return Buffer.concat(chunks);
  }
}
