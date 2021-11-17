import {filterSequence, generateMessage} from "../src/util";

/**
 * Unit testing
 */
describe(
    'filterSequence()',
    () => {
        it(
            'finds sequence TCGATCG and GATG in ACCCTCGATCGTTTATGATCCCGATGTTTATGG.',
            async () => {
                let filterResult = await filterSequence('ACCCTCGATCGTTTATGATCCCGATGTTTATGG', {firstCodon: 'CCC', finalCodon: 'TTT', messageTemplate: ''});

                expect(
                    filterResult
                ).toEqual(
                    expect.arrayContaining(['TCGATCG', 'GATG'])
                );
            }
        );

        it(
            'does\'t find a false gene sequence G in CCCGTTT.',
            async () => {
                let filterResult = await filterSequence('ACCCTCGATCCCCGTTTG', { firstCodon: 'CCC', finalCodon: 'TTT', messageTemplate: '' });

                expect(
                    filterResult
                ).toEqual(
                    false
                );
            }
        );
    }
);

describe(
    'generateMessage()',
    () => {
        it(
            'builds the correct email content from template',
            async () => {
                let templateResult = await generateMessage('Hahn', 'Hello {first_name}, we found that you have the sequence(s) "{matches}". Spoiler: You are related to Genghis Khan.', ['AAA', 'G', 'CAT']);

                expect(
                    templateResult
                ).toEqual(
                    'Hello Hahn, we found that you have the sequence(s) "AAA, G, CAT". Spoiler: You are related to Genghis Khan.'
                );
            }
        );
    }
);