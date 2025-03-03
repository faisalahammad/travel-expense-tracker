# Travel Expense Tracker

A React application for tracking and splitting expenses among travelers during multi-tour trips. Simplify group travel finances with easy expense tracking, automatic splitting, and settlement calculations.

## Features

- **Multiple Tour Support**: Create and manage multiple tours (e.g., Philippines Tour, Malaysia Tour)
- **Traveler Management**: Add custom travelers for each tour
- **Flexible Currency Support**: Add currencies and their exchange rates
- **Expense Tracking**: Track expenses with date, amount, currency, and description
- **Split Expenses**: Split expenses among different travelers with amount-based splitting
- **Payment Tracking**: Record payments between travelers
- **Settlement Calculation**: Calculate who owes whom with minimum transactions
- **Cloud Data Storage**: Store data in Supabase for global access, sharing, and synchronization
- **Export to Excel**: Export tour data to Excel for record-keeping
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account (free tier works fine)

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/travel-expense-tracker.git
   cd travel-expense-tracker
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Set up Supabase:

   - Create a new Supabase project at https://supabase.com
   - Go to the SQL Editor in your Supabase dashboard
   - Copy the contents of the `setup-supabase.sql` file from this repository
   - Paste the SQL into the SQL Editor and run it to create all the necessary tables
   - Update the Supabase URL and API key in `src/utils/supabase.ts` with your project's credentials

4. Start the development server:

   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal)

### Building for Production

To build the application for production:

```
npm run build
```

The built files will be in the `dist` directory and can be served by any static file server.

## Detailed Usage Guide

### 1. Creating a Tour

1. On the home page, click "Create New Tour"
2. Enter a name for your tour (e.g., "Thailand Trip 2023")
3. Select a base currency (this will be used for settlements)
4. Click "Create Tour"

### 2. Managing Travelers

1. Navigate to the "Travelers" page
2. Click "Add Traveler"
3. Enter the traveler's name
4. Click "Add"
5. Repeat for all travelers in your group

### 3. Setting Up Currencies

1. Navigate to the "Currencies" page
2. Click "Add Currency"
3. Enter the currency code (e.g., "USD"), name, and exchange rate relative to your base currency
4. Click "Add"
5. Add all currencies you'll use during your trip

### 4. Adding Expenses

1. Navigate to the "Expenses" page
2. Fill in the expense details:
   - Date
   - Amount
   - Currency
   - Description
   - Who paid
3. Split the expense:
   - Use "Split Equally" to divide evenly
   - Or manually enter amounts for each traveler
4. Click "Add Expense"
5. View your expenses in the list below

### 5. Recording Payments

1. Navigate to the "Settlements" page
2. Click "Add Payment" or use the "Record Payment" button in the settlement plan
3. Select who made the payment and who received it
4. Enter the amount, currency, date, and payment method
5. Click "Save Payment"

### 6. Viewing Settlements

1. Navigate to the "Settlements" page
2. View the current balances for each traveler
3. See the settlement plan showing who should pay whom to settle all debts
4. Hover over a traveler's balance to see detailed breakdown

### 7. Exporting Data

1. On the "Settlements" page, click "Export to Excel"
2. The application will generate an Excel file with all tour data
3. The file includes separate sheets for travelers, currencies, expenses, splits, payments, and settlements

## Data Storage

The application uses Supabase for data storage, providing:

- Cloud-based persistence between sessions
- Real-time synchronization across devices
- Secure data storage with Row Level Security
- Easy backup and restore capabilities
- Global access from any device with internet connection

### Troubleshooting Data Persistence

If your data is not persisting between sessions or devices:

1. Make sure you've set up the Supabase tables correctly using the provided SQL script
2. Check that your Supabase URL and API key are correctly configured in `src/utils/supabase.ts`
3. Look for any errors in the browser console related to Supabase operations
4. Verify that Row Level Security (RLS) policies are properly configured to allow anonymous access

## Technologies Used

- React 18
- TypeScript
- Material UI
- React Router
- Supabase (for cloud data storage)
- SheetJS (for Excel export)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by the need to simplify expense tracking during group travels
- Thanks to all contributors who have helped improve this project
- Special thanks to Faisal for the project idea and development
