import boto3
import time

def main():
    region = 'ap-southeast-1'
    log_group = '/aws/lambda/candidate-profile-handler'
    logs_client = boto3.client('logs', region_name=region)
    
    # Query events in the last 15 minutes
    start_time = int((time.time() - 900) * 1000)
    
    try:
        response = logs_client.filter_log_events(
            logGroupName=log_group,
            startTime=start_time,
            limit=100
        )
        events = response.get('events', [])
        print(f"Total events found in last 15 minutes: {len(events)}")
        for event in events:
            # print timestamp and message
            t = time.ctime(event['timestamp']/1000)
            print(f"[{t}] {event['message'].strip()}")
    except Exception as e:
        print("Error fetching events:", e)

if __name__ == '__main__':
    main()
