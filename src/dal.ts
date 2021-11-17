import config from "./project.config.json";
import sqlite3, { Database } from "sqlite3";
import { IRequestData, IUserData } from "./interfaces";

/**
 * The Database scaffolding interface. Knowingly not implementing insertCustomer(), getCustomer(), delete(), etc.
 */
export interface IDatabase<T>
{
    createSchema(): Promise<boolean>,

    /**
     * Inserts data in the form of the inherited interface.
     * @param dataGene Object to be inserted
     * @param callback
     */
    insertCustomerGene(dataGene: T, callback?: () => Promise<void>): Promise<void>,

    findSequence(requestData: IRequestData, callback: (row: T) => Promise<void>): Promise<void>

    /**
     * Gets results, executes callback function.
     */
    getAll(callback: Function): Promise<void>

    /**
     * Close connection
     */
    close(): Promise<void>
}

/**
 * Empty shell of an alternate database implementation, eg mongo.
 * let DB: IDatabase<IUserData> = new FauxDB();
 * let dataLayer = new DBController(DB);
 */
export class FauxDB<T> implements IDatabase<T>
{
    private readonly dataset: T[];

    constructor()
    {
        this.dataset = [];
    }

    async createSchema()
    {
        return true;
    }

    async insertCustomerGene(dataGene: T, callback: () => Promise<void>)
    {
        this.dataset.push(dataGene);
        await callback();
    }

    async getAll(callback: (arg: T[]) => void)
    {
        callback(this.dataset);
        return;
    }

    async findSequence(requestData: IRequestData, callback: (row: T) => Promise<void>)
    {
        return;
    }

    async close()
    {
        return;
    }
}

export class Sqlite<T> implements IDatabase<T>
{
    private readonly db: Database;

    constructor(path = ':memory:')
    {
        this.db = new sqlite3.Database(
            path,
            (err) => {
                err && console.error(err.message);
            }
        );
    }

    async createSchema()
    {
        try
        {
            this.db.serialize(
                async () => {
                    // TODO: Set email field as unique
                    // TODO: Email addresses can technically be 320 chars
                    // TODO: Add last_notified column
                    await this.db.run(
                        `CREATE TABLE IF NOT EXISTS "${config.db.table.customer}" (
                            ${config.db.schema.customer.customerID} INTEGER PRIMARY KEY AUTOINCREMENT,
                            ${config.db.schema.customer.email} CHAR(100),
                            ${config.db.schema.customer.firstName} CHAR(50)
                        );`,
                        (
                            err => {
                                if(!!err)
                                {
                                    // yeet on error
                                    throw new Error(err.message);
                                }
                            }
                        )
                    );

                    // TODO: Review option of indexing data
                    await this.db.run(
                        `CREATE TABLE IF NOT EXISTS ${config.db.table.dna} (
                            ${config.db.schema.dna.dnaID} INTEGER PRIMARY KEY AUTOINCREMENT,
                            ${config.db.schema.dna.customerID} INTEGER NOT NULL,
                            ${config.db.schema.dna.sequence} CHAR(${Math.pow(2, 16)}),
                            \`${config.db.schema.dna.order}\` INTEGER,
                            FOREIGN KEY (\`${config.db.schema.dna.customerID}\`)
                                REFERENCES ${config.db.table.customer} (${config.db.schema.customer.customerID})
                                    ON DELETE CASCADE
                                    ON UPDATE NO ACTION
                        );`,
                        (
                            err => {
                                if(!!err)
                                {
                                    // yeet on error
                                    throw new Error(err.message);
                                }
                            }
                        )
                    );
                }
            );
        }
        catch (err: any)
        {
            console.error(err);

            return false;
        }

        return true;
    }

    async insertCustomerGene(data: T, callback?: () => Promise<void> | null)
    {
        // @ts-ignore // Typescript doesn't like this obj destructuring for some reason.
        const { email, firstName, sequence } = data;

        // Add the customer (if they don't exist), then insert DNA
        this.db.serialize(
            async () => {
                try {
                    // Insert the customer data or replace. If the customer exists, return the existing ID.
                    await this.db.run(
                        `INSERT OR REPLACE INTO ${config.db.table.customer} (
                            ${config.db.schema.customer.email},
                            ${config.db.schema.customer.firstName}
                        ) VALUES (
                            ?, ?
                        )`,
                        [
                            email,
                            firstName
                        ],
                        async function (err)
                        {
                            if (err) return err;

                            // Given the insert/replace ID, insert the sequence
                            await insertSequence(this.lastID, sequence);
                        }
                    );

                    /**
                     * Add the sequence to the customer dna table. Run callback after.
                     * @param lastID
                     * @param _sequence
                     */
                    const insertSequence = async (lastID: number, _sequence: string) => {
                        await this.db.run(
                            `INSERT OR REPLACE INTO ${config.db.table.dna} (
                                ${config.db.schema.dna.customerID},
                                ${config.db.schema.dna.sequence}
                            ) VALUES (
                                ?,
                                ?
                            )`,
                            [
                                lastID,
                                _sequence
                            ],
                            () => {
                                // Execute callback if provided.
                                callback && callback();
                            }
                        );
                    };
                }
                catch (err: any)
                {
                    console.error(`Insert error ${err.message}`);
                }
            }
        );
    }

    async findSequence(requestData: IRequestData, callback: (row: T) => Promise<void>)
    {
        // Run a query and run the callback against each row yield.
        // Do this to prevent loading all the results into memory.
        this.db.each(
            `SELECT ${config.db.schema.customer.firstName} AS firstName,
                ${config.db.schema.customer.email} AS \`email\`,
                ${config.db.schema.dna.sequence} AS sequence
            FROM ${config.db.table.dna}
            LEFT JOIN ${config.db.table.customer}
                ON ${config.db.table.dna}.${config.db.schema.dna.customerID} = ${config.db.table.customer}.${config.db.schema.customer.customerID}
            WHERE ${config.db.schema.dna.sequence} LIKE '%${requestData.firstCodon}%___%${requestData.finalCodon}%'`,
            (err, row: T) => {
                err && console.error(err);

                // Execute the callback on the yielded row.
                callback(row);
            },
            (err, rows: number) => {
                err && console.error(err.message);

                // All rows complete.
                // Eventually we'll want a final_callback or similar here
            }
        );
    }

    async getAll(callback: (arg: T[]) => void)
    {
        await this.db.all(
            `SELECT ${config.db.schema.customer.firstName} AS firstName,
                ${config.db.schema.customer.email} AS \`email\`,
                ${config.db.schema.dna.sequence} AS sequence
            FROM ${config.db.table.dna}
            LEFT JOIN ${config.db.table.customer}
                ON ${config.db.table.dna}.${config.db.schema.dna.customerID} = ${config.db.table.customer}.${config.db.schema.customer.customerID}`,
            (err, result: T[]) => {
                err && console.error(err);
                callback(result);
            }
        );
    }

    async close()
    {
        this.db.close();
    }
}

export class DBController {
    constructor(private db: IDatabase<IUserData>) {}

    async runCreateTables()
    {
        return this.db.createSchema();
    }

    async putCustomerGene(dataSet: IUserData, callback?: () => Promise<void>)
    {
        return this.db.insertCustomerGene(dataSet, callback);
    }

    // TODO: Refactor because the name is confusing.
    async runCustomerNotify(requestData: IRequestData, callback: (row: IUserData) => Promise<void>)
    {
        await this.db.findSequence(requestData, callback);
    }

    async getCustomerAll(callback: Function)
    {
        await this.db.getAll(callback);
    }

    async runDatabaseClose()
    {
        await this.db.close();
    }
}