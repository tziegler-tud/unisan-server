import {IQualification} from "./Qualification";

/**
 * Represents a user's basic data.
 */
export interface UserBasicData {
    id: string;
    generalData?: {
        firstName: { value: string };
        lastName: { value: string };
        memberId: { value: string };
    };

    // Add other user properties as needed
}


export interface IUser {
    id: number;
    username: string;
    internalEmail?: string;

    mail?: {
        applicationToken?: string;
        senderName?: string; // Note: Computed field from generalData
    };

    generalData: {
        firstName: {
            title?: string;
            value: string;
        };
        lastName: {
            title?: string;
            value: string;
        };
        memberId?: {
            title?: string;
            value?: number;
        };
        customData?: Array<{
            title?: string;
            value?: string;
            type?: string;
        }>;
    };

    contactData?: Array<{
        type?: string;
        title?: string;
        annotation?: string;
        value?: any; // type is unspecified in schema
        default: boolean;
    }>;

    otherData?: {
        customData?: Array<{
            title?: string;
            value?: string;
        }>;
    };

    hash: string;

    qualifications?: Array<{
        qualification: IQualification;
        acquiredDate?: Date;
        expireDate?: Date;
        trainingDate?: Date;
        isValid?: boolean;
        hasDocument?: boolean;
        documentPath?: string;
    }>;

    hasPhoto?: boolean;
    isDisplayedOnPublic?: boolean;
    loginEnabled?: boolean;
    privacyAgreement?: boolean;
    createdDate?: Date;
}