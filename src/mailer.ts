
interface IMailerArgs {
    email: string;
    sender: string;
    subject: string;
    plainText: string;
}

type mailerCallback = (err: string | null, res: {}) => void;

interface IMailer {
    auth(user: string, pass: string, callback: mailerCallback): Promise<void>;
    send(mailerArgs: IMailerArgs, callback: mailerCallback): Promise<void>;
}

/**
 *  Super simple mock of sending out mail.
 */
export class mailerMock implements IMailer {
    // Hey, why do we have to redeclare the type here? That's just the way it is. https://github.com/microsoft/TypeScript/issues/32082
    async auth(user: string, pass: string, callback: mailerCallback): Promise<void>
    {
        callback(null, { status: 'ok' });
    };

    async send(mailerArgs: IMailerArgs, callback: mailerCallback): Promise<void>
    {
        // Return that it worked
        callback(null, { status: 'ok' });
    }
}

/**
 * TODO: Mailer class for a third party here
 */