import zipfile
import shutil
import os

def update_zip(zip_path, file_to_add, archive_name):
    if not os.path.exists(zip_path):
        print(f"Zip file {zip_path} not found, skipping.")
        return
        
    temp_zip_path = zip_path + ".tmp"
    
    # Read all files except the one we are replacing
    temp_data = {}
    with zipfile.ZipFile(zip_path, 'r') as z_in:
        for info in z_in.infolist():
            if info.filename != archive_name:
                temp_data[info.filename] = z_in.read(info.filename)
                
    # Write back all files + the new one
    with zipfile.ZipFile(temp_zip_path, 'w', zipfile.ZIP_DEFLATED) as z_out:
        for filename, data in temp_data.items():
            # Preserving compression and file attributes
            z_out.writestr(filename, data)
        z_out.write(file_to_add, archive_name)
        
    # Replace original zip
    shutil.move(temp_zip_path, zip_path)
    print(f"Successfully updated {archive_name} in {zip_path}")

if __name__ == '__main__':
    update_zip('ekyc-handler.zip', 'ekyc_handler.py', 'ekyc_handler.py')
    update_zip('ekyc-final.zip', 'ekyc_handler.py', 'ekyc_handler.py')
