import { DBController, IDatabase, Sqlite } from "./dal.js";
import http from 'http';
import { IRequestData, IUserData } from "./interfaces";
import { filterSequence, generateMessage } from "./util.js";
import { mailerMock } from "./mailer.js";

const customerNotify = async (requestData: IRequestData) => {
    try
    {
        // Init dataLayer with Sqlite pointing to the legit db.
        let DB: IDatabase<IUserData> = new Sqlite('./ts-demo.db');
        let dataLayer = new DBController(DB);

        // Init mock mailer.
        const mailer = new mailerMock();
        await mailer.auth(
            'user',
            'pass',
            (err, res) => { if(err) throw new Error(err!); }
        );

        // Query the database and run the function against the resulting row.
        return await dataLayer.runCustomerNotify(
            requestData,
            async (row) => {
                // Validate that the data from the query is a true sequence
                const pgResult = await filterSequence(row.sequence, requestData);

                // Close match but not quite apparently
                if(!pgResult) return;

                // @ts-ignore // This is because pgResult was potentially Boolean, but now must have results. The bang is meant to work for that.
                const pgMatches: string[] = pgResult!;

                // Generate the template to be emailed
                const pgTemplate = await generateMessage(row.firstName, requestData.messageTemplate, pgMatches);

                // Fake send the email
                await mailer.send(
                    {
                        email: row.email,
                        sender: 'hahn@example.com',
                        subject: 'Kia Ora! sequence results enclosed.',
                        plainText: pgTemplate
                    },
                    (err, res) => {
                        if(err)
                        {
                            console.error(err);

                            // Add to failure queue
                        }

                        console.log(res, pgTemplate);
                    }
                );
            }
        );
    }
    catch(err)
    {
        console.error(err);
    }
};

const server = http.createServer(
    (req, res) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');

        // Look for a post to /dna
        if(req.method === 'POST' && req.url === '/dna')
        {
            // TODO: Any security features and validation at all.

            let jsonString = '';

            // Assemble data from request.
            req.on('data', data => jsonString += data);
            req.on(
                'end',
                async () => {
                    const postData = JSON.parse(jsonString);

                    // TODO: Validate request here, error out.
                    const requestData = {
                        firstCodon: postData.first_codon,
                        finalCodon: postData.final_codon,
                        messageTemplate: postData.template
                    }

                    // Pass the data to the customer notification script.
                    await customerNotify(requestData).catch((err) => { console.error(err); });

                    // close the request
                    res.end();
                }
            );
        }
        else
        {
            res.write('Run the following to get going.\n\n');
            res.write('curl -X POST -H "Content-Type: application/json" -d \'{ "first_codon": "ATG", "final_codon": "TTG", "template": "Hello {first_name}, we found that you have the sequence \\"{matches}\\". Spoiler: You are related to Genghis Khan." }\' http://localhost:3000/dna');
        }

        res.end('\n\nCheers!\n');
    }
);

// Server over port 3000.
server.listen(
    3000,
    () => {
        console.log(`Server up on :3000`);
    }
);
