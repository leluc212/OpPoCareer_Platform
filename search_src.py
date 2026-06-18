import os

search_dir = r"d:\AppOpPo\OppoApp"
query = "shifts"

for root, dirs, files in os.walk(search_dir):
    for file in files:
        if file.endswith('.dart'):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    for line_num, line in enumerate(f, 1):
                        if query in line.lower():
                            print(f"{filepath}:{line_num}: {line.strip()}")
            except Exception as e:
                pass
