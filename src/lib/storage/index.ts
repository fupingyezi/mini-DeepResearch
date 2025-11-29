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
  try {
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
    if (!bucketExists) {
      await minioClient.makeBucket(BUCKET_NAME);
      console.log(`Bucket ${BUCKET_NAME} created`);
    } else {
      console.log(`Bucket ${BUCKET_NAME} already exists`);
    }
  } catch (error) {
    console.error("MinIO connection error:", error);
    throw new Error(`Failed to connect to MinIO: ${error}`);
  }
}

let bucketInitialized = false;
async function initializeBucket() {
  if (!bucketInitialized) {
    await ensureBucket();
    bucketInitialized = true;
  }
}

export async function uploadFile(
  fileName: string,
  buffer: Buffer,
  contentType?: string
) {
  await initializeBucket();
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
