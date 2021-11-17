# Typescript Demo

## Building and Starting

To make the project and run all tests:  
`yarn build`  

To create db, create tables, and seed the tables with faux customer data:  
`yarn seed`

To init a webserver over port 3000. Visiting localhost:3000 provides a cURL script to copy for a sample request.  
`yarn start`

To build with each detected modification:  
`yarn watch`

## Project Info

Tried to keep it lean. We have Typescript latest (4.4.3) running on Node v12. Tests are mocking a database in memory; actual implementation is using a SQLite3 flatfile with the help of https://github.com/mapbox/node-sqlite3/. Unit and integration tests are done with [Jest](https://jestjs.io/).

## Considerations

- In trying to avoid yet another library I thought I could just use a JSON file for configurations in TS. That was a surprise headache and the project should be refactored to just use `dotenv`. Dreaded tech-debt!
- Authentication! Don't want just anyone to be able to post to our app.
- Depending on applied utility of this app, we probably want to add a date-notified column at least to prevent accidental spamming of customers.
- It would make sense to only need this to run once across all tables, then just on-insert.
- There has to be some way to disassociate the dna data with the user's identifying information. EG DNA.customer_id > password + salt > Customer.sha_id
- File structure is far more flat than it would be in practice.

## How it works

1. A post request is received to /dna

2. The database is queried WHERE sequence LIKE '%ATG%___%TTG%'
    - Find any sequence that has a start and end sequence with at least three characters between
    - This will result in potential false positives like 'ATG_ATG_TTG'

3. Validate the database match and return the sequence with the regex pattern /ATG((?:(?!ATG).){3,})TTG/gi
    1. Find `ATG`
    2. Lookahead ?: for not ?! `ATG`
    3. Match at least three {3,} characters until `TTG`

4. We do this because SQL is fast (and doesn't support regular expressions).
   
5. A callback is run against each valid row returned, which mock sends out an email with the provided template.