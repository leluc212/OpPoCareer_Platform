import boto3
import sys

def main():
    region = 'ap-southeast-1'
    log_group = '/aws/lambda/JobPostAPI'
    logs_client = boto3.client('logs', region_name=region)
    
    # Get latest log streams
    response = logs_client.describe_log_streams(
        logGroupName=log_group,
        orderBy='LastEventTime',
        descending=True,
        limit=10
    )
    
    streams = response.get('logStreams', [])
    if not streams:
        print("No log streams found")
        return
        
    with open('all_job_post_logs.txt', 'w', encoding='utf-8') as f:
        for stream in streams:
            stream_name = stream['logStreamName']
            f.write(f"\n================ Reading stream: {stream_name} ================\n")
            
            events_resp = logs_client.get_log_events(
                logGroupName=log_group,
                logStreamName=stream_name,
                limit=100
            )
            
            events = events_resp.get('events', [])
            f.write(f"Total events in stream: {len(events)}\n")
            for event in events:
                msg = event.get('message', '')
                f.write(msg.strip() + "\n")
    print("Logs written to all_job_post_logs.txt")

if __name__ == '__main__':
    main()
