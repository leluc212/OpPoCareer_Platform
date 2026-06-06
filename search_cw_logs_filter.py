import boto3

def main():
    logs_client = boto3.client('logs', region_name='ap-southeast-1')
    log_group = '/aws/lambda/quick-job-handler'
    
    print(f"Filtering logs for 'QJOB' in {log_group}...")
    response = logs_client.filter_log_events(
        logGroupName=log_group,
        filterPattern='QJOB',
        limit=50
    )
    
    events = response.get('events', [])
    print(f"Found {len(events)} events matching 'QJOB'.")
    for event in events:
        timestamp = event.get('timestamp')
        import datetime
        dt = datetime.datetime.fromtimestamp(timestamp/1000.0)
        msg = event.get('message', '').strip()
        print(f"[{dt}] {msg.encode('ascii', errors='replace').decode('ascii')}")
        
    print("\nFiltering logs for 'status' in the same log group...")
    response_rec = logs_client.filter_log_events(
        logGroupName=log_group,
        filterPattern='status',
        limit=50
    )
    events_rec = response_rec.get('events', [])
    print(f"Found {len(events_rec)} events matching 'status'.")
    for event in events_rec:
        timestamp = event.get('timestamp')
        import datetime
        dt = datetime.datetime.fromtimestamp(timestamp/1000.0)
        msg = event.get('message', '').strip()
        print(f"[{dt}] {msg.encode('ascii', errors='replace').decode('ascii')}")

if __name__ == '__main__':
    main()

