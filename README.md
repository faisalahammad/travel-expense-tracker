# Travel Expense Tracker

A React application for tracking and splitting expenses among travelers during multi-tour trips.

## Features

- **Multiple Tour Support**: Create and manage multiple tours (e.g., Philippines Tour, Malaysia Tour)
- **Traveler Management**: Add custom travelers for each tour
- **Flexible Currency Support**: Add currencies and their exchange rates
- **Expense Tracking**: Track expenses with date, amount, currency, and description
- **Split Expenses**: Split expenses among different travelers
- **Settlement Calculation**: Calculate who owes whom with minimum transactions
- **Data Persistence**: Store data in browser's localStorage
- **Export to Excel**: Export tour data to Excel for record-keeping
- **Shareable Links**: Generate shareable links containing tour data

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

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

3. Start the development server:

   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

1. **Create a Tour**: Start by creating a new tour with a name and base currency
2. **Add Travelers**: Add travelers who participated in the tour
3. **Add Currencies**: Add any additional currencies used during the tour
4. **Add Expenses**: Add expenses, specifying who paid and how to split the cost
5. **View Settlements**: See who owes whom and how much
6. **Export Data**: Export tour data to Excel or generate a shareable link

## Technologies Used

- React
- TypeScript
- Tailwind CSS
- React Router
- SheetJS (for Excel export)
- localStorage (for data persistence)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by the need to simplify expense tracking during group travels
- Thanks to all contributors who have helped improve this project
