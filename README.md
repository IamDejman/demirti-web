# Demirti Technologies Training Website

A modern, responsive website for Demirti Technologies' digital training programs, featuring specialized tracks in Data Science and Technical Product Management.

![Demirti Technologies Logo](logo.png)

## 🚀 Features

- **Specialized Training Tracks**
  - Data Science Track
  - Technical Product Management Track

- **Modern UI/UX**
  - Responsive design for all devices
  - Clean and professional layout
  - Smooth animations and transitions
  - Intuitive navigation

- **Key Sections**
  - Home/Hero section
  - About Us
  - Course Tracks Overview
  - Detailed Track Information
  - Application Process
  - Contact Information

## 💻 Technologies Used

- Next.js 14
- React 18
- Resend (Email Service)
- HTML5
- CSS3
- Font Awesome Icons
- Google Fonts (Montserrat & Inter)
- Responsive Design
- CSS Grid & Flexbox

## 🛠️ Setup and Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/IamDejman/demirti-web.git
   ```

2. Navigate to the project directory:
   ```bash
   cd demirti-web
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up environment variables:
   Create a `.env.local` file in the root directory with the following:
   ```env
   RESEND_API_KEY=your_resend_api_key
   RESEND_FROM_EMAIL=no-reply@demirti.com
   CLAUDE_API_KEY=your_anthropic_key
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
   VAPID_PRIVATE_KEY=your_vapid_private_key
   NEXT_PUBLIC_BASE_URL=https://your-domain.com
   STORAGE_BUCKET=your_bucket
   STORAGE_REGION=your_region
   STORAGE_ACCESS_KEY=your_access_key
   STORAGE_SECRET_KEY=your_secret_key
   STORAGE_ENDPOINT=optional_custom_endpoint
   STORAGE_PUBLIC_URL=optional_public_cdn
   ```
   
   To get your Resend API key:
   - Sign up or log in at [Resend](https://resend.com/)
   - Go to API Keys
   - Create a new API key
   - Copy the API key and paste it in your `.env.local` file
   - Verify your domain for sending emails

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### PDF Certificates (Optional)
Certificates are generated using Python + ReportLab.
Install dependencies:
```bash
python3 -m pip install reportlab pdfplumber pypdf
```
For visual rendering checks:
```bash
brew install poppler
```

## 🚢 Deployment (Vercel)

After deploying, run database initialization yourself by calling **GET** your production URL + `/api/init-db` (e.g. `https://your-app.vercel.app/api/init-db`) once. This creates or updates all tables, including the `events` table for analytics.

## 📱 Responsive Design

The website is fully responsive and optimized for:
- Desktop devices
- Tablets
- Mobile phones

## 📞 Contact Information

- Email: admin@demirti.com
- Phone: 
  - +234 810 107 5670
  - +234 808 993 2753

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check [issues page](https://github.com/IamDejman/demirti-web/issues).

## 📄 License

This project is proprietary and maintained by Demirti Technologies Limited. © 2025 All rights reserved.

## 🌐 Live Website

The website is deployed on multiple platforms:

- Vercel (Primary): [demirti-web.vercel.app](https://demirti-web.vercel.app)
- GitHub Pages: [iamdejman.github.io/demirti-web](https://iamdejman.github.io/demirti-web) 
