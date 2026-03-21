# KodaAccount 🚀

**KodaAccount** is a modern, premium, and lightweight accounting application designed specifically for small businesses. It offers a comprehensive suite of financial tools while keeping all your sensitive data securely in your browser.

![KodaAccount Dashboard](file:///Users/hansbakker/.gemini/antigravity/brain/0ae15ba4-7bab-4e09-a39b-839938f750e4/koda_account_walkthrough_1774041271279.webp)

---

## ✨ Key Features

- **General Ledger**: Automated double-entry bookkeeping with real-time balancing.
- **Accounts Receivable (AR)**: Professional invoice creation and customer tracking.
- **Accounts Payable (AP)**: Vendor management and bill recording.
- **Banking Ledger**: Manual statement entry and intelligent transaction matching/reconciliation.
- **VAT Management**: Support for multiple tariffs (21%, 9%, etc.) with automated VAT reporting.
- **Financial Reports**: 
  - 📊 Balance Sheet
  - 📈 Profit & Loss
  - 🧾 VAT Return Summary
- **Privacy First**: All data is stored locally in your browser via **IndexedDB**.
- **Data Portability**: Full JSON backup export and import.

---

## 🛠️ Tech Stack

- **Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Database**: [Dexie.js](https://dexie.org/) (IndexedDB Wrapper)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Chart.js](https://www.chartjs.org/)
- **PDF Export**: [jsPDF](https://github.com/parallax/jsPDF)

---

## 🚀 Quick Start (Mac Only)

If you are on a Mac, you can use the included deployment script to set up everything automatically:

```bash
git clone https://github.com/hansbakker/KodaAccount.git
cd KodaAccount
chmod +x deploy.sh
./deploy.sh
```

---

## 🏗️ Manual Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/hansbakker/KodaAccount.git
    cd KodaAccount
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run the development server**:
    ```bash
    npm run dev
    ```

4.  **Build for production**:
    ```bash
    npm run build
    ```

---

## 🛡️ Privacy & Security

KodaAccount is a **serverless** application. No financial data ever leaves your computer. Your database is stored locally in your browser's IndexedDB. We recommend using the **Export Data (JSON)** feature in the Settings page regularly to keep local backups of your records.

---

## 📄 License

This project is open-source and available under the MIT License.
