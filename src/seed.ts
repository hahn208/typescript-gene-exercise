import {DBController, IDatabase, Sqlite} from "./dal.js";
import { dbSeed } from "./util.js";
import {IUserData} from "./interfaces";

(
    // Given a DB implementation, seed it.
    async () => {
        let DB: IDatabase<IUserData> = new Sqlite('./ts-demo.db');
        let dataLayer = new DBController(DB);

        // Create tables
        await dataLayer.runCreateTables();

        // Seed the tables with 10k rows
        await dbSeed(dataLayer, 10000);
    }
)();