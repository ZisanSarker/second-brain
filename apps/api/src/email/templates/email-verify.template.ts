export function emailVerifyTemplate(verifyUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; padding: 32px; max-width: 600px; margin: 0 auto;">
  <h2>Verify Your Email</h2>
  <p>Thanks for signing up! Click the link below to verify your email address:</p>
  <p><a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: #fff; text-decoration: none; border-radius: 6px;">Verify Email</a></p>
  <p>This link expires in 24 hours. If you did not create an account, you can safely ignore this email.</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
  <p style="color: #6b7280; font-size: 12px;">Second Brain — Your AI-powered knowledge management system</p>
</body>
</html>`;
}
