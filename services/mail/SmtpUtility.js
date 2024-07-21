import nodemailer from 'nodemailer';

export default class SmtpUtility {
    constructor({host, port, adminAddress, adminName, adminAuthName, adminAuthPassword}) {
        this.host = host;
        this.port = port;
        this.adminAddress = adminAddress;
        this.adminName = adminName;
        this.adminAuthName = adminAuthName;
        this.adminAuthPassword = adminAuthPassword;
    }

    sendAdminMail({recipientName, recipientAddress, subject, htmlBody}){
        return this.sendMail({senderAddress: this.adminAddress, senderName: this.adminName, recipientAddress: recipientAddress, recipientName: recipientName, subject: subject, htmlBody: htmlBody, senderAuthName: this.adminAuthName, senderAuthPassword: this.adminAuthPassword});
    }

    async sendMail({senderAddress, senderName, recipientAddress, recipientName, subject, htmlBody, senderAuthName, senderAuthPassword}){
        const transporter = nodemailer.createTransport({
            host: this.host,
            port: this.smtpPort,
            secure: true, // Use `true` for port 465, `false` for all other ports
            auth: {
                user: senderAuthName,
                pass: senderAuthPassword,
            },
        });
        const info = await transporter.sendMail({
            from: '"'+senderName +'" <' + senderAddress + '>', // sender address
            to: '"'+recipientName+'" <' + recipientAddress + '>', // list of receivers
            subject: subject, // Subject line
            html: htmlBody, // html body
        });
    }




}