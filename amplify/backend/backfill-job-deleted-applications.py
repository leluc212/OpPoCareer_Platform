"""
Backfill script: Mark all applications as 'job_deleted' where their parent job
has status='deleted' but the application still has an active status.

Run this once to fix historical data where lambda didn't have the mark logic.

Usage: python backfill-job-deleted-applications.py
"""
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb', region_name='ap-southeast-1')
jobs_table = dynamodb.Table('PostStandardJob')
apps_table = dynamodb.Table('StandardApplications')

def get_deleted_job_ids():
    """Get all job IDs with status='deleted'"""
    deleted_ids = []
    response = jobs_table.scan(
        FilterExpression='#s = :s',
        ExpressionAttributeNames={'#s': 'status'},
        ExpressionAttributeValues={':s': 'deleted'}
    )
    deleted_ids.extend([item['idJob'] for item in response.get('Items', [])])
    
    # Handle pagination
    while 'LastEvaluatedKey' in response:
        response = jobs_table.scan(
            FilterExpression='#s = :s',
            ExpressionAttributeNames={'#s': 'status'},
            ExpressionAttributeValues={':s': 'deleted'},
            ExclusiveStartKey=response['LastEvaluatedKey']
        )
        deleted_ids.extend([item['idJob'] for item in response.get('Items', [])])
    
    return deleted_ids

def mark_applications_as_deleted(deleted_job_ids):
    """For each deleted job, mark its applications as job_deleted"""
    total_updated = 0
    
    for job_id in deleted_job_ids:
        try:
            response = apps_table.query(
                IndexName='JobIndex',
                KeyConditionExpression='jobId = :jid',
                ExpressionAttributeValues={':jid': job_id}
            )
            
            apps = response.get('Items', [])
            updated = 0
            
            for app in apps:
                if app.get('status') not in ('job_deleted',):
                    apps_table.update_item(
                        Key={'applicationId': app['applicationId']},
                        UpdateExpression='SET #s = :s, updatedAt = :u',
                        ExpressionAttributeNames={'#s': 'status'},
                        ExpressionAttributeValues={
                            ':s': 'job_deleted',
                            ':u': datetime.utcnow().isoformat() + 'Z'
                        }
                    )
                    updated += 1
            
            if updated > 0:
                print(f"  ✅ Job {job_id}: marked {updated} application(s) as job_deleted")
                total_updated += updated
            
        except Exception as e:
            print(f"  ❌ Error processing job {job_id}: {e}")
    
    return total_updated

if __name__ == '__main__':
    print("🔍 Finding all deleted jobs...")
    deleted_ids = get_deleted_job_ids()
    print(f"   Found {len(deleted_ids)} deleted job(s)")
    
    if not deleted_ids:
        print("✅ No deleted jobs found. Nothing to do.")
    else:
        print(f"\n🔄 Marking applications for {len(deleted_ids)} deleted jobs...")
        total = mark_applications_as_deleted(deleted_ids)
        print(f"\n✅ Done! Updated {total} application(s) to status 'job_deleted'")
