//this is jonas mail file to use it if needed

const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  //1) create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    //ACTIVATE in gmail "less secure app" option
  });

  //2) create mail options
  const mailOptions = {
    from: 'Mohamed Hisham <mohamedhisham7889@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  //3) send email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
