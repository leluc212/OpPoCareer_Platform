import boto3
import sys

def main():
    region = 'ap-southeast-1'
    log_group = '/aws/lambda/ekyc-handler'
    logs_client = boto3.client('logs', region_name=region)
    
    # Get latest log stream
    response = logs_client.describe_log_streams(
        logGroupName=log_group,
        orderBy='LastEventTime',
        descending=True,
        limit=1
    )
    
    if not response.get('logStreams'):
        print("No log streams found")
        return
        
    stream_name = response['logStreams'][0]['logStreamName']
    print(f"Reading stream: {stream_name}")
    print("-" * 50)
    
    # Get events
    events_resp = logs_client.get_log_events(
        logGroupName=log_group,
        logStreamName=stream_name,
        limit=100
    )
    
    for event in events_resp.get('events', []):
        msg = event.get('message', '')
        # Replace non-ascii characters to avoid encoding crash
        safe_msg = msg.encode('ascii', errors='replace').decode('ascii')
        print(safe_msg.strip())

if __name__ == '__main__':
    main()
