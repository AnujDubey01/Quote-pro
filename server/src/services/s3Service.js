const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

// Helper to check if S3 configuration is fully provided
const isS3Configured = () => {
    return Boolean(
        process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY &&
        process.env.AWS_REGION &&
        process.env.AWS_S3_BUCKET
    );
};

// Initialize S3 Client lazily
let s3ClientInstance = null;
const getS3Client = () => {
    if (!s3ClientInstance) {
        if (!isS3Configured()) {
            throw new Error('AWS S3 credentials or bucket name are not fully configured in environment variables');
        }
        s3ClientInstance = new S3Client({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
        });
    }
    return s3ClientInstance;
};

/**
 * Upload a raw buffer to S3
 * @param {Buffer} buffer - File buffer
 * @param {string} key - S3 storage key (path)
 * @param {string} contentType - MIME type (e.g., 'image/png', 'image/webp')
 * @returns {Promise<string>} Public URL of uploaded object
 */
const uploadToS3 = async (buffer, key, contentType = 'image/png') => {
    const client = getS3Client();
    const bucket = process.env.AWS_S3_BUCKET;

    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    });

    await client.send(command);

    // Standard public S3 URL format
    const publicUrl = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    return publicUrl;
};

/**
 * Upload a tenant product image with structured namespace:
 * tenants/{companyId}/products/{sku}.{ext}
 */
const uploadProductImage = async (companyId, sku, fileBuffer, mimeType = 'image/png') => {
    const ext = mimeType.split('/')[1] || 'png';
    const cleanSku = String(sku).replace(/[^a-zA-Z0-9-_]/g, '_');
    const key = `tenants/${companyId}/products/${cleanSku}.${ext}`;
    return await uploadToS3(fileBuffer, key, mimeType);
};

/**
 * Upload a tenant company logo:
 * tenants/{companyId}/branding/logo.{ext}
 */
const uploadCompanyLogo = async (companyId, fileBuffer, mimeType = 'image/png') => {
    const ext = mimeType.split('/')[1] || 'png';
    const key = `tenants/${companyId}/branding/logo.${ext}`;
    return await uploadToS3(fileBuffer, key, mimeType);
};

/**
 * Delete an object from S3 by key
 */
const deleteFromS3 = async (key) => {
    if (!isS3Configured()) return;
    try {
        const client = getS3Client();
        const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
        });
        await client.send(command);
    } catch (err) {
        console.warn(`S3 delete warning for key ${key}:`, err.message);
    }
};

/**
 * Quick diagnostic ping to verify S3 bucket access & credentials
 */
const verifyS3Connection = async () => {
    if (!isS3Configured()) {
        return { connected: false, message: 'Missing AWS S3 configuration in .env' };
    }
    try {
        const client = getS3Client();
        const command = new HeadBucketCommand({ Bucket: process.env.AWS_S3_BUCKET });
        await client.send(command);
        return {
            connected: true,
            bucket: process.env.AWS_S3_BUCKET,
            region: process.env.AWS_REGION,
            message: 'S3 Bucket connected successfully'
        };
    } catch (err) {
        return {
            connected: false,
            bucket: process.env.AWS_S3_BUCKET,
            region: process.env.AWS_REGION,
            error: err.message
        };
    }
};

/**
 * Extract S3 object key from a full public S3 URL
 * e.g. https://quotepro-media-prod.s3.ap-south-1.amazonaws.com/tenants/6abca6f180e48e4c17c4bff2/products/K-26347IN-9-CP.png
 * returns: tenants/6abca6f180e48e4c17c4bff2/products/K-26347IN-9-CP.png
 */
const extractS3KeyFromUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    const bucket = process.env.AWS_S3_BUCKET;
    if (url.includes('.amazonaws.com/')) {
        const parts = url.split('.amazonaws.com/');
        if (parts[1]) {
            let key = decodeURIComponent(parts[1]);
            if (bucket && key.startsWith(`${bucket}/`)) {
                key = key.slice(bucket.length + 1);
            }
            return key;
        }
    }
    return null;
};

/**
 * Delete an object from S3 using its public URL
 */
const deleteS3ObjectByUrl = async (url) => {
    const key = extractS3KeyFromUrl(url);
    if (key) {
        await deleteFromS3(key);
        return true;
    }
    return false;
};

/**
 * List objects in S3 matching a given prefix
 * @param {string} prefix - S3 folder prefix (e.g. 'tenants/123/products/')
 * @returns {Promise<Array<{key: string, url: string, size: number, lastModified: Date}>>}
 */
const listS3Objects = async (prefix = '') => {
    if (!isS3Configured()) return [];
    try {
        const client = getS3Client();
        const bucket = process.env.AWS_S3_BUCKET;
        const region = process.env.AWS_REGION;
        const command = new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: prefix,
        });
        const response = await client.send(command);
        if (!response.Contents) return [];
        return response.Contents.map(item => ({
            key: item.Key,
            url: `https://${bucket}.s3.${region}.amazonaws.com/${item.Key}`,
            size: item.Size,
            lastModified: item.LastModified,
        }));
    } catch (err) {
        console.warn('Error listing S3 objects:', err.message);
        return [];
    }
};

module.exports = {
    isS3Configured,
    uploadToS3,
    uploadProductImage,
    uploadCompanyLogo,
    deleteFromS3,
    extractS3KeyFromUrl,
    deleteS3ObjectByUrl,
    listS3Objects,
    verifyS3Connection,
};
