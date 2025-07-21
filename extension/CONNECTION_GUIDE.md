# AutoJobr Chrome Extension - Backend Connection Guide

## Quick Setup

### 1. **Your Backend URL**
Your AutoJobr backend is running at:
```
https://0117fbd0-73a8-4b8b-932f-6621c1591b33-00-1jotg3lwkj0py.picard.replit.dev
```

### 2. **Load Extension in Chrome**
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked" 
4. Select your `extension` folder

### 3. **Test Connection**
1. Click the extension icon in Chrome toolbar
2. The extension will automatically detect and connect to your backend
3. If connection fails, click "Settings" and manually enter your URL

---

## How the Connection Works

### **Automatic Detection**
The extension automatically tries these URLs in order:
1. `https://0117fbd0-73a8-4b8b-932f-6621c1591b33-00-1jotg3lwkj0py.picard.replit.dev` (Your current Replit)
2. `https://autojobr.replit.app` (If deployed)
3. `http://localhost:5000` (Local development)

### **Health Check**
The extension tests each URL by calling `/api/health` endpoint which returns:
```json
{
  "status": "ok", 
  "timestamp": "2025-01-01T12:00:00.000Z",
  "service": "autojobr-api"
}
```

---

## Extension Features

### **Auto-Fill Forms**
- Works on LinkedIn, Indeed, Workday, Greenhouse, Lever, and 100+ job sites
- Automatically fills personal info, work experience, skills
- Uses your profile data from the web app

### **Job Analysis**
- Analyzes job descriptions in real-time
- Shows match score based on your profile
- Provides application recommendations

### **Application Tracking**
- Tracks all applications across different sites
- Syncs with your web dashboard
- Shows application status and progress

---

## Supported Job Sites

### **Major Platforms**
- LinkedIn Jobs
- Indeed
- Glassdoor
- ZipRecruiter
- Monster

### **ATS Systems**
- Workday
- Greenhouse
- Lever
- iCIMS
- BambooHR
- SmartRecruiters

### **Company Sites**
- Works on most company career pages
- Detects forms automatically
- Adapts to different field types

---

## API Endpoints Used

### **Authentication**
- `GET /api/auth/user` - Get current user
- `POST /api/user/switch-role` - Switch between job seeker/recruiter

### **Profile Data**  
- `GET /api/extension/profile` - Get user profile for form filling
- `GET /api/user/profile` - Full profile data

### **Job Analysis**
- `POST /api/extension/analyze-job` - Analyze job descriptions
- `POST /api/extension/track-application` - Track applications

### **Settings**
- `GET /api/extension/settings` - Get user preferences
- `POST /api/extension/settings` - Update settings

---

## Troubleshooting

### **Connection Issues**
If extension can't connect:
1. Check if your Replit is running (should show port 5000)
2. Verify CORS is enabled (already configured)
3. Try refreshing the extension popup

### **Manual URL Setup**
1. Right-click extension icon → Options
2. Enter your backend URL: `https://6d490f6a-220b-4865-9c1e-56491791d355-00-fobjhe3sa4h6.spock.replit.dev`
3. Click "Test Connection"
4. Save settings

### **Authentication**
- Extension uses same login as web app
- Login at the web app first
- Extension will inherit your session cookies

---

## Development Notes

### **CORS Configuration**
Your backend already supports extension connections:
```javascript
cors({
  origin: [
    'chrome-extension://*',
    'moz-extension://*', 
    // ... other origins
  ],
  credentials: true
})
```

### **Security**
- All API calls use HTTPS
- Session-based authentication 
- CORS prevents unauthorized access
- No API keys stored in extension

---

## Next Steps

1. **Load the extension** in Chrome developer mode
2. **Test form filling** on LinkedIn or Indeed
3. **Check job analysis** on job description pages
4. **View tracked applications** in your web dashboard

The extension will automatically sync all data with your web app, giving you a complete job search management system!