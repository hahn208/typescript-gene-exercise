import {IRequestData, IUserData} from './interfaces'
import {DBController} from "./dal";

/**
 * Generate a gene sequence given size
 * @param size The number of characters generated in the string.
 */
export const generateNucleotides = async (size: number): Promise<string> => {
    // TODO: convert to Generator function*

    // Cheeky. Concatenate a string of random Nucleotides. Bitwise OR of 0 removes precision.
    for (var sequence = ''; sequence.length < size; sequence += ['A', 'T', 'C', 'G'][Math.random() * 4 | 0]) {}

    return sequence;
};

/**
 * Generate a mess of letters that can be used to seed an email and name.
 * @param size
 */
export const generateLetters = (size: number): string => {
    // Build a string of lower-case letters fit to length.
    for (var letters = ''; letters.length < size; letters += String.fromCharCode(Math.random()*25|97)) {}

    return letters;
};

/**
 * Given an object of customer data and a request object, return the sequence match or null.
 * @param customerSequence The customer data object
 * @param requestData Object with params to filter against
 */
export const filterSequence = async (customerSequence: string, requestData: IRequestData): Promise<string[] | Boolean> => {
    // It's the final codon buh-da duh duuuh, buh-da-da duht duht duuuh.
    const regexMatchGene = new RegExp(`${requestData.firstCodon}((?:(?!${requestData.firstCodon}).){3,})${requestData.finalCodon}`, 'gi');

    let thisMatch, matchedGene = [];

    // Capture matches
    while ((thisMatch = regexMatchGene.exec(customerSequence)) !== null) {
        matchedGene.push(thisMatch[1]);
    }

    // Return false or an array of matched pseudogenes.
    return !!matchedGene.length && matchedGene;
};

/**
 * Given the customer data and a template, return the formatted string
 * @param name The first name from the database
 * @param template The template for the message to be sent
 * @param matches An array of sequences
 */
export const generateMessage = async (name: string, template: string, matches: string[]): Promise<string> => {
    let formattedMessage = template.replace('{first_name}', name);

    // If the template contains {matches} replace it with the matches.
    if(~!!formattedMessage.indexOf('{matches}'))
    {
        // Replace into message a comma delimited list of matches.
        formattedMessage = formattedMessage.replace(
            '{matches}',
            matches.join(', ')
        );
    }

    return formattedMessage;
};


/**
 * Creates tables if they don't exist and feeds data
 * @param dataLayer
 * @param rows
 */
export const dbSeed = async (dataLayer: DBController, rows: number = 50) => {
    console.log('Begin seeding.');

    try {
        // Loop a prop array x times
        for (let x of [...Array(rows)])
        {
            // Get a faux nucleotide string.
            generateNucleotides(60).then(
                (geneString) => {
                    // Add user data
                    dataLayer.putCustomerGene(
                        {
                            email: `${generateLetters(6)}@example.com`,
                            firstName: generateLetters(8),
                            sequence: geneString
                        }
                    );
                }
            );
        }
    }
    catch (err: any)
    {
        console.error(`Seed insert error ${err.message}`);
    }
    finally
    {
        console.log('Seed complete.');
    }
}