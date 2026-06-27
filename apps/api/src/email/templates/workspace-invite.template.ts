export function workspaceInviteTemplate(
  inviteUrl: string,
  workspaceName: string,
  inviterName: string,
): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; padding: 32px; max-width: 600px; margin: 0 auto;">
  <h2>You've Been Invited</h2>
  <p><strong>${inviterName}</strong> has invited you to join the workspace <strong>${workspaceName}</strong> on Second Brain.</p>
  <p><a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: #fff; text-decoration: none; border-radius: 6px;">Accept Invitation</a></p>
  <p>This invitation expires in 7 days.</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
  <p style="color: #6b7280; font-size: 12px;">Second Brain — Your AI-powered knowledge management system</p>
</body>
</html>`;
}
