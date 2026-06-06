with open('target_stream_logs.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if '7GFWO' in line:
        print(f"\n================ Match found at line {idx+1} ================")
        start = max(0, idx - 10)
        end = min(len(lines), idx + 25)
        for i in range(start, end):
            prefix = ">>> " if i == idx else "    "
            safe_line = lines[i].encode('ascii', errors='replace').decode('ascii').strip()
            print(f"{i+1:4d}{prefix}{safe_line}")
