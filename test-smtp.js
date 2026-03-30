const nodemailer = require('nodemailer');

async function testGmail() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'vignanvgnt2025@gmail.com',
      pass: 'rblz gemr caza afba',
    },
  });

  try {
    let info = await transporter.sendMail({
      from: '"V-Connect Test" <vignanvgnt2025@gmail.com>',
      to: 'vignanvgnt2025@gmail.com',
      subject: 'Test Email from Script',
      text: 'If you get this, Google Auth is working!',
    });
    console.log('SUCCESS: Email sent: ' + info.messageId);
  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

testGmail();
