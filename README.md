# Expense Tracker Application

An expense tracking application that allows users to create trips, add expenses, split costs with trip mates, and visualize spending patterns.

## Live Demo

Visit the application at: [https://Pak123Pak.github.io/expense-trackingv2/](https://Pak123Pak.github.io/expense-trackingv2/)

## Features

- **User Authentication**: Register and login with email and password
- **Trip Management**: Create, view, and delete trips
- **Expense Tracking**: Add, edit, and delete expenses with various details
- **Currency Conversion**: Support for multiple currencies with automatic conversion
- **Trip Sharing**: Invite other users to collaborate on trips
- **Expense Splitting**: Split expenses among trip mates with various methods
- **Debt Tracking**: Calculate and settle debts between trip mates
- **Data Visualization**: View expenses by type or day-by-day breakdown
- **User Preferences**: Persistent settings like home currency and expense sorting method
- **Advanced Filtering**: Filter expenses by amount range, type, paid by, and date with multiple criteria
- **Responsive Design**: Works on mobile, tablet, and desktop devices
- **Notification Synchronization**: Automatically updates trip list after accepting trip invitations

## Technologies Used

- **Frontend**: React.js, Material UI
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Deployment**: GitHub Pages
- **Other Libraries**: 
  - react-router-dom for routing
  - chart.js for data visualization
  - date-fns for date handling
  - axios for HTTP requests

## Project Structure

```
expense-trackingv2/
├── public/              # Public assets
├── src/                 # Source code
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React contexts for state management
│   ├── pages/           # Main page components
│   ├── services/        # Service layers for API calls
│   ├── App.js           # Main App component
│   ├── firebase.js      # Firebase configuration
│   ├── index.js         # Entry point
│   └── theme.js         # Material UI theme customization
├── .env                 # Environment variables
├── package.json         # Project dependencies and scripts
└── README.md            # Project documentation
```

## License

This project is licensed under the MIT License.

## Acknowledgements

- [Firebase](https://firebase.google.com/) for backend services
- [Material UI](https://mui.com/) for UI components
- [React](https://reactjs.org/) for the frontend library