# Travel Expense Tracker

A React application for tracking and splitting expenses among travelers during trips. Simplify group travel finances with easy expense tracking, automatic currency conversion, and settlement calculations.

## Table of Contents

- [Travel Expense Tracker](#travel-expense-tracker)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Environment Setup](#environment-setup)
    - [PWA Configuration](#pwa-configuration)
  - [Database Setup](#database-setup)
    - [Database Structure](#database-structure)
  - [Running the Application](#running-the-application)
  - [Deployment](#deployment)
    - [Building for Production](#building-for-production)
    - [Deploying to Netlify](#deploying-to-netlify)
    - [Deploying to Vercel](#deploying-to-vercel)
  - [Usage Guide](#usage-guide)
    - [Creating Tours](#creating-tours)
    - [Managing Travelers](#managing-travelers)
    - [Setting Up Currencies](#setting-up-currencies)
    - [Adding Expenses](#adding-expenses)
    - [Planning Your Trip](#planning-your-trip)
    - [Understanding Settlements](#understanding-settlements)
    - [Exporting Data](#exporting-data)
    - [Installing as a Mobile App](#installing-as-a-mobile-app)
      - [For iOS (Safari):](#for-ios-safari)
      - [For Android (Chrome):](#for-android-chrome)
      - [Benefits of Installing as a PWA:](#benefits-of-installing-as-a-pwa)
  - [How Currency Conversion Works](#how-currency-conversion-works)
    - [Adding Currencies Manually](#adding-currencies-manually)
  - [Best Practices](#best-practices)
    - [Do:](#do)
    - [Don't:](#dont)
  - [Troubleshooting](#troubleshooting)
    - [Data Not Saving](#data-not-saving)
    - [Currency Conversion Issues](#currency-conversion-issues)
    - [Settlement Calculation Problems](#settlement-calculation-problems)
    - [PWA and Offline Usage Issues](#pwa-and-offline-usage-issues)
  - [License](#license)

## Features

- **Multiple Tour Support**: Create and manage multiple tours (e.g., Philippines Tour, Malaysia Tour)
- **Traveler Management**: Add custom travelers for each tour
- **Multi-Currency Support**: Add currencies with custom exchange rates
- **Automatic Currency Conversion**: Expenses in different currencies are automatically converted to the base currency
- **Expense Tracking**: Track expenses with date, amount, currency, and description
- **Expense Categorization**: Categorize expenses for better analysis
- **Split Expenses**: Split expenses equally or with custom amounts
- **Payment Tracking**: Record payments between travelers
- **Settlement Calculation**: Calculate who owes whom with minimum transactions
- **Trip Planning**: Create and manage tasks for your trip with priorities, assignments, and costs
- **Visual Analytics**: View expense distribution by category
- **Cloud Data Storage**: Store data in Supabase for global access
- **Export to Excel**: Export tour data to Excel for record-keeping
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Progressive Web App (PWA)**: Install on mobile devices for offline access and native app-like experience

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account (free tier works fine)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/travel-expense-tracker.git
   cd travel-expense-tracker
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

### Environment Setup

1. Create a `.env` file in the root directory based on the `.env.example` file:

   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. Replace `your_supabase_url` and `your_supabase_anon_key` with your actual Supabase project URL and anonymous key, which you can find in your Supabase project settings under API.

### PWA Configuration

The application is configured as a Progressive Web App (PWA) using Vite PWA plugin. The configuration is in the `vite.config.ts` file:

1. Make sure the PWA plugin is installed:

   ```bash
   npm install vite-plugin-pwa -D
   ```

2. The PWA configuration includes:

   - App name and short name
   - Theme colors and icons
   - Service worker strategy
   - Offline fallback page

3. To customize the PWA settings, edit the `pwa` section in `vite.config.ts`:

   ```typescript
   VitePWA({
     registerType: "autoUpdate",
     includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
     manifest: {
       name: "Travel Expense Tracker",
       short_name: "ExpenseTracker",
       theme_color: "#1976d2",
       icons: [
         // ... icon configurations
       ],
     },
     workbox: {
       // Workbox options
     },
   });
   ```

4. Make sure to include appropriate icons in different sizes in the `public` directory for the PWA to use.

## Database Setup

1. Create a Supabase account at [https://supabase.com](https://supabase.com) if you don't have one
2. Create a new project
3. Go to the SQL Editor in your Supabase dashboard
4. Run the SQL commands from the `travel-expense-tracker-db-setup.sql` file to create all necessary tables, functions, and initial data

> **Note**: The `travel-expense-tracker-db-setup.sql` file contains all the necessary SQL commands to set up the complete database structure in one go. This is the recommended approach for new installations.

> **For existing installations**: If you've previously used `supabase-setup.sql` and `supabase-update.sql` files, you can continue using those, but the comprehensive file is recommended for new installations as it includes all the latest schema changes.

### Database Structure

The application uses the following tables:

1. **tours**: Stores tour information

   - `id`: UUID (primary key)
   - `name`: Text
   - `base_currency_code`: Text
   - `created_at`: Timestamp
   - `updated_at`: Timestamp

2. **travelers**: Stores traveler information

   - `id`: UUID (primary key)
   - `tour_id`: UUID (foreign key to tours)
   - `name`: Text

3. **currencies**: Stores currency information

   - `tour_id`: UUID (foreign key to tours)
   - `code`: Text
   - `name`: Text
   - `exchange_rate`: Numeric
   - Primary key: (tour_id, code)

4. **expense_categories**: Stores expense categories

   - `id`: Text (primary key)
   - `name`: Text
   - `color`: Text

5. **expenses**: Stores expense information

   - `id`: UUID (primary key)
   - `tour_id`: UUID (foreign key to tours)
   - `description`: Text
   - `amount`: Numeric
   - `currency_code`: Text
   - `base_amount`: Numeric
   - `base_currency_code`: Text
   - `date`: Timestamp
   - `paid_by_id`: UUID (foreign key to travelers)
   - `category_id`: Text (foreign key to expense_categories)
   - `created_at`: Timestamp

6. **expense_splits**: Stores how expenses are split among travelers

   - `expense_id`: UUID (foreign key to expenses)
   - `traveler_id`: UUID (foreign key to travelers)
   - `amount`: Numeric
   - `base_amount`: Numeric
   - Primary key: (expense_id, traveler_id)

7. **payments**: Stores payment information

   - `id`: UUID (primary key)
   - `tour_id`: UUID (foreign key to tours)
   - `from_traveler_id`: UUID (foreign key to travelers)
   - `to_traveler_id`: UUID (foreign key to travelers)
   - `amount`: Numeric
   - `currency_code`: Text
   - `date`: Timestamp
   - `description`: Text
   - `created_at`: Timestamp

8. **planning_tasks**: Stores trip planning tasks
   - `id`: UUID (primary key)
   - `tour_id`: UUID (foreign key to tours)
   - `title`: Text
   - `cost`: Numeric (optional)
   - `currency_code`: Text (optional)
   - `location`: Text (optional)
   - `date`: Timestamp
   - `priority`: Text (LOW, MEDIUM, HIGH)
   - `travelers`: Text[] (array of traveler IDs)
   - `assigned_to`: Text[] (array of traveler IDs)
   - `completed`: Boolean
   - `created_at`: Timestamp

## Running the Application

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal)

3. The application will automatically connect to your Supabase project using the credentials in your `.env` file

## Deployment

### Building for Production

To build the application for production:

```bash
npm run build
```

The built files will be in the `dist` directory and can be served by any static file server.

### Deploying to Netlify

1. Create an account on [Netlify](https://www.netlify.com/)
2. Install the Netlify CLI:

   ```bash
   npm install -g netlify-cli
   ```

3. Login to Netlify:

   ```bash
   netlify login
   ```

4. Build your project:

   ```bash
   npm run build
   ```

5. Deploy to Netlify:

   ```bash
   netlify deploy --prod
   ```

6. Set up environment variables in the Netlify dashboard:
   - Go to Site settings > Build & deploy > Environment
   - Add the following environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

### Deploying to Vercel

1. Create an account on [Vercel](https://vercel.com/)
2. Install the Vercel CLI:

   ```bash
   npm install -g vercel
   ```

3. Login to Vercel:

   ```bash
   vercel login
   ```

4. Deploy to Vercel:

   ```bash
   vercel --prod
   ```

5. Set up environment variables in the Vercel dashboard:
   - Go to Project settings > Environment Variables
   - Add the following environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

## Usage Guide

### Creating Tours

1. On the home page, enter a name for your tour (e.g., "Thailand Trip 2023")
2. Select a base currency (this will be used for settlements)
3. Click "Create Tour"
4. The base currency should be the currency most commonly used during your trip

### Managing Travelers

1. Select your tour from the dropdown in the top navigation bar
2. Navigate to the "Travelers" page
3. Click "Add Traveler"
4. Enter the traveler's name
5. Click "Add"
6. You can edit or delete travelers using the action buttons

### Setting Up Currencies

1. Navigate to the "Currencies" page
2. Click "Add Currency"
3. Enter the currency code (e.g., "USD"), name, and exchange rate relative to your base currency
4. For example, if your base currency is BDT and 1 USD = 124.64 BDT, enter 124.64 as the exchange rate
5. Click "Add"
6. Add all currencies you'll use during your trip

### Adding Expenses

1. Navigate to the "Expenses" page
2. Click "Add Expense"
3. Fill in the expense details:
   - Description
   - Select the currency (the equivalent amount in base currency will be shown automatically)
   - Enter the amount
   - Select the date
   - Select who paid
   - Choose a category
4. Split the expense:
   - Use "Equal" to divide evenly among all travelers
   - Or use "Custom" to enter specific amounts for each traveler
5. Click "Save"
6. The expense will appear in the list, grouped by date

### Planning Your Trip

The Planning page helps you organize tasks and activities for your trip:

1. Navigate to the "Planning" page
2. Click "Add Task" to create a new task
3. Fill in the task details:
   - Title (required)
   - Cost (optional)
   - Currency (defaults to base currency)
   - Location (optional)
   - Date (required)
   - Priority (High, Medium, Low)
   - Travelers involved
   - Assigned to (who's responsible)
4. Click "Save"
5. Tasks will appear in the list, grouped by date
6. You can:
   - Mark tasks as complete by clicking the circle icon
   - Edit tasks by clicking the edit icon
   - Delete tasks by clicking the delete icon
   - Expand tasks to see more details
7. Use the search and filter options at the top to find specific tasks

### Understanding Settlements

The Settlements page provides a comprehensive overview of the financial state of your tour:

1. **Tour Summary**: Shows basic information about your tour
2. **Expense Distribution by Category**: A pie chart showing how expenses are distributed across categories
3. **Expense Totals by Traveler**: Shows each traveler's total expenses and payments
4. **Settlement Plan**: Shows who should pay whom to settle all debts

The Settlement Plan works like this:

1. The system calculates each traveler's balance based on:
   - Expenses they paid for
   - Their share of all expenses
   - Payments they've made or received
2. Travelers with negative balances owe money
3. Travelers with positive balances are owed money
4. The system creates a simplified plan where:
   - The person with the highest positive balance (main creditor) receives payments from everyone who owes money
   - This minimizes the number of transactions needed to settle all debts
5. For each payment in the plan, you'll see:
   - Who needs to pay
   - Who should receive the payment
   - The exact amount
   - Current balance information for both travelers

To record a payment:

1. Click "Record Payment" next to a settlement
2. The payment form will be pre-filled with the suggested amount and travelers
3. You can adjust the details if needed
4. Click "Save" to record the payment
5. The settlement plan will automatically update based on the new payment

### Exporting Data

1. On the "Settlements" page, click "Export to Excel"
2. The application will generate an Excel file with all tour data
3. The file includes separate sheets for:
   - Tour information
   - Travelers
   - Currencies
   - Expenses
   - Expense splits
   - Payments
   - Settlements

### Installing as a Mobile App

The Travel Expense Tracker is a Progressive Web App (PWA), which means you can install it on your mobile device and use it like a native app:

#### For iOS (Safari):

1. Visit the app in Safari
2. Tap the Share button (the square with an arrow pointing upward)
3. Scroll down and tap "Add to Home Screen"
4. Give the app a name (or keep the default)
5. Tap "Add" in the top-right corner
6. The app icon will appear on your home screen

#### For Android (Chrome):

1. Visit the app in Chrome
2. Tap the three-dot menu in the top-right corner
3. Tap "Add to Home Screen" or "Install app"
4. Follow the prompts to install
5. The app icon will appear on your home screen

#### Benefits of Installing as a PWA:

- Access the app directly from your home screen
- Use the app in full-screen mode without browser navigation bars
- Faster loading times after the first visit
- Some offline functionality (basic app structure will load even without internet)
- Automatic updates when new versions are released

## How Currency Conversion Works

The application handles currency conversion automatically:

1. When you add an expense in a non-base currency, it's converted to the base currency using the formula:

   ```
   baseAmount = amount * exchangeRate
   ```

2. For example, if you add an expense of 93 Peso and the exchange rate is 2.17 BDT per Peso:

   ```
   baseAmount = 93 * 2.17 = 201.81 BDT
   ```

3. Both the original amount and the base amount are stored in the database

4. All calculations for settlements use the base amounts to ensure accuracy

5. The application displays both the original amount and the equivalent base amount for clarity

### Adding Currencies Manually

To add a new currency with a custom exchange rate:

1. Navigate to the "Currencies" page
2. Click "Add Currency"
3. Enter the following information:
   - **Currency Code**: The 3-letter ISO code (e.g., USD, EUR, JPY)
   - **Currency Name**: The full name (e.g., US Dollar, Euro, Japanese Yen)
   - **Exchange Rate**: The rate relative to your base currency

The exchange rate should represent how much of your base currency equals 1 unit of the currency you're adding.

For example:

- If your base currency is BDT and 1 USD = 124.64 BDT, enter 124.64 as the exchange rate for USD
- If your base currency is BDT and 1 EUR = 134.92 BDT, enter 134.92 as the exchange rate for EUR
- If your base currency is BDT and 1 PHP = 2.17 BDT, enter 2.17 as the exchange rate for PHP

You can find current exchange rates from sources like:

- [XE.com](https://www.xe.com/)
- [Oanda](https://www.oanda.com/currency-converter/)
- Your bank's website
- Financial news websites

Remember to update exchange rates periodically if they change significantly during your trip.

## Best Practices

### Do:

- Set up all currencies with accurate exchange rates before adding expenses
- Add expenses as soon as possible to keep track of all spending
- Use categories consistently to get meaningful analytics
- Export data regularly as a backup
- Record payments as they happen to keep settlements up to date
- Use the Planning page to organize your trip activities and assign responsibilities

### Don't:

- Change the base currency after adding expenses (this can cause calculation issues)
- Delete travelers who have expenses associated with them
- Modify exchange rates frequently (only update them if there's a significant change)
- Use the same tour for multiple trips (create a new tour for each trip)

## Troubleshooting

### Data Not Saving

1. Check your Supabase credentials in the `.env` file
2. Ensure you've run the SQL setup scripts correctly
3. Check the browser console for any errors
4. Verify your internet connection

### Currency Conversion Issues

1. Make sure all currencies have correct exchange rates
2. Remember that exchange rates are relative to the base currency
3. If you update an exchange rate, existing expenses won't be automatically recalculated

### Settlement Calculation Problems

1. Verify that all expenses have been correctly split
2. Check that all payments have been recorded
3. Ensure all currencies have correct exchange rates

### PWA and Offline Usage Issues

1. **App not installing**: Make sure you're using a supported browser (Chrome, Edge, Safari, etc.)
2. **Offline access not working**: The app requires an initial load with internet connection to cache resources
3. **Data not syncing**:
   - When you regain internet connection, refresh the app to sync pending changes
   - If changes aren't appearing, try closing and reopening the app
4. **App not updating**:
   - Clear the browser cache for the site
   - Uninstall and reinstall the PWA from your home screen
5. **Storage issues**:
   - PWAs have limited storage on some devices
   - If you encounter storage errors, try clearing the site data in your browser settings

## License

This project is licensed under the MIT License - see the LICENSE file for details.
