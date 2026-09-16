import nodemailer from 'nodemailer';
import config from '../config';
import { errorLogger, logger } from '../shared/logger';
import { ISendEmail } from '../types/email';

const sendEmail = async (values: ISendEmail) => {
  try {
    if (!config.email.host || !config.email.user || !config.email.pass) {
      errorLogger.error('Email', 'Email configuration error: EMAIL_HOST, EMAIL_USER, or EMAIL_PASS is missing in environment variables.');
      return;
    }

    const transporter = nodemailer.createTransport({
      host: config.email.host,
      port: Number(config.email.port) || 587,
      secure: Number(config.email.port) === 465,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const info = await transporter.sendMail({
      from: `"UME" <${config.email.from || config.email.user}>`,
      to: values.to,
      subject: values.subject,
      html: values.html,
    });

    logger.info('Mail send successfully', info.accepted);
  } catch (error) {
    errorLogger.error('Email', error);
  }
};

export const emailHelper = {
  sendEmail,
};
