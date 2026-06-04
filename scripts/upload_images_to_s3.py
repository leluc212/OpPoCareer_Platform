#!/usr/bin/env python3
"""
Upload images in the public/images folder to S3, categorized into banner, poster, and system.

Usage:
  python scripts/upload_images_to_s3.py --bucket opporeview-cv-storage --region ap-southeast-1
"""
import argparse
import os
import sys
import boto3
from botocore.exceptions import ClientError

IMAGE_MAPPING = {
    # Banners
    'bamosbanner.jpg': 'banner',
    'banner.png': 'banner',
    'banner1.png': 'banner',
    'banner2.png': 'banner',
    'bannerdai.png': 'banner',
    'lebanner.jpg': 'banner',
    'seoul.jpg': 'banner',
    'unnamed.jpg': 'banner',
    'unnamed1.jpg': 'banner',

    # Posters
    'poster.png': 'poster',
    'phache.png': 'poster',
    'lemoments.png': 'poster',
    'bamos1.jpg': 'poster',
    'katinatQ8.jpg': 'poster',
    'phucloctho.jpg': 'poster',

    # System
    'logo.png': 'system',
    'logoplt.png': 'system',
    'mascot.png': 'system',
    'linhvat.png': 'system',
    'appstore1.jpg': 'system',
    'chplay.jpg': 'system',
    'coffeehouse.jpg': 'system',
    'highlands.jpg': 'system',
    'katinatlogo.jpg': 'system',
    'katinat.png': 'system',
    'bamos.png': 'system',
    'starbuck.png': 'system',
    'phuclong.jpg': 'system',
    'ngogia.png': 'system',
    'suncha.jpg': 'system',
    'trungnguyen.jpg': 'system',
}

def get_content_type(filename):
    ext = os.path.splitext(filename)[1].lower()
    if ext in ('.jpg', '.jpeg'):
        return 'image/jpeg'
    elif ext == '.png':
        return 'image/png'
    elif ext == '.gif':
        return 'image/gif'
    elif ext == '.svg':
        return 'image/svg+xml'
    elif ext == '.webp':
        return 'image/webp'
    return 'application/octet-stream'

def main():
    parser = argparse.ArgumentParser(description='Upload local images to S3 categorized into folders.')
    parser.add_argument('--bucket', required=True, help='S3 bucket name')
    parser.add_argument('--region', default='ap-southeast-1', help='AWS region')
    parser.add_argument('--profile', default=None, help='AWS profile name')
    parser.add_argument('--folder', default='public/images', help='Local folder containing images')
    parser.add_argument('--yes', action='store_true', help='Skip confirmation prompt')
    args = parser.parse_args()

    session = boto3.Session(profile_name=args.profile) if args.profile else boto3.Session()
    s3_client = session.client('s3', region_name=args.region)

    local_dir = args.folder
    if not os.path.exists(local_dir):
        print(f"ERROR: Local directory '{local_dir}' does not exist.")
        sys.exit(1)

    # Get local files
    files = [f for f in os.listdir(local_dir) if os.path.isfile(os.path.join(local_dir, f))]
    if not files:
        print(f"No files found in '{local_dir}'.")
        return

    print(f"Found {len(files)} files in '{local_dir}'.")
    print(f"Bucket: {args.bucket}")
    print(f"Region: {args.region}")
    
    # Preview classification mapping
    classified = {}
    for filename in files:
        category = IMAGE_MAPPING.get(filename, 'system') # Default to system if not mapped
        classified.setdefault(category, []).append(filename)

    print("\nProposed classification:")
    for cat, names in sorted(classified.items()):
        print(f"  [{cat}]: {len(names)} files ({', '.join(names[:3])}{'...' if len(names) > 3 else ''})")

    if not args.yes:
        confirm = input("\nProceed with upload to S3? (yes/no): ").strip().lower()
        if confirm not in ('y', 'yes'):
            print("Upload aborted.")
            return

    # Perform upload
    success_count = 0
    fail_count = 0
    for filename in files:
        category = IMAGE_MAPPING.get(filename, 'system')
        s3_key = f"{category}/{filename}"
        local_path = os.path.join(local_dir, filename)
        content_type = get_content_type(filename)

        print(f"Uploading {filename} -> s3://{args.bucket}/{s3_key} ({content_type})...", end='', flush=True)
        try:
            s3_client.upload_file(
                Filename=local_path,
                Bucket=args.bucket,
                Key=s3_key,
                ExtraArgs={
                    'ContentType': content_type,
                }
            )
            print(" SUCCESS")
            success_count += 1
        except Exception as e:
            print(f" FAILED: {e}")
            fail_count += 1

    print(f"\nUpload complete. Success: {success_count}, Failed: {fail_count}")

if __name__ == '__main__':
    main()
