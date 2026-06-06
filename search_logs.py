def search_file(filename):
    print(f"\nSearching file: {filename}")
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    keywords = ["Ownership check failed", "Forbidden", "403", "Exception", "Error", "reject", "approve"]
    
    for idx, line in enumerate(lines):
        for kw in keywords:
            if kw.lower() in line.lower():
                print(f"Line {idx+1}: {line.strip()}")
                break

print("=== SEARCHING QUICK JOB LOGS ===")
search_file("all_quick_job_logs.txt")

print("\n=== SEARCHING JOB POST LOGS ===")
search_file("all_job_post_logs.txt")
