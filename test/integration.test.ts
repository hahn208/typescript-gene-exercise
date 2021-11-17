import { mailerMock } from "../src/mailer";
import {DBController, IDatabase, Sqlite } from "../src/dal";
import {IRequestData, IUserData} from "../src/interfaces";
import {dbSeed, generateMessage} from "../src/util";

describe('Database interaction',
    () => {
        let DB: IDatabase<IUserData>;
        let dataLayer: any;

        beforeAll(
            async () => {
                // Init dataLayer with Sqlite in memory only.
                DB = new Sqlite();
                dataLayer = new DBController(DB);

                // Create tables
                await dataLayer.runCreateTables();

                // Seed the tables with 10 rows
                await dbSeed(dataLayer, 10);
            }
        );

        it('should create tables, add data, and retrieve data',
            (done: jest.DoneCallback) => {
                // Callback function to display results and close connection after insert test.
                let dataResult = async () => {
                    await dataLayer.getCustomerAll(
                        (res: IUserData[]) => {
                            expect(res).toContainEqual(
                                {
                                    email: `hahn@example.com`,
                                    firstName: 'Hahn',
                                    sequence: 'TAAATTAAGAGCCTGGATCCTTAGCAAGGTCCGCTTGGGTCTTTTGGAGGTGCTCGTGAC'
                                }
                            );

                            // Slow your roll, Jest. Wait for the callback before completing the test.
                            done();
                        }
                    );
                };

                // Add the user. When complete, query the db and verify matching data.
                dataLayer.putCustomerGene(
                    {
                        email: `hahn@example.com`,
                        firstName: 'Hahn',
                        sequence: 'TAAATTAAGAGCCTGGATCCTTAGCAAGGTCCGCTTGGGTCTTTTGGAGGTGCTCGTGAC'
                    },
                    dataResult
                );
            }
        );


        it(
            'should find a row with the matching sequence',
            (done) => {
                expect.hasAssertions();

                const requestData = {
                    firstCodon: "AAA",
                    finalCodon: "GCC",
                    messageTemplate: "Hello{first_name}, we found that you have the sequence \"{sequence}\". Spoiler: You are related to Genghis Khan."
                }

                // The previous test added a specific row which should match AAA|TTAAGA|GCC
                // TODO: poorly named method...
                dataLayer.runCustomerNotify(
                    requestData,
                    async (resp: IUserData) => {
                        if(resp.email === 'hahn@example.com')
                        {
                            await expect(resp).toEqual(
                                {
                                    email: `hahn@example.com`,
                                    firstName: 'Hahn',
                                    sequence: 'TAAATTAAGAGCCTGGATCCTTAGCAAGGTCCGCTTGGGTCTTTTGGAGGTGCTCGTGAC'
                                }
                            );

                            // Tell the test we're done.
                            done();
                        }
                    }
                );
            }
        );

        it('should send an email with the mock class',
            async () => {
                const dbResult: IUserData = {
                    email: `hahn@example.com`,
                    firstName: 'Hahn',
                    sequence: 'TAAATTAAGAGCCTGGATCCTTAGCAAGGTCCGCTTGGGTCTTTTGGAGGTGCTCGTGAC'
                };

                const userRequest: IRequestData = {
                    firstCodon: '',
                    finalCodon: '',
                    messageTemplate: ''
                };
            }
        );


        // Teardown
        afterAll(
            async () => {
                // Close database (adios data in memory)
                await dataLayer.runDatabaseClose();
            }
        );
    }
);

describe(
    'Customer notification',
    () => {
        it(
            'builds a message from the results',
            async () => {
                // Generate the template to be emailed
                const pgTemplate = await generateMessage(
                    "Hahn",
                    "Hello {first_name}, we found that you have the sequence \"{matches}\". Spoiler: You are related to Genghis Khan.",
                    ['TTAAGA']
                );

                expect(pgTemplate).toEqual('Hello Hahn, we found that you have the sequence \"TTAAGA\". Spoiler: You are related to Genghis Khan.');
            }
        );

        it(
            'sends an email to the customer.',
            async () => {
                // Tell Jest to wait for one expect.
                expect.assertions(1);

                try
                {
                    const mailer = new mailerMock();
                    await mailer.auth(
                        'user',
                        'pass',
                        (err, res) => {
                            if (err) throw new Error(err!);
                        }
                    );

                    await mailer.send(
                        {
                            email: 'customer@example.com',
                            sender: 'hahn@example.com',
                            subject: 'Kia Ora! Gene sequence results enclosed.',
                            plainText: 'Hello Hahn, we found that you have the sequence \"TTAAGA\". Spoiler: You are related to Genghis Khan.'
                        },
                        (err, res) => {
                            console.log(res);
                            expect(err).toBeNull();
                        }
                    );
                }
                catch (err)
                {
                    console.error(err);
                }
            }
        );
    }
);
