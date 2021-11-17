
interface IRequestData
{
    firstCodon: string,
    finalCodon: string,
    messageTemplate: string
}

interface IUserData
{
    firstName: string,
    email: string,
    sequence: string
}

export {
    IRequestData,
    IUserData
}