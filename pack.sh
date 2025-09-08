#!/bin/bash

# Create zip archive
zip -vr dist.zip ./dist -x "*.DS_Store"

echo "Extension packed successfully"
