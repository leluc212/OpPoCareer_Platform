import boto3

def main():
    logs_client = boto3.client('logs', region_name='ap-southeast-1')
    log_group = '/aws/lambda/quick-job-handler'
    stream_name = '2026/06/06/[$LATEST]349304faef0a44b9ba3dc4444f48eccc'
    
    print(f"Fetching all events for stream: {stream_name}...")
    
    response = logs_client.get_log_events(
        logGroupName=log_group,
        logStreamName=stream_name,
        limit=10000
    )
    
    events = response.get('events', [])
    print(f"Retrieved {len(events)} events.")
    
    with open('target_stream_logs.txt', 'w', encoding='utf-8') as f:
        for event in events:
            msg = event.get('message', '')
            f.write(msg.strip() + "\n")
            
    print("Logs written to target_stream_logs.txt")

if __name__ == '__main__':
    main()
