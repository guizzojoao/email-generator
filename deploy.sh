#!/usr/bin/env bash
set -euo pipefail

BUCKET="bond-email-generator"
CF_DISTRIBUTION_ID="E3VCUINQJZE3LA"

echo "Syncing files to S3..."
aws s3 sync . "s3://$BUCKET" \
  --exclude "*" \
  --include "index.html" \
  --include "preview.html" \
  --include "assets/*" \
  --include "templates/*" \
  --delete

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id "$CF_DISTRIBUTION_ID" \
  --paths "/*"

echo "Done. Site live at: https://$(aws cloudfront get-distribution --id "$CF_DISTRIBUTION_ID" --query 'Distribution.DomainName' --output text)"
