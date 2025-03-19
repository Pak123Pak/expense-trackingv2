# Expense Tracker

A web application for tracking expenses during trips, with features for trip management, expense splitting, debt tracking, and expense visualization.

## Project Overview

This project allows users to:
- Create and manage trips
- Track expenses with detailed information
- Split expenses with trip mates
- Track debts and settlements
- Visualize spending patterns

The application is built with React and Firebase, and is deployed on GitHub Pages.

## Phase 1: Project Setup and Authentication

- Project structure setup
- Firebase configuration
- User authentication (login and registration)
- Basic routing

## Phase 2: Trip Management

- Trip List page with UI for viewing all trips
- Add New Trip functionality with modal form
- Delete Trip functionality with confirmation dialog
- Trip storage in Firestore database
- Settings menu setup

## Technologies Used

- React
- Firebase (Authentication, Firestore, Storage)
- Material UI
- React Router
- Chart.js

## Getting Started

### Prerequisites

- Node.js and npm
- Firebase account

### Installation

1. Clone the repository:
```
git clone https://github.com/Pak123Pak/expense-trackingv2.git
cd expense-trackingv2
```

2. Install dependencies:
```
npm install
```

3. Create a `.env` file in the root directory with your Firebase configuration:
```
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

4. Start the development server:
```
npm start
```

## Deployment to GitHub Pages

1. Make sure you have the homepage field in your package.json:
```json
"homepage": "https://Pak123Pak.github.io/expense-trackingv2"
```

2. Build and deploy the application:
```
npm run build
npm run deploy
```

## Project Structure

- `src/components`: Reusable UI components
- `src/contexts`: Context providers for state management
- `src/pages`: Main application pages
- `src/firebase.js`: Firebase configuration and service initialization

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
