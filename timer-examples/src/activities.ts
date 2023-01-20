/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Context } from '@temporalio/activity';
import axios from 'axios';

interface MailgunSettings {
  apiKey?: string;
  domain?: string;
  to?: string;
  from: string;
}

const mailgunAPI = 'https://api.mailgun.net/v3';
const subject = 'Order processing taking longer than expected';
const html = `Order processing is taking longer than expected, but don't worry—the job is still running!`;

export const createActivities = ({ apiKey, domain, to, from }: MailgunSettings) => ({
  async processOrder(): Promise<void> {
    // Delay completion to simulate work and show how to race an activity and a timer.
    const cx = Context.current();
    await cx.sleep(cx.info.startToCloseTimeoutMs / 2);
    console.log('Order processed');
  },

  async sendNotificationEmail(): Promise<void> {
    if (apiKey && domain && to) {
      console.log('Sending email:', html);
      await axios({
        url: `${mailgunAPI}/${domain}/messages`,
        method: 'post',
        params: { to, from, subject, html },
        auth: {
          username: 'api',
          password: apiKey,
        },
      });
    } else {
      console.log('Skipping sending email:', html);
    }
  },
});
