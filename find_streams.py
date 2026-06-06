import boto3
import time

def main():
    region = 'ap-southeast-1'
    log_group = '/aws/lambda/candidate-profile-handler'
    logs_client = boto3.client('logs', region_name=region)
    
    # Get log streams updated recently
    response = logs_client.describe_log_streams(
        logGroupName=log_group,
        orderBy='LastEventTime',
        descending=True,
        limit=10
    )
    
    streams = response.get('logStreams', [])
    for s in streams:
        print(f"Stream: {s['logStreamName']} | LastEvent: {time.ctime(s['lastEventTimestamp']/1000)}")

if __name__ == '__main__':
    main()
