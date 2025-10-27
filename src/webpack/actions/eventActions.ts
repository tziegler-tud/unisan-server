import type {ShowPostingConfirmPayload} from "../sidebar/plugins/plugin-event";
import {IEvent, IPosition, IPostingAllowed} from "../types/Event";

interface AddPostingActionPayload {
    description: string,
    allowHigher: boolean,
    optional: boolean,
    enabled: boolean,
    startTime: string,
    endTime: string,
    date?: Date,
    requiredQualifications: number[]
}

interface UpdatePostingActionPayload {
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

interface UpdatePostingApiPayload {
    id: number|string,
    description: string,
    allowHigher: boolean,
    optional: boolean,
    enabled: boolean,
    date: {
        startDate: number,
        endDate: number,
    },
    requiredQualifications: number[]
}

interface AddPostingApiPayload {
    description: string,
    allowHigher: boolean,
    optional: boolean,
    enabled: boolean,
    date: {
        startDate: number,
        endDate: number,
    },
    requiredQualifications: number[]

}

const baseUrl =  "/api/v1/eventmod"

interface EventActions {
    getEvents(params: {
        matchString?: string;
        startDate?: number;
        endDate?: number;
        sort?: string;
    }): Promise<IEvent[]>;
    getUserEvents(params: {
        userId: string,
        matchString?: string;
        startDate?: number;
        endDate?: number;
        sort?: string;
        amount?: number;
    }): Promise<IEvent[]>;
    addEvent(args: {
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
    deleteEvent(eventid: string, callback?: (result: any) => void): JQuery.jqXHR;
    uploadImage(eventid: string): JQuery.jqXHR;
    addParticipant(eventid: string, userid: string, callback?: (result: any) => void): JQuery.jqXHR;
    changeParticipant(eventid: string, userid: string, role: any, callback?: () => void): JQuery.jqXHR; // Define role type
    removeParticipant(eventid: string, userid: string, callback?: (result: any) => void): JQuery.jqXHR;
    addPosting(eventId: string, postingData: AddPostingActionPayload, callback?: (result: any) => void, args?: {}): JQuery.jqXHR; // Define postingData type
    updatePosting(id: string|number, postingData: UpdatePostingActionPayload, callback?: { onSuccess?: (result: any) => void, onError?: (jqXHR: JQuery.jqXHR,  textStatus: string,  errorThrown: string ) => void }): JQuery.jqXHR;
    removePosting(id: string|number, postingId: string, callback?: { onSuccess?: (result: any) => void }): JQuery.jqXHR;
    assignPost(eventId: string, postingId: string, userId: string, callback: { onSuccess?: (result: any) => void, onError?: (jqXHR: JQuery.jqXHR,  textStatus: string,  errorThrown: string ) => void }): JQuery.jqXHR;
    unassignPost(eventId: string, postingId: string, userId: string, callback?: { onSuccess?: (result: any) => void, onError?: (jqXHR: JQuery.jqXHR,  textStatus: string,  errorThrown: string ) => void }): JQuery.jqXHR;
    saveTitle(id: string, data: { delta: any; value: string }, callback?: { onSuccess?: (result: any) => void }): JQuery.jqXHR; // Define delta type
    saveDescription(id: string, data: { longDesc: any; shortDesc: any }, callback?: { onSuccess?: (result: any) => void }): JQuery.jqXHR; // Define desc types
    saveDelta(id: string, delta: any, callback?: { onSuccess?: (result: any) => void }): JQuery.jqXHR; // Define delta type
    updateDate(id: string, args: { date: string; startTime: string; endTime: string }, callback?: { onSuccess?: (result: any) => void }): JQuery.jqXHR;
    updateKey(id: string, key: string, value: any, callback?: { onSuccess?: (result: any) => void }): JQuery.jqXHR;
    uploadFileToStorage(id: string, filename: string, file: any, callback?: (result: any) => any): JQuery.jqXHR;
    deleteFileFromStorage(id: string, uniqueFileId: string, callback?: { onSuccess?: (result: any) => void }): void;

    addPosition(id: string, positionData: IPosition, callback?: { onSuccess?: (result: any) => void, onError?: (jqXHR: JQuery.jqXHR,  textStatus: string,  errorThrown: string ) => void }): JQuery.jqXHR;
    updatePosition(id: string, positionData: IPosition, callback?: { onSuccess?: (result: any) => void, onError?: (jqXHR: JQuery.jqXHR,  textStatus: string,  errorThrown: string ) => void }): JQuery.jqXHR;
    removePosition(id: string, positionId: string, callback?: { onSuccess?: (result: any) => void, onError?: (jqXHR: JQuery.jqXHR,  textStatus: string,  errorThrown: string ) => void }): JQuery.jqXHR;

    assignPostingToPosition(id: string, postingId: string, positionId: string, callback?: { onSuccess?: (result: any) => void, onError?: (jqXHR: JQuery.jqXHR,  textStatus: string,  errorThrown: string ) => void }): Promise<void>

    checkUserForAssignment(eventId: string, userId: string, postingId: string, callback?: { onSuccess?: (result: any) => void, onError?: (jqXHR: JQuery.jqXHR,  textStatus: string,  errorThrown: string ) => void }): JQuery.jqXHR;
    checkUserForAssignmentAsync(eventId: string, userId: string, postingId: string): Promise<IPostingAllowed>

}

const eventActions: EventActions = {
    async getEvents({
                        matchString = "",
                        startDate,
                        endDate
                    }: {
        matchString?: string;
        startDate?: number;
        endDate?: number;
        sort?: string;
    }): Promise<IEvent[]> {
        const data = {
            filter: matchString,
            args: {
                startDate,
                endDate,
            },
        };

        return new Promise((resolve, reject) => {
            $.ajax({
                url: "/api/v1/eventmod/filter/",
                type: "POST",
                contentType: "application/json; charset=UTF-8",
                dataType: "json",
                data: JSON.stringify(data),
                success: (events: IEvent[]) => resolve(events),
                error: (XMLHttpRequest: any, textStatus: string, errorThrown: any) => {
                    console.error(`AJAX error: ${XMLHttpRequest.status} ${XMLHttpRequest.statusText}`);
                    reject(errorThrown);
                },
            });
        });
    },

    async getUserEvents({
                        userId,
                        matchString = "",
                        startDate,
                        endDate,
                        sort,
                        amount
                    }: {
        userId: string;
        matchString?: string;
        startDate?: number;
        endDate?: number;
        sort?: string;
        amount?: number;
    }): Promise<IEvent[]> {
        const data = {
            userid: userId,
            matchString,
            startDate,
            endDate,
            sort,
            amount
        };

        return new Promise((resolve, reject) => {
            $.ajax({
                url: "/api/v1/eventmod/userevents/",
                type: 'POST',
                contentType: "application/json; charset=UTF-8",
                dataType: 'json',
                data: JSON.stringify(data),
                success: (events: IEvent[]) => resolve(events),
                error: (XMLHttpRequest, textStatus, errorThrown) => {
                    console.error(`AJAX error: ${XMLHttpRequest.status} ${XMLHttpRequest.statusText}`);
                    reject(errorThrown);
                }
            });
        });
    },

    addEvent: function(args) {
        const startDate = parseHTMLInputDate(args.date, args.startTime).getTime();
        const endDate = parseHTMLInputDate(args.date, args.endTime).getTime();

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
            url: "/api/v1/eventmod/create",
            type: "POST",
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(data),
            success: function(result: any) {
                if (result.id) {
                    location.replace("/events/" + result.id);
                } else location.replace("/events");
            },
        });
    },

