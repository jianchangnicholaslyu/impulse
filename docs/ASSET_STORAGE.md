# Supabase Asset Storage

IMPULSE can now store uploaded display images in Supabase Storage when a bucket is configured. If storage is not configured or an upload fails, the app keeps the existing base64 fallback so content editing still works.

## Recommended Bucket

Create a public Supabase Storage bucket:

```text
impulse-assets
```

Then add these Vercel environment variables:

```text
SUPABASE_STORAGE_BUCKET=impulse-assets
MAX_ASSET_BYTES=5242880
```

`MAX_ASSET_BYTES` is a server-side guard. The current admin display-image UI still limits game section and product images to 2MB.

## Data Safety

Existing `imageData` values remain valid. They can be either:

- a `data:image/...;base64,...` string from older/local uploads
- a Supabase public object URL from the new upload flow

No migration is required for old images.
