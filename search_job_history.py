with open("all_quick_job_logs.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()

matching_blocks = []
current_block = []

for line in lines:
    if line.startswith("================ Reading stream:"):
        if current_block:
            # Check if any line in block contains our job ID
            block_text = "".join(current_block)
            if "7GFWO" in block_text or "NRTF0" in block_text or "FVZY1" in block_text:
                matching_blocks.append(block_text)
            current_block = []
    current_block.append(line)

if current_block:
    block_text = "".join(current_block)
    if "7GFWO" in block_text or "NRTF0" in block_text or "FVZY1" in block_text:
        matching_blocks.append(block_text)

print(f"Found {len(matching_blocks)} log streams containing the job IDs.")
for idx, block in enumerate(matching_blocks):
    print(f"\n--- MATCHING STREAM {idx+1} ---")
    block_lines = block.split("\n")
    safe_top = "\n".join(block_lines[:15]).encode('ascii', errors='replace').decode('ascii')
    safe_bottom = "\n".join(block_lines[-15:]).encode('ascii', errors='replace').decode('ascii')
    print(safe_top)
    print("...")
    print(safe_bottom)

