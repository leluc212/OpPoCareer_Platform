import boto3
import datetime

def main():
    logs_client = boto3.client('logs', region_name='ap-southeast-1')
    log_group = '/aws/lambda/quick-job-handler'
    
    # Get log streams from the last day
    yesterday = datetime.datetime.utcnow() - datetime.timedelta(days=1)
    start_time = int(yesterday.timestamp() * 1000)
    
    response = logs_client.describe_log_streams(
        logGroupName=log_group,
        orderBy='LastEventTime',
        descending=True,
        limit=20
    )
    
    streams = response.get('logStreams', [])
    print(f"Scanning {len(streams)} log streams...")
    
    with open('search_detailed_output.txt', 'w', encoding='utf-8') as outfile:
        found = False
        for stream in streams:
            stream_name = stream['logStreamName']
            events_resp = logs_client.get_log_events(
                logGroupName=log_group,
                logStreamName=stream_name,
                limit=1000
            )
            events = events_resp.get('events', [])
            for event in events:
                msg = event.get('message', '')
                if '7GFWO' in msg or 'NRTF0' in msg or 'FVZY1' in msg or '8GBXR' in msg:
                    timestamp = event.get('timestamp')
                    dt = datetime.datetime.fromtimestamp(timestamp/1000.0)
                    safe_msg = msg.strip()
                    outfile.write(f"[{dt}] [{stream_name}] {safe_msg}\n")
                    found = True
                    
        if not found:
            outfile.write("No matches found for any of the recent job IDs in the logs.\n")
    print("Results written to search_detailed_output.txt")


if __name__ == '__main__':
    main()
