import admin from 'firebase-admin';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

class NotificationService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    /**
     * Sends a high-priority push notification via FCM.
     */
    async sendFCM(uid, title, body, data = {}, priority = 'normal') {
        // In a real system, we fetch the FCM tokens for the user from Firestore
        // For the pathway, we define the structure
        const message = {
            notification: { title, body },
            data,
            android: { priority: priority === 'high' ? 'high' : 'normal' },
            topic: `user_${uid}`
        };

        try {
            // await admin.messaging().send(message);
            console.log(`[FCM-MOCK] Notification sent to ${uid}: ${title}`);
            return true;
        } catch (error) {
            console.error('FCM Failed:', error);
            return false;
        }
    }

    async sendEmail(to, subject, html) {
        try {
            if (!process.env.SMTP_USER) {
                console.log(`[EMAIL-MOCK] To: ${to} | Subject: ${subject}`);
                return true;
            }
            await this.transporter.sendMail({
                from: '"CHEMTRACK Security" <security@chemtrack.io>',
                to,
                subject,
                html
            });
            return true;
        } catch (error) {
            console.error('Email Failed:', error);
            return false;
        }
    }
}

export const notificationService = new NotificationService();
