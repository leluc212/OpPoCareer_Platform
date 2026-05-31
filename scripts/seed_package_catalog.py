#!/usr/bin/env python3
"""
Seed the PackageCatalog DynamoDB table with default packages.

Usage:
  python scripts/seed_package_catalog.py --table PackageCatalog --region ap-southeast-1

The script is interactive and will ask for confirmation before overwriting items.
"""
import argparse
import json
import sys
from decimal import Decimal

import boto3
from botocore.exceptions import ClientError


def load_seed(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def to_dynamo_item(obj):
    # Convert numbers to Decimal for DynamoDB
    if isinstance(obj, bool):
        return obj
    if isinstance(obj, dict):
        return {k: to_dynamo_item(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [to_dynamo_item(v) for v in obj]
    if isinstance(obj, (int, float)):
        return Decimal(str(obj))
    return obj


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--table', required=True, help='DynamoDB table name (PackageCatalog)')
    parser.add_argument('--seed', default='scripts/package_catalog_seed.json', help='Path to seed JSON')
    parser.add_argument('--region', default='ap-southeast-1')
    parser.add_argument('--profile', default=None, help='AWS CLI profile (optional)')
    parser.add_argument('--yes', action='store_true', help='Skip confirmation prompt')
    args = parser.parse_args()

    session = boto3.Session(profile_name=args.profile) if args.profile else boto3.Session()
    dynamodb = session.resource('dynamodb', region_name=args.region)
    table = dynamodb.Table(args.table)

    try:
        # quick table check
        table.load()
    except ClientError as e:
        print(f"ERROR: Cannot access table {args.table}: {e}")
        sys.exit(1)

    seed = load_seed(args.seed)

    print(f"Found {len(seed)} package items in seed file: {args.seed}")
    print("This will PUT each item into the DynamoDB table and overwrite attributes for the same packageId.")
    if not args.yes:
        ok = input('Proceed? (yes/no): ').strip().lower()
        if ok not in ('y', 'yes'):
            print('Aborted')
            return

    for item in seed:
        pkg_id = item.get('packageId')
        if not pkg_id:
            print('Skipping item without packageId')
            continue

        item_to_put = to_dynamo_item(item)
        try:
            table.put_item(Item=item_to_put)
            print(f'Upserted package: {pkg_id}')
        except ClientError as e:
            print(f'Failed to put {pkg_id}: {e}')

    print('Seeding complete.')


if __name__ == '__main__':
    main()
