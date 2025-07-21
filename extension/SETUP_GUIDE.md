# AutoJobr Chrome Extension Setup Guide

## Quick Fix for Connection Issues

The Chrome extension needs to connect to your AutoJobr web app. Here's how to fix the connection:

### Step 1: Install the Extension
1. Download the entire `extension` folder from your project
2. Open Chrome and go to `chrome://extensions/`
3. Turn on "Developer mode" (top right toggle)
4. Click "Load unpacked" and select the extension folder
5. Pin the AutoJobr extension to your toolbar

### Step 2: Fix the API URL
The extension is currently set to connect to a specific URL that changes with each deployment. You need to update it:

1. **Find your current AutoJobr web app URL** - it should look like:
   `https://[your-repl-name].replit.app` or similar

2. **Update the extension's API URL**:
   - Open the extension folder you downloaded
   - Edit `background.js` file
   - Find line 10 and replace the URL with your actual web app URL:
   ```javascript
   const apiUrl = 'https://0117fbd0-73a8-4b8b-932f-6621c1591b33-00-1jotg3lwkj0py.picard.replit.dev';
   ```

3. **Reload the extension**:
   - Go back to `chrome://extensions/`
   - Click the refresh icon on the AutoJobr extension

### Step 3: Test the Connection
1. Make sure you're logged into AutoJobr in a browser tab
2. Open the extension connection test: navigate to your extension folder and open `connection-test.html` in Chrome
3. Click each test button in order to verify the connection

### Step 4: Use the Extension
1. Go to any job board (LinkedIn, Indeed, Workday, etc.)
2. Click the AutoJobr extension icon in your toolbar
3. You should see your profile information
4. Toggle auto-fill and navigate to job applications

## Common Issues and Solutions

### "Not logged in" Error
- **Solution**: Open your AutoJobr web app in another tab and log in first
- The extension shares cookies with the web app for authentication

### "Connection Failed" Error
- **Solution**: Check that the API URL in `background.js` matches your actual web app URL
- Make sure your web app is running and accessible

### Extension Icon Not Showing
- **Solution**: Check that you've pinned the extension to your toolbar
- Look for the AutoJobr icon (blue square with "AJ")

### Auto-fill Not Working
- **Solution**: Make sure the auto-fill toggle is enabled in the extension popup
- Try refreshing the job application page

## Supported Job Boards
The extension works on these platforms:
- LinkedIn (including EasyApply)
- Indeed
- Workday
- Greenhouse
- Lever
- iCIMS
- Glassdoor
- Monster
- ZipRecruiter
- And 5+ more

## Features Available
- ✅ Auto-fill application forms
- ✅ Real-time job match analysis
- ✅ Missing skills identification
- ✅ Application tracking
- ✅ Profile sync with web app

## Need Help?
If you're still having issues:
1. Check the browser console (F12) for error messages
2. Try the connection test page
3. Make sure both the web app and extension are using the same domain
4. Verify you're logged into the web app first

The extension is designed to work seamlessly with your AutoJobr account once the connection is properly configured.