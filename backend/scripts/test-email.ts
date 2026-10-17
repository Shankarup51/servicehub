
import 'dotenv/config';
import nodemailer from 'nodemailer';

async function main() {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST ?? 'smtp.gmail.com',
    port: Number(process.env.MAIL_PORT ?? 587),
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  await transporter.verify();
  console.log('Gmail SMTP connection successful.');

  const result = await transporter.sendMail({
    from: process.env.MAIL_FROM ?? process.env.MAIL_USER,
    to: process.env.MAIL_USER,
    subject: 'ServiceHub SMTP Test',
    text: 'Your ServiceHub Gmail SMTP configuration is working.',
  });

  console.log('Test email accepted by SMTP server:', result.messageId);
}

main().catch((error: unknown) => {
  console.error('SMTP test failed:', error);
  process.exitCode = 1;
});
