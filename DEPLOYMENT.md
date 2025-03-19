# Deployment Instructions

This document provides step-by-step instructions for deploying the Expense Tracker application to GitHub Pages.

## Prerequisites

Before deploying, make sure you have:
1. A GitHub account
2. Git installed on your local machine
3. The project code ready on your local machine
4. Node.js and npm installed

## Deployment Process

### 1. Update the package.json file

Ensure the `package.json` file has the following:

- The correct homepage URL: `"homepage": "https://Pak123Pak.github.io/expense-trackingv2"`
- The deployment scripts:
  ```json
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build",
    // other scripts...
  }
  ```

### 2. Install GitHub Pages package (if not already installed)

```
npm install --save gh-pages
```

### 3. Build and Deploy the Application

Run the following command to build and deploy the application:

```
npm run deploy
```

This will:
1. Build your React application for production
2. Push the build files to the `gh-pages` branch of your GitHub repository

### 4. Verify Deployment

After deployment is complete:
1. Visit your GitHub repository at `https://github.com/Pak123Pak/expense-trackingv2`
2. Go to Settings > Pages
3. Verify that the site is being served from the `gh-pages` branch
4. Click the provided link to view your deployed site (it may take a few minutes to become available)

### 5. Update Firebase Configuration (if necessary)

Ensure that your Firebase project is properly configured:
1. Add `https://Pak123Pak.github.io` to the authorized domains in Firebase Authentication settings
2. Set up proper security rules in Firebase Firestore (see firebase-security-rules.txt)

## Troubleshooting

### 404 Errors on Page Refresh or Direct URL Access

If you experience 404 errors when refreshing the page or accessing a URL directly, it's because GitHub Pages doesn't support client-side routing out of the box. You have two options:

#### Option 1: Use HashRouter instead of BrowserRouter

This is the simplest solution. In your `App.js` file, change:
```jsx
import { BrowserRouter as Router } from 'react-router-dom';
```
to:
```jsx
import { HashRouter as Router } from 'react-router-dom';
```

Then rebuild and redeploy.

#### Option 2: Create a custom 404.html file

This approach is more complex but preserves clean URLs. You'll need to create a custom 404.html file that redirects to the main page with a query parameter containing the requested path.

### Deployment Not Working

If deployment fails:
1. Check your GitHub access permissions
2. Ensure you're logged in to the correct GitHub account
3. Verify that the gh-pages package is installed
4. Check your terminal output for specific error messages

## Regular Updates

To update your deployed application:
1. Make changes to your code
2. Commit the changes to your main branch
3. Run `npm run deploy` again to deploy the updated version

Remember that deployment may take a few minutes to complete and for changes to be visible on the live site. 