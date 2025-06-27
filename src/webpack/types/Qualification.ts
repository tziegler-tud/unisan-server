export interface IQualification {
    _id: number,
    qualType: string,
    typeIdentifier: number,
    level: number,
    name: string,
    short: string,
}

export const qualTypesMap = {
    SAN: "Sanitätsdienst",
    FUEHRUNG: "Einsatzführung",
    NACHWEIS: "Nachweis",
    AUSBILDUNG: "Ausbildung",
}