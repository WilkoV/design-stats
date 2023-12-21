#!/bin/bash

# Ensure the source directory and zip file names are provided as arguments
if [ "$#" -ne 1 ]; then
   echo "Usage: $0 <directory_name>"
   exit 1
fi

SOURCE_DIR="/home/wilko/code/design-stats/data/backup"
ZIP_FILE="${1}.gz"

# Set the destination path in Windows
DESTINATION_DIR="/mnt/c/Users/Wilko/Google Drive/Backup"

# Check if the source directory exists
if [ -d "$SOURCE_DIR" ]; then
   # Create a tarball of the directory in WSL
   cd ${SOURCE_DIR}
   tar -czvf "${1}.gz" "${1}"

   # Check if the zip was created successfully
   if [ -f "$ZIP_FILE" ]; then
      # Copy the zip file from WSL to Google Drive
      cp "$ZIP_FILE" "$DESTINATION_DIR"
      echo "Directory zipped and copied to Google Drive."

      # Delete the zip file in WSL
      rm "$ZIP_FILE"
      echo "Zip file deleted from WSL."

   else
      echo "Failed to create the zip file."
   fi

   cd -
else
   echo "Source directory not found. Please check the directory path."
fi
