import { Client } from "minio";

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT!,
  port: parseInt(process.env.MINIO_PORT || "9000"),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
});

const BUCKET_NAME = process.env.MINIO_BUCKET!;

async function ensureBucket() {
  const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
  if (!bucketExists) {
    await minioClient.makeBucket(BUCKET_NAME);
    console.log(`Bucket ${BUCKET_NAME} created`);
  }
}

ensureBucket().catch(console.error);

export async function uploadFile(
  fileName: string,
  buffer: Buffer,
  contentType?: string
) {
  const objectName = `uploads/${Date.now()}-${fileName}`;

  await minioClient.putObject(
    BUCKET_NAME,
    objectName,
    buffer,
    buffer.length,
    contentType ? { "Content-Type": contentType } : undefined
  );

  return objectName;
}

export async function getFileUrl(objectName: string, expiryHours = 24) {
  const url = await minioClient.presignedGetObject(
    BUCKET_NAME,
    objectName,
    expiryHours * 60 * 60
  );
  return url;
}

export async function deleteFile(objectName: string) {
  await minioClient.removeObject(BUCKET_NAME, objectName);
}

export async function getFile(objectName: string) {
  return await minioClient.getObject(BUCKET_NAME, objectName);
}

export default minioClient;
