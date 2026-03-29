# Signature-Pool 🖋️🔐

A highly secure, self-hosted document signing and distribution platform. Designed to emulate enterprise signing services (like DocuSign) but with strict privacy rules, custom self-hosted data routing, and immediate parallel signing dispatch.

---

## 🚀 Key Features

### 1. Dual Architecture Operations
- **Quick Share Generation (Public)**: Drop any file into the homepage to instantly generate an encrypted, shareable `/view/[id]` link. No login required. 
- **Enterprise Envelopes (Admin)**: Protected dashboard where authenticated senders can group multiple documents, assign multiple signers per envelope, and track signatures via live status updates.

### 2. Parallel Signing Workflows
Signers are not bottlenecked in a queue. Every assigned signer receives a totally unique, isolated URL. They can securely place signatures concurrently, while the sender dashboard aggregates the completions in real-time.

### 3. Ultimate Viewing Security
The Document Viewer employs strong front-end protections to enforce confidentiality:
- **No-Download/No-Print Enforced**: Native system intercepts attempting to save, print (`Cmd+P`), or screenshot the active window.
- **Shield Overlay Blocker**: Blocks native browser context menus and drag-and-drop extraction. 

### 4. Interactive Signature Canvas
When signers open their secure link, they can intuitively stamp documents:
- **Draw**: Authentic black-ink HTML Canvas recording hand-drawn signatures.
- **Type**: Generates beautiful cursive script signatures directly from typed keys.
- **Dynamic Placement**: Draggable, scalable, and fully precise signature dropping directly over the PDF/Image without permanently destroying the original file.

### 5. Automated Dispatch
Using NodeMailer behind the scenes, the system accepts SMTP configuration via `.env.local`. Generating an envelope instantly fires secure HTML email invitations directly to the signers!

---

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS & Framer Motion for premium animations & drag mechanics.
- **Icons**: Lucide React
- **Authentication**: JWT (`jose`) powered Edge middleware.
- **Data Layer**: High-speed schema JSON local databases (`_data/db.json` & `_metadata/`), meaning ZERO external DB dependencies required.
- **Mail**: Nodemailer

---

## 📦 Getting Started

### 1. Installation
Clone the repo and install dependencies:
```bash
git clone https://github.com/binayapuri/Signature-Pool.git
cd "Signature-Pool"
npm install
```

### 2. Environment Variables
Create a `.env.local` file at the root of the project to enable automated email dispatch:
```env
# Example using Gmail App Passwords
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
```

### 3. Start Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000` to test out Quick Links, or head over to `http://localhost:3000/login` (Default Auth: `admin@securevault.com` / `admin123`) to experience the Envelope Dashboard.

---

*Built cleanly with Privacy and Speed in mind.*
