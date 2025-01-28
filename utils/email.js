const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (options) => {
  try {
    const info = await transport.sendMail({
      from: '"Hessah " <Support Team>',
      to: options.email,
      subject: options.subject,
      text: options.text,
      html: options.html || '',
      attachments: options.attachments || [],
    });
    console.log('Email sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(
      'There was an error sending the email. Try again later.',
    );
  }
};

module.exports = sendEmail;