    deleteEvent: function(eventid, callback?) {
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

    uploadImage: function(eventid) {
        return $.ajax({
            url: `${baseUrl}/${eventid}/uploadUserImage`,
            type: "POST",
            success: function(result: any) {
                alert("Event " + eventid + " image updated");
                window.location.replace("/events/view/" + eventid);
            },
        });
    },

    addParticipant: function(eventid, userid, callback) {
        callback = callback == null ? function() { } : callback;
        const data = {
            userId: userid,
            args: {},
        };
        return $.ajax({
            url: `${baseUrl}/${eventid}/addParticipant`,
            type: "POST",
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(data),
            success: function(result: any) {
                callback(result);
            },
        });
    },

    changeParticipant: function(eventid, userid, role, callback) {
        callback = callback == null ? function() { } : callback;
        const data = {
            userId: userid,
            role: role,
            args: {},
        };
        return $.ajax({
            url: `${baseUrl}/${eventid}/changeParticipant`,
            type: "POST",
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(data),
            success: function(result: any) {
                callback();
            },
        });
    },

    removeParticipant: function(eventid, userid, callback) {
        callback = callback == null ? function() { } : callback;
        const data = {
            id: eventid,
            userId: userid,
            args: {},
        };
        return $.ajax({
            url: `${baseUrl}/${eventid}/removeParticipant`,
            type: "POST",
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(data),
            success: function(result: any) {
                callback(result);
            },
        });
    },

    addPosting: function(eventId, postingData, callback, args) {
        callback = callback == null ? function() { } : callback;

        const startDate = parseHTMLInputTime(postingData.startTime, postingData.date).getTime();
        const endDate = parseHTMLInputTime(postingData.endTime, postingData.date).getTime();


        let posting: AddPostingApiPayload = {
            description: postingData.description,
            allowHigher: postingData.allowHigher,
            optional: postingData.optional,
            enabled: postingData.enabled,
            requiredQualifications: postingData.requiredQualifications,
            date: {
                startDate: startDate,
                endDate: endDate,
            }
        }

        const data = {
            eventId: eventId,
            posting: posting,
            args: {},
        };
        return $.ajax({
            url: `${baseUrl}/${eventId}/addPost`,
            type: "PUT",
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(data),
            success: function(result: any) {
                callback(result);
            },
        });
    },

    updatePosting: function(eventId, postingData, callback) {
        if (callback === undefined) callback = {};
        if (callback.onSuccess === undefined) callback.onSuccess = function() { };

        const startDate = parseHTMLInputTime(postingData.startTime, postingData.date,).getTime();
        const endDate = parseHTMLInputTime(postingData.endTime, postingData.date).getTime();

        let posting: UpdatePostingApiPayload = {
            id: postingData.id,
            description: postingData.description,
            allowHigher: postingData.allowHigher,
            optional: postingData.optional,
            enabled: postingData.enabled,
            requiredQualifications: postingData.requiredQualifications,
            date: {
                startDate: startDate,
                endDate: endDate,
            }
        }
        const data = {
            eventId: eventId,
            posting: posting,
            args: {},
        };

        return $.ajax({
            url: `${baseUrl}/${eventId}/updatePost`,
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

    removePosting: function(eventId, postingId, callback) {
        if (callback === undefined) callback = {};
        if (callback.onSuccess === undefined) callback.onSuccess = function() { };
        const data = {
            id: eventId,
            postingId: postingId,
            args: {},
        };
        return $.ajax({
            url: `${baseUrl}/${eventId}/removePost`,
            type: "DELETE",
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(data),
            success: function(result: any) {
                callback.onSuccess(result);
            },
        });
    },

    assignPost: function(eventId, postingId, userId, callback?: {
        onSuccess?: (result: any) => void;
        onError?: (jqXHR: JQuery.jqXHR, textStatus: string, errorThrown: string) => void
    }) : JQuery.jqXHR {

        if (callback === undefined) callback = {};
        if (callback.onSuccess === undefined) callback.onSuccess = function() { };
        if (callback.onError === undefined) callback.onError = function() { };

        const data = {
            id: eventId,
            postingId: postingId,
            userId: userId,
            args: {},
        };
        return $.ajax({
            url: `${baseUrl}/${eventId}/assignPost`,
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

    unassignPost: function(eventId, postingId, userId, callback?: {
        onSuccess?: (result: any) => void;
        onError?: (jqXHR: JQuery.jqXHR, textStatus: string, errorThrown: string) => void
    }) : JQuery.jqXHR {
        const data = {
            id: eventId,
            postingId: postingId,
            userId: userId,
            args: {},
        };
        return $.ajax({
            url: `${baseUrl}/${eventId}/unassignPost`,
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

    saveTitle: function(id, data, callback) {
        if (callback === undefined) callback = {};
        if (callback.onSuccess === undefined) callback.onSuccess = function() { };
        const postData = {
            delta: data.delta,
            value: data.value,
        };
        return $.ajax({
            url: "/api/v1/eventmod/updateTitle/" + id,
            type: "PUT",
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(postData),
            success: function(result: any) {
                callback.onSuccess(result);
            },
        });
    },
    saveDescription: function(id, data, callback) {
        if (callback === undefined) callback = {};
        if (callback.onSuccess === undefined) callback.onSuccess = function() { };
        const postData = {
            longDesc: data.longDesc,
            shortDesc: data.shortDesc,
        };
        return $.ajax({
            url: "/api/v1/eventmod/updateDescription/" + id,
            type: "PUT",
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(postData),
            success: function(result: any) {
                callback.onSuccess(result);
            },
        });
    },

    saveDelta: function(id, delta, callback) {
        if (callback === undefined) callback = {};
        if (callback.onSuccess === undefined) callback.onSuccess = function() { };
        const data = {
            key: "description.longDesc.delta",
            value: delta,
        };
        return $.ajax({
            url: "/api/v1/eventmod/updateKey/" + id,
            type: "PUT",
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(data),
            success: function(result: any) {
                callback.onSuccess(result);
            },
        });
    },

    updateDate: function(id, args, callback) {
        if (callback === undefined) callback = {};
        if (callback.onSuccess === undefined) callback.onSuccess = function() { };

        const startDate = parseHTMLInputDate(args.date, args.startTime).getTime();
        const endDate = parseHTMLInputDate(args.date, args.endTime).getTime();

        const data = {
            key: "date",
            value: {
                startDate: startDate,
                endDate: endDate,
            },
        };
        return $.ajax({
            url: "/api/v1/eventmod/updateKey/" + id,
            type: "PUT",
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(data),
            success: function(result: any) {
                callback.onSuccess(result);
            },
        });
    },

    updateKey: function(id, key, value, callback) {
        if (callback === undefined) callback = {};
        if (callback.onSuccess === undefined) callback.onSuccess = function() { };
        const data = {
            key: key,
            value: value,
        };
        return $.ajax({
            url: "/api/v1/eventmod/updateKey/" + id,
            type: "PUT",
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(data),
            success: function(result: any) {
                callback.onSuccess(result);
            },
        });
    },
    uploadFileToStorage: function(id, filename, file, callback) {
        return $.ajax({
            url: `${baseUrl}/${id}/uploadFile`,
            type: "POST",
            success: function(result: any) {
                return result;
            },
        });
    },

    deleteFileFromStorage: function(id, uniqueFileId, callback) {
        if (callback === undefined) callback = {};
        if (callback.onSuccess === undefined) callback.onSuccess = function() { };
        $.ajax({
            url: `${baseUrl}/${id}/uploadFile`,
            type: "DELETE",
            contentType: "text/plain",
            data: uniqueFileId,
            success: function(result: any) {
                callback.onSuccess(result);
            },
        });
    },

    addPosition: function(id: string, positionData: IPosition, callback?) {
        if (callback === undefined) callback = {};
        if (callback.onSuccess === undefined) callback.onSuccess = function() { };

        let position: IPosition = {
            title: positionData.title,
            description: positionData.description
        }
        const data = {
            position: position,
            args: {},
        };

        return $.ajax({
            url: `${baseUrl}/${id}/addPosition`,
            type: "PUT",
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

    updatePosition: function(id: string, positionData: IPosition, callback?) {
        if (callback === undefined) callback = {};
        if (callback.onSuccess === undefined) callback.onSuccess = function() { };

        const positionId = positionData._id
        if(!positionId) throw new Error("Invalid arguments received for parameter position.")

        let position: IPosition = {
            title: positionData.title,
            description: positionData.description
        }
        const data = {
            id: positionId,
            position: position,
            args: {},
        };

        return $.ajax({
            url: `${baseUrl}/${id}/updatePosition`,
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

    removePosition: function(id: string, positionId: string, callback?) {
        if (callback === undefined) callback = {};
        if (callback.onSuccess === undefined) callback.onSuccess = function() { };

        if(!positionId) throw new Error("Invalid arguments received for parameter position.")

        const data = {
            id: positionId,
            args: {},
        }

        return $.ajax({
            url: `${baseUrl}/${id}/removePosition`,
            type: "DELETE",
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

    assignPostingToPosition: function(id: string, postingId: string, positionId: string, callback?: {
        onSuccess?: (result: any) => void;
        onError?: (jqXHR: JQuery.jqXHR, textStatus: string, errorThrown: string) => void
    }): Promise<void> {

        if (callback === undefined) callback = {};
        if (callback.onSuccess === undefined) callback.onSuccess = function() { };
        if (callback.onError === undefined) callback.onError = function() { };

        if(!id) throw new Error("Invalid arguments received for parameter position.")
        if(!positionId) throw new Error("Invalid arguments received for parameter position.")
        if(!postingId) throw new Error("Invalid arguments received for parameter position.")

        const data = {
            posting: postingId,
            position: positionId,
            args: {},
        }

        return new Promise((resolve, reject) => {
            $.ajax({
                url: `${baseUrl}/${id}/assignPosition`,
                type: "POST",
                contentType: "application/json; charset=UTF-8",
                dataType: "json",
                data: JSON.stringify(data),
                success: function(result: any) {
                    // callback.onSuccess(result);
                    resolve()
                },
                error: function(jqXHR: JQuery.jqXHR,  textStatus: string,  errorThrown: string ) {
                    // callback.onError(jqXHR, textStatus, errorThrown)
                    reject(new Error(textStatus))
                }
            });
        })
    },

    checkUserForAssignment(eventId: string, userId: string, postingId: string, callback?: {
        onSuccess?: (result: any) => void;
        onError?: (jqXHR: JQuery.jqXHR, textStatus: string, errorThrown: string) => void
    }) : JQuery.jqXHR {

        if (callback === undefined) callback = {};
        if (callback.onSuccess === undefined) callback.onSuccess = function() { };
        if (callback.onError === undefined) callback.onError = function() { };

        if(!eventId) throw new Error("Invalid arguments received for parameter position.")
        if(!userId) throw new Error("Invalid arguments received for parameter position.")
        if(!postingId) throw new Error("Invalid arguments received for parameter position.")

        const data = {
            eventId: eventId,
            userId: userId,
            postingId: postingId,
            args: {},
        }

        return $.ajax({
            url: `${baseUrl}/${eventId}/checkUserForAssignment`,
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

    checkUserForAssignmentAsync(eventId: string, userId: string, postingId: string): Promise<IPostingAllowed> {

        if(!eventId) throw new Error("Invalid arguments received for parameter position.")
        if(!userId) throw new Error("Invalid arguments received for parameter position.")
        if(!postingId) throw new Error("Invalid arguments received for parameter position.")

        const data = {
            eventId: eventId,
            userId: userId,
            postingId: postingId,
            args: {},
        }

        return new Promise((resolve, reject) => {
            $.ajax({
                url: `${baseUrl}/${eventId}/checkUserForAssignment`,
                type: "POST",
                contentType: "application/json; charset=UTF-8",
                dataType: "json",
                data: JSON.stringify(data),
                success: function(result: any) {
                    resolve(result)
                },
                error: function(jqXHR: JQuery.jqXHR,  textStatus: string,  errorThrown: string ) {
                    reject(new Error(`${jqXHR.status}: ${jqXHR.responseText}`))
                }
            });
        })
    }

};

/**
 *
 * @param {String} date YYYY-MM-DD
 * @param {String} time hh:mm
 * @returns {Date}
 */
function parseHTMLInputDate(date: string, time: string): Date {
    const dateYear = parseInt(date.substr(0, 4));
    const dateMonth = parseInt(date.substr(5, 2)) - 1;
    const dateDay = parseInt(date.substr(8, 2));

    const timeHours = parseInt(time.substr(0, 2));
    const timeMinutes = parseInt(time.substr(3, 2));

    const d = new Date();
    d.setFullYear(dateYear);
    d.setMonth(dateMonth);
    d.setDate(dateDay);
    d.setHours(timeHours);
    d.setMinutes(timeMinutes);
    d.setSeconds(0);
    d.setMilliseconds(0);
    return d;
}

/**
 *
 * @param {String} time hh:mm
 * @param {Date} date optional date
 * @returns {Date}
 */
function parseHTMLInputTime(time: string, date?: Date): Date {

    const timeHours = parseInt(time.substr(0, 2));
    const timeMinutes = parseInt(time.substr(3, 2));

    const d = date? new Date(date): new Date();
    d.setHours(timeHours);
    d.setMinutes(timeMinutes);
    d.setSeconds(0);
    d.setMilliseconds(0);
    return d;
}


export default eventActions;