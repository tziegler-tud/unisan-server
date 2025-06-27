import {type IEventBlueprint, IBlueprintPosting} from "../types/EventBlueprint";
import {type ShowPostingConfirmPayload} from "../sidebar/plugins/plugin-eventfactory";

const baseUrl =  "/api/v1/eventfactory/"


interface AddBlueprintPostingActionPayload {
    description: string,
    allowHigher: boolean,
    optional: boolean,
    enabled: boolean,
    startTime: string,
    endTime: string,
    date?: Date,
    requiredQualifications: number[]
}

interface UpdateBlueprintPostingActionPayload {
    id: number|string,
    description: string,
    allowHigher: boolean,
    optional: boolean,
    enabled: boolean,
    startTime: string,
    endTime: string,
    date?: Date,
    requiredQualifications: number[]
}

interface AddBlueprintPostingApiPayload {
    description: string,
    allowHigher: boolean,
    optional: boolean,
    enabled: boolean,
    date: {
        startTime: number,
        endTime: number,
    }
    requiredQualifications: number[]
}

interface UpdateBlueprintPostingApiPayload {
    id: number|string,
    description: string,
    allowHigher: boolean,
    optional: boolean,
    enabled: boolean,
    date: {
        startTime: number,
        endTime: number,
    },
    requiredQualifications: number[]
}

interface EventBlueprintActions {
    getEventBlueprints(params: {
        matchString?: string;
    }): Promise<IEventBlueprint[]>;
    addEventBlueprint(args: {
        title: string;
        longDescVal: string;
        longDescDelta: any; // Define delta type if possible
        shortDescVal: string;
        shortDescDelta: any; // Define delta type if possible
        type: any; // Define type if possible
        location: string;
        date: string;
        startTime: string;
        endTime: string;
    }): JQuery.jqXHR;
    deleteEventBlueprint(id: string|number, callback?: (result: any) => void): JQuery.jqXHR;
    addPosting(id: string|number, postingData: AddBlueprintPostingActionPayload, callback?: (result: any) => void, args?: {}): JQuery.jqXHR; // Define postingData type
    updatePosting(id: string|number, postingData: UpdateBlueprintPostingActionPayload, callback?: { onSuccess?: (result: any) => void, onError?: (jqXHR: JQuery.jqXHR,  textStatus: string,  errorThrown: string ) => void }): JQuery.jqXHR;
    removePosting(id: string|number, postingId: string, callback?: { onSuccess?: (result: any) => void }): JQuery.jqXHR;
    saveTitle(id: string|number, data: { delta: any; value: string }, callback?: { onSuccess?: (result: any) => void }): JQuery.jqXHR; // Define delta type
    saveDescription(id: string|number, data: { longDesc: any; shortDesc: any }, callback?: { onSuccess?: (result: any) => void }): JQuery.jqXHR; // Define desc types
    saveLocation(id: string|number, data: {value: string}, callback?: { onSuccess?: (result: any) => void, onError?: (jqXHR: JQuery.jqXHR,  textStatus: string,  errorThrown: string ) => void  }): JQuery.jqXHR; // Define desc types
    updateTime(id: string|number, data: {startTime: string, endTime: string}, callback?: { onSuccess?: (result: any) => void, onError?: (jqXHR: JQuery.jqXHR,  textStatus: string,  errorThrown: string ) => void }): JQuery.jqXHR;
}

