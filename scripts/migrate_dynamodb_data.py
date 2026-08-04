#!/usr/bin/env python3
"""
OpPoReviewWeb DynamoDB Migration Tool
======================================
Tool to export all DynamoDB tables from the old AWS Account to JSON files,
and import them into a new AWS Account after Terraform deployment.

Usage:
  1. Export from OLD account:
     python scripts/migrate_dynamodb_data.py --action export --region ap-southeast-1 [--profile old-profile]

  2. Import into NEW account:
     python scripts/migrate_dynamodb_data.py --action import --region ap-southeast-1 [--profile new-profile]
"""

import os
import sys
import json
import argparse
import boto3
from decimal import Decimal
from datetime import datetime

# Reconfigure stdout/stderr to UTF-8 for Windows console support
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

TABLE_NAMES = [
    "Banners",
    "CandidateExperiences",
    "CandidateProfiles",
    "ChatConnections",
    "ChatConversations",
    "ChatMessages",
    "CompletedJobs",
    "EmployerProfiles",
    "Feedbacks",
    "Notifications",
    "OpPoWebTable",
    "OppoAuthOtp",
    "PackageCatalog",
    "PackageSubscriptions",
    "Payment",
    "PostQuickJob",
    "PostStandardJob",
    "StandardApplications",
    "Translations",
    "WithdrawalRequests",
]

BACKUP_DIR = os.path.join(os.path.dirname(__file__), "dynamodb_backups")

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            # Preserve floats/ints without loss
            return float(obj) if obj % 1 != 0 else int(obj)
        if isinstance(obj, set):
            return list(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super(DecimalEncoder, self).default(obj)

def export_tables(session, region, target_tables):
    os.makedirs(BACKUP_DIR, exist_ok=True)
    dynamodb = session.resource('dynamodb', region_name=region)
    client = session.client('dynamodb', region_name=region)

    # Fetch all existing DynamoDB table names in the account
    existing_tables = []
    try:
        paginator = client.get_paginator('list_tables')
        for page in paginator.paginate():
            existing_tables.extend(page.get('TableNames', []))
    except Exception as err:
        print(f"⚠️ Warning: Could not list tables in account: {err}")

    print(f"\n🚀 Starting EXPORT of {len(target_tables)} tables to directory: {BACKUP_DIR}\n")

    for target_name in target_tables:
        file_path = os.path.join(BACKUP_DIR, f"{target_name}.json")
        
        # Find exact match or fuzzy match (e.g. Users-xxx or Applications)
        actual_name = target_name
        if target_name not in existing_tables:
            matches = [t for t in existing_tables if t.startswith(target_name) or target_name.startswith(t)]
            if matches:
                actual_name = matches[0]
                print(f"ℹ️ Table '{target_name}' mapped to existing AWS table '{actual_name}'")
            else:
                print(f"📦 Scanning table '{target_name}'...")
                print(f"   ⚠️ Table '{target_name}' does not exist yet on old account. Saving empty array [].")
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump([], f, ensure_ascii=False, indent=2)
                continue

        table = dynamodb.Table(actual_name)
        try:
            print(f"📦 Scanning table '{actual_name}'...")
            items = []
            response = table.scan()
            items.extend(response.get('Items', []))

            while 'LastEvaluatedKey' in response:
                response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
                items.extend(response.get('Items', []))

            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(items, f, cls=DecimalEncoder, ensure_ascii=False, indent=2)

            print(f"   ✅ Saved {len(items)} items to {file_path}")
        except Exception as e:
            print(f"   ❌ Error exporting table '{actual_name}': {e}")

    print("\n🎉 Export completed!\n")

def import_tables(session, region, tables):
    if not os.path.exists(BACKUP_DIR):
        print(f"❌ Backup directory not found: {BACKUP_DIR}. Please run export first!")
        sys.exit(1)

    dynamodb = session.resource('dynamodb', region_name=region)
    print(f"\n🚀 Starting IMPORT of {len(tables)} tables into AWS Region '{region}'...\n")

    for table_name in tables:
        file_path = os.path.join(BACKUP_DIR, f"{table_name}.json")
        if not os.path.exists(file_path):
            print(f"⚠️ Skipping table '{table_name}': backup file missing at {file_path}")
            continue

        table = dynamodb.Table(table_name)
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                items = json.load(f, parse_float=Decimal)

            print(f"📥 Importing {len(items)} items into table '{table_name}'...")
            with table.batch_writer() as batch:
                for idx, item in enumerate(items, 1):
                    batch.put_item(Item=item)
                    if idx % 100 == 0:
                        print(f"   ...written {idx}/{len(items)} items")

            print(f"   ✅ Table '{table_name}' imported successfully ({len(items)} items).")
        except Exception as e:
            print(f"   ❌ Error importing into table '{table_name}': {e}")

    print("\n🎉 Import completed successfully!\n")

def main():
    parser = argparse.ArgumentParser(description="OpPoReviewWeb DynamoDB Migration Tool")
    parser.add_argument("--action", choices=["export", "import"], required=True, help="Action to perform: export or import")
    parser.add_argument("--region", default="ap-southeast-1", help="AWS Region (default: ap-southeast-1)")
    parser.add_argument("--profile", default=None, help="AWS CLI profile name (optional)")
    args = parser.parse_args()

    if args.profile:
        session = boto3.Session(profile_name=args.profile)
    else:
        session = boto3.Session()

    if args.action == "export":
        export_tables(session, args.region, TABLE_NAMES)
    elif args.action == "import":
        import_tables(session, args.region, TABLE_NAMES)

if __name__ == "__main__":
    main()
