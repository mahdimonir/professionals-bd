export const emailBaseTemplate = (content: string, title: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background: #f9f9f9; }
    .container { max-width: 600px; margin: 0 auto; padding: 30px 20px; }
    .card { background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    h1, h2 { color: #2563eb; }
    .otp { font-size: 36px; letter-spacing: 10px; text-align: center; margin: 30px 0; color: #2563eb; font-weight: bold; }
    .footer { margin-top: 40px; font-size: 14px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      ${content}
      <div class="footer">
        <p>© 2026 Professionals BD. All rights reserved.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;