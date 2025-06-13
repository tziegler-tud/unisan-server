import Delta from "quill-delta";
import {IQualification} from "./Qualification";
import {IParticipant} from "./Event";

export interface IPosting {
    id: number|string,
    requiredQualifications: IQualification[],
    title: string,
    description: string,
    allowHigher: boolean,
    date: {
        startTime?: Date,
        endTime?: Date,
    }
    enabled: boolean,
    optional: boolean
}

export interface IEventBlueprint {
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
    participants: IParticipant[],
    createdDate: Date,
    hasPostings: boolean,
    dateRangeString: string;

}