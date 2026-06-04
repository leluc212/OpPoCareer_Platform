#!/usr/bin/env python3
"""
Configure S3 bucket public access block and bucket policy to allow public read access
specifically for the categorized image directories (banner, poster, system),
while ensuring that candidate CVs (in 'cvs/') remain private.

Usage:
  python scripts/configure_s3_public_folders.py --bucket opporeview-cv-storage
"""
import argparse
import json
import boto3
from botocore.exceptions import ClientError

def main():
    parser = argparse.ArgumentParser(description='Configure public read access for specific folders in S3.')
    parser.add_argument('--bucket', required=True, help='S3 bucket name')
    parser.add_argument('--region', default='ap-southeast-1', help='AWS region')
    parser.add_argument('--profile', default=None, help='AWS profile name')
    args = parser.parse_args()

    session = boto3.Session(profile_name=args.profile) if args.profile else boto3.Session()
    s3_client = session.client('s3', region_name=args.region)

    print(f"Configuring S3 Bucket: {args.bucket}")

    # 1. Update Public Access Block
    # We must allow Public Policies so we can attach a bucket policy for the public folders,
    # but we can still keep ACL block enabled (BlockPublicAcls/IgnorePublicAcls).
    try:
        print("Updating Public Access Block Configuration...")
        s3_client.put_public_access_block(
            Bucket=args.bucket,
            PublicAccessBlockConfiguration={
                'BlockPublicAcls': True,
                'IgnorePublicAcls': True,
                'BlockPublicPolicy': False,
                'RestrictPublicBuckets': False
            }
        )
        print("SUCCESS: Public Access Block updated successfully.")
    except ClientError as e:
        print(f"ERROR: Failed to update Public Access Block: {e}")
        return

    # 2. Put Bucket Policy
    # This policy permits public GetObject access *only* for banner/*, poster/*, and system/*.
    # Access to any other folder (like cvs/*) is denied by default unless granted otherwise.
    policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "PublicReadForCategorizedAssetsOnly",
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": [
                    f"arn:aws:s3:::{args.bucket}/banner/*",
                    f"arn:aws:s3:::{args.bucket}/poster/*",
                    f"arn:aws:s3:::{args.bucket}/system/*"
                ]
            }
        ]
    }

    try:
        print("Applying Bucket Policy for public image folders...")
        s3_client.put_bucket_policy(
            Bucket=args.bucket,
            Policy=json.dumps(policy)
        )
        print("SUCCESS: Bucket Policy applied successfully.")
        print(f"INFO: Images are now publicly accessible at https://{args.bucket}.s3.{args.region}.amazonaws.com/<category>/<filename>")
    except ClientError as e:
        print(f"ERROR: Failed to apply Bucket Policy: {e}")

if __name__ == '__main__':
    main()
