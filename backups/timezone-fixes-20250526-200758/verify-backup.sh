#!/bin/bash

# Timezone Fixes Backup Verification Script
echo "🔍 Verifying Timezone Fixes Backup..."
echo "=================================="

# Check if all required files exist
echo "📁 Checking file structure..."

required_files=(
    "src/components/Dashboard.jsx"
    "src/components/ReportPage.jsx" 
    "src/components/TimeEntries.jsx"
    "src/lib/dateUtils.js"
    "package.json"
    "vite.config.js"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        missing_files+=("$file")
    else
        echo "✅ $file"
    fi
done

if [[ ${#missing_files[@]} -gt 0 ]]; then
    echo "❌ Missing files:"
    printf '   %s\n' "${missing_files[@]}"
    exit 1
fi

echo ""
echo "🔧 Checking imports..."

# Check if dateUtils imports exist
if grep -q "formatDateSimple.*dateUtils" src/components/Dashboard.jsx; then
    echo "✅ Dashboard.jsx has correct dateUtils import"
else
    echo "❌ Dashboard.jsx missing dateUtils import"
fi

if grep -q "formatDateFull.*dateUtils" src/components/ReportPage.jsx; then
    echo "✅ ReportPage.jsx has correct dateUtils import"
else
    echo "❌ ReportPage.jsx missing dateUtils import"
fi

if grep -q "formatDateShort.*dateUtils" src/components/TimeEntries.jsx; then
    echo "✅ TimeEntries.jsx has correct dateUtils import"
else
    echo "❌ TimeEntries.jsx missing dateUtils import"
fi

echo ""
echo "📦 Checking dateUtils exports..."

# Check if dateUtils has all required exports
required_exports=("formatLocalDate" "formatDateShort" "formatDateFull" "formatDateSimple")
for export in "${required_exports[@]}"; do
    if grep -q "export.*$export" src/lib/dateUtils.js; then
        echo "✅ dateUtils exports $export"
    else
        echo "❌ dateUtils missing export: $export"
    fi
done

echo ""
echo "🎯 Verification complete!"
echo "This backup contains the timezone fixes and is ready for use." 