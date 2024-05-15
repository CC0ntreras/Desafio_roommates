const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'Emailvalido', //email valido de quien envia los gastos.
        pass: 'XXX'
    }
});

const sendEmail = (roommates, nuevoGasto) => {
    console.log(roommates, nuevoGasto)
    const mailOptions = {
        from: 'Emailvalido',
        to: roommates.map(rm => rm.email).join(','),
        subject: 'Nuevo Gasto Registrado',
        text: `Se ha registrado un nuevo gasto:\n\n${JSON.stringify(nuevoGasto, null, 2)}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error enviando el email:', error);
        } else {
            console.log('Email enviado:', info.response);
        }
    });
};

module.exports = sendEmail;
