import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Helper function to authenticate our "Robot" Service Account
async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      // .replace is crucial here to fix how servers handle multi-line strings in .env files
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'), 
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

export async function GET() {
  try {
    const sheets = await getSheetsClient();
    
    // Fetch data from Sheet1, columns A through F
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:F', 
    });

    const rows = response.data.values;
    
    // If the sheet is completely empty (no data, no headers)
    if (!rows || rows.length === 0) {
      return NextResponse.json([]);
    }

    // Skip the first row (headers) and map the rest to our JSON format
    const data = rows.slice(1).map((row) => {
      return {
        Date: row[0] || '',
        Time: row[1] || '',
        Description: row[2] || '',
        Amount: parseFloat(row[3]) || 0,
        PaymentMethod: row[4] || '',
        PurchaseType: row[5] || '',
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Sheets GET Error:', error);
    return NextResponse.json({ error: 'Failed to read from Google Sheets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newExpense = await request.json();
    const sheets = await getSheetsClient();

    // Organize the JSON data into a flat array for the spreadsheet row
    const rowData = [
      newExpense.Date,
      newExpense.Time,
      newExpense.Description,
      newExpense.Amount,
      newExpense.PaymentMethod,
      newExpense.PurchaseType
    ];

    // Append the row to the bottom of the sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:F',
      valueInputOption: 'USER_ENTERED', // Formats numbers as actual numbers in the sheet
      requestBody: {
        values: [rowData],
      },
    });

    return NextResponse.json({ message: 'Expense saved to Google Sheets!' }, { status: 201 });
  } catch (error) {
    console.error('Sheets POST Error:', error);
    return NextResponse.json({ error: 'Failed to save to Google Sheets' }, { status: 500 });
  }
}