# Step 1: Remove node_modules from Git tracking
git rm -r --cached node_modules

# Step 2: Make sure your .gitignore is committed
git add .gitignore
git commit -m "Update .gitignore to exclude node_modules"

# Step 3: Delete the physical node_modules directory 
rm -rf node_modules

# Step 4: Commit the changes that remove node_modules from tracking
git commit -m "Remove node_modules from Git tracking"

# Step 5: If you still have large files in history, you might need this extra step
# This is only needed if you already committed large files previously
git filter-branch --force --index-filter 'git rm -r --cached --ignore-unmatch node_modules/' --prune-empty --tag-name-filter cat -- --all

# Step 6: Force push to update remote repository
git push origin main --force