const eventBlueprintActions: EventBlueprintActions = {
    async getEventBlueprints({
                        matchString = "",
                    }: {
        matchString?: string;
    }): Promise<IEventBlueprint[]> {
        const data = {
            filter: matchString,
        };

        return new Promise((resolve, reject) => {
            $.ajax({
                url: baseUrl + "/filter",
                type: "POST",
                contentType: "application/json; charset=UTF-8",
                dataType: "json",
                data: JSON.stringify(data),
                success: (events: IEventBlueprint[]) => resolve(events),
                error: (XMLHttpRequest: any, textStatus: string, errorThrown: any) => {
                    console.error(`AJAX error: ${XMLHttpRequest.status} ${XMLHttpRequest.statusText}`);
                    reject(errorThrown);
                },
            });
        });
    },


    addEventBlueprint(args) {
        const startDate = parseHTMLInputDate(args.startTime).getTime();
        const endDate = parseHTMLInputDate(args.endTime).getTime();

        const data = {
            title: args.title,
            description: {
                longDescription: { value: args.longDescVal, delta: args.longDescDelta },
                shortDescription: { value: args.shortDescVal, delta: args.shortDescDelta },
            },
            type: args.type,
            location: args.location,
            startDate: startDate,
            endDate: endDate,
        };

        return $.ajax({
            url: baseUrl + "create",
            type: "POST",
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(data),
            success: function(result: any) {
                if (result.id) {
                    location.replace("/eventfactory/" + result.id);
                } else location.replace("/eventfactory");
            },
        });
    },

    deleteEventBlueprint(eventid, callback) {
        callback = callback == null ? function() {
            alert("event " + eventid + " deleted.");
            window.location.replace("/eventfactory");
        } : callback;

        return $.ajax({
            url: `${baseUrl}/${eventid}`,
            type: "DELETE",
            success: function(result: any) {
                callback(result);
            },
        });
    },

    addPosting(id, postingData, callback, args) {
        callback = callback == null ? function() { } : callback;

        const startDate = parseHTMLInputDate(postingData.startTime).getTime();
        const endDate = parseHTMLInputDate(postingData.endTime).getTime();

        let posting: AddBlueprintPostingApiPayload = {
            description: postingData.description,
            allowHigher: postingData.allowHigher,
            optional: postingData.optional,
            enabled: postingData.enabled,
            requiredQualifications: postingData.requiredQualifications,
            date: {
                startTime: startDate,
                endTime: endDate,
            }
        }

        const data = {
            id: id,
            posting: posting,
            args: {},
        };
        return $.ajax({
            url: baseUrl + id + "/addPost",
            type: "PUT",
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(data),
            success: (result: any) => {
                callback(result);
            },
        });
    },

    updatePosting(id, postingData, callback) {
        if (callback === undefined) callback = {};
        if (callback.onSuccess === undefined) callback.onSuccess = function() { };

        const startDate = parseHTMLInputDate(postingData.startTime).getTime();
        const endDate = parseHTMLInputDate(postingData.endTime).getTime();

        let posting: UpdateBlueprintPostingApiPayload = {
            id: postingData.id,
            description: postingData.description,
            allowHigher: postingData.allowHigher,
            optional: postingData.optional,
            enabled: postingData.enabled,
            requiredQualifications: postingData.requiredQualifications,
            date: {
                startTime: startDate,
                endTime: endDate,
            }
        }
        const data = {
            id: id,
            posting: posting,
            args: {},
        };

        return $.ajax({
            url: baseUrl + id + "/updatePost",
            type: "POST",
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(data),
            success: function(result: any) {
                callback.onSuccess(result);
            },
            error: function(jqXHR: JQuery.jqXHR,  textStatus: string,  errorThrown: string ) {
                callback.onError(jqXHR, textStatus, errorThrown)
            }
        });
    },

    removePosting(id, postingId, callback) {
        if (callback === undefined) callback = {};
        if (callback.onSuccess === undefined) callback.onSuccess = function() { };
        const data = {
            id: id,
            postingId: postingId,
            args: {},
        };
        return $.ajax({
            url: baseUrl + id + "/removePost",
            type: "POST",
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(data),
            success: (result: any) => {
                callback.onSuccess(result);
            },
        });
    },

    saveTitle(id, data, callback) {
        if (callback === undefined) callback = {};
        if (callback.onSuccess === undefined) callback.onSuccess = function() { };
        const postData = {
            delta: data.delta,
            value: data.value,
        };
        return $.ajax({
            url: baseUrl + id + "/updateTitle/",
            type: "PUT",
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(postData),
            success: function(result: any) {
                callback.onSuccess(result);
            },
        });
    },
    saveDescription(id, data, callback) {
        if (callback === undefined) callback = {};
        if (callback.onSuccess === undefined) callback.onSuccess = function() { };
        const postData = {
            longDesc: data.longDesc,
            shortDesc: data.shortDesc,
        };
        return $.ajax({
            url: baseUrl + id + "/updateDescription/",
            type: "PUT",
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(postData),
            success: function(result: any) {
                callback.onSuccess(result);
            },
        });
    },

    saveLocation(id, {value}, callback) {
        if (callback === undefined) callback = {};
        if (callback.onSuccess === undefined) callback.onSuccess = function() { };
        if (callback.onError === undefined) callback.onError = function() { };
        const postData = {
            location: value,
        };
        return $.ajax({
            url: baseUrl + id + "/updateLocation" ,
            type: "PUT",
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(postData),
            success: function(result: any) {
                callback.onSuccess(result);
            },
            error: function(jqXHR: JQuery.jqXHR,  textStatus: string,  errorThrown: string ) {
                callback.onError(jqXHR, textStatus, errorThrown)
            }
        });

    },

    updateTime(id: string|number, data: {startTime: string, endTime: string}, callback){
        if (callback === undefined) callback = {};
        if (callback.onSuccess === undefined) callback.onSuccess = function() { };
        const postData = {
            startTime: parseHTMLInputDate(data.startTime).getTime(),
            endTime: parseHTMLInputDate(data.endTime).getTime()
        };
        return $.ajax({
            url: baseUrl + id + "/updateTime/",
            type: "PUT",
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(postData),
            success: function(result: any) {
                callback.onSuccess(result);
            },
            error: function(jqXHR: JQuery.jqXHR,  textStatus: string,  errorThrown: string ) {
                callback.onError(jqXHR, textStatus, errorThrown)
            }
        });
    }

};

/**
 *
 * @param {String} time hh:mm
 * @returns {Date}
 */
function parseHTMLInputDate(time: string): Date {

    const timeHours = parseInt(time.substr(0, 2));
    const timeMinutes = parseInt(time.substr(3, 2));

    const d = new Date();
    d.setHours(timeHours);
    d.setMinutes(timeMinutes);
    d.setSeconds(0);
    d.setMilliseconds(0);
    return d;
}

export default eventBlueprintActions;