import Delta from "quill-delta";
import {IQualification} from "./Qualification";
import {IUser} from "./User";

export interface IParticipant {
    user: any;
    role: string;
    lastChanged: Date;
    date: Date;
}

export interface IPosition {
    _id?: number|string,
    title: string,
    description: string,
}
export interface IPosting {
    _id: number|string,
    requiredQualifications: IQualification[],
    title: string,
    description: string,
    allowHigher: boolean,
    date: {
        startDate?: Date,
        endDate?: Date,
    }
    position?: number|string,
    enabled: boolean,
    optional: boolean,
    assigned: {
        isAssigned: boolean,
        user?: IUser,
        date?: Date
    },
}

export interface IAugmentedPosting {
    posting: IPosting,
    allowed: IPostingAllowed,
}

export interface IPostingAllowed {
    isAllowed: boolean,
    matchesQualification: boolean,
    hasOverlap: boolean,
    overlap: IPosting,
}

export interface IEvent {
    id: number,
    title: {
        value: string,
        delta: Delta,
        html: string,
    },
    type: {
        index: number;
        title: string;
        value: string;
    },
    description: {
        shortDesc: {
            value: string,
            delta: Object,
            html: string,
        },
        longDesc: {
            value: string,
            delta: Object,
            html: string,
        }
    },
    location: {
        value: string,
    },
    date: {
        startDate: Date,
        endDate: Date,
    }
    postings: IPosting[],
    positions: IPosition[],
    participants: IParticipant[],
    createdDate: Date,
    hasPostings: boolean,
    dateRangeString: string;

}