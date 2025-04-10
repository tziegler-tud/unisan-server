interface QualificationValue {
    qualType: string;
    name: string;
    [key: string]: any;
}

interface QualificationArgs {
    [key: string]: any;
}

interface QualificationApi {
    removeQualification: (
        qualificationId: string,
        value: QualificationValue,
        args?: QualificationArgs,
        callback?: () => void
) => void;
    updateQualification: (
        qualificationId: string,
        value: QualificationValue,
        args?: QualificationArgs,
        callback?: () => void
) => void;
    addQualification: (
        value: QualificationValue,
        args?: QualificationArgs,
        callback?: () => void
) => void;
    getGrouped: () => Promise<any>; // Changed to Promise<any> for better async handling
}

const qualificationActions: QualificationApi = {
    removeQualification: async function (
        qualificationId: string,
        value: QualificationValue,
        args?: QualificationArgs,
    callback?: () => void
) {
    try {
        const data: any = {
            qualType: value.qualType,
            name: value.name,
            ...args, // Use spread operator for cleaner argument merging
        };

        await $.ajax({
            url: `/api/v1/qualification/${qualificationId}`,
            type: "DELETE",
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(data),
        });

        callback?.(); // Use optional chaining for callback execution
    } catch (error) {
        console.error("Error removing qualification:", error);
        // Handle error appropriately (e.g., show a user message)
    }
},

updateQualification: async function (
    qualificationId: string,
    value: QualificationValue,
    args?: QualificationArgs,
    callback?: () => void
) {
    try {
        const data: any = {
            ...value,
            ...args,
        };

        await $.ajax({
            url: `/api/v1/qualification/${qualificationId}`,
            type: "PUT",
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(data),
        });

        callback?.();
    } catch (error) {
        console.error("Error updating qualification:", error);
        // Handle error appropriately
    }
},

addQualification: async function (
    value: QualificationValue,
    args?: QualificationArgs,
    callback?: () => void
) {
    try {
        const data: any = {
            ...value,
            ...args,
        };

        await $.ajax({
            url: "/api/v1/qualification/create",
            type: "POST",
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(data),
        });

        callback?.();
    } catch (error) {
        console.error("Error adding qualification:", error);
        // Handle error appropriately
    }
},

getGrouped: async function (): Promise<any> {
    try {
        return await $.ajax({
            url: "/api/v1/qualification/groupByType",
            type: "GET",
            contentType: "application/json; charset=UTF-8",
        });
    } catch (error) {
        console.error("Error getting grouped qualifications:", error);
        throw error; // Rethrow the error to be handled by the caller
    }
},
};

export default qualificationActions;