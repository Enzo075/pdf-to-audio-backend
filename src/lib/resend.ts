import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY não configurada no .env");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

  return resend.emails.send({
    from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
    to: "login", //email onde será enviado o link para redefinir a senha
    subject: "Redefinição de senha — PDF TO AUDIO",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #333;">
        <h2 style="color: #4f46e5;">Recuperação de senha</h2>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>PDF TO AUDIO</strong>.</p>
        <p>Clique no botão abaixo para criar uma nova senha. Este link expira em 1 hora.</p>
        <a href="${resetUrl}" 
           style="display:inline-block; margin-top:16px; padding:12px 24px; background:#4f46e5; color:#fff; text-decoration:none; border-radius:6px; font-weight: bold;">
          Redefinir Senha
        </a>
        <p style="margin-top:24px; font-size:12px; color:#888;">
          Se não foi você, ignore este email. O link acima é: <br/>
          <a href="${resetUrl}">${resetUrl}</a>
        </p>
      </div>
    `,
  });
}
