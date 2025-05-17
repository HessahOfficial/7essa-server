const nodemailer = require("nodemailer");
const pug = require("pug");
const htmlToText = require("html-to-text");

module.exports = class Email {
  constructor(user, url, attachments = []) {
    this.to = user.email;
    this.firstName = user.firstName;
    this.url = url;
    this.from = `Hessah Team <${process.env.EMAIL_FROM}>`;
    this.attachments = attachments;
  }

  newTransport() {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  // Send the actual email
  async send(template, subject) {
    // 1) Render HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      bcc: `${process.env.BCC_EMAIL_1} , ${process.env.BCC_EMAIL_2}`,
      subject,
      html,
      text: htmlToText.htmlToText(html),
    };
    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome to Hessah Family!");
  }

  async sendPasswordReset() {
    await this.send(
      "passwordReset",
      "Your password reset token (valid for only 10 minutes)"
    );
  }

  async sendEmailVerification() {
    await this.send(
      "emailVerification",
      "Email Verification Token (valid for only 10 minutes)"
    );
  }

};
