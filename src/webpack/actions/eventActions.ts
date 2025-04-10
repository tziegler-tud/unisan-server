export interface Event {
    id: string;
    title: {
        value: string;
    };
    date: {
        startDate: Date;
        endDate: Date;
    };
    dateRangeString: string;
    type: {
        index: number;
        title: string;
        value: string;
    };
}

interface EventActions {
    getEvents(params: {
        matchString?: string;
        startDate?: number;
        endDate?: number;
        sort?: string;
    }): Promise<Event[]>;
    getUserEvents(params: {
        userId: string,
        matchString?: string;
        startDate?: number;
        endDate?: number;
        sort?: string;
        amount?: number;
    }): Promise<Event[]>;
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
    addPosting(eventId: string, postingData: any, callback?: (result: any) => void, args?: { date: string; startTime: string; endTime: string }): JQuery.jqXHR; // Define postingData type
    updatePosting(eventId: string, postingData: any, callback?: (result: any) => void, args?: { date: string; startTime: string; endTime: string }): JQuery.jqXHR; // Define postingData type
    removePosting(eventId: string, postingId: string, callback?: (result: any) => void): JQuery.jqXHR;
    assignPost(eventId: string, postingId: string, userId: string, callback?: (result: any) => void): JQuery.jqXHR;
    unassignPost(eventId: string, postingId: string, userId: string, callback?: (result: any) => void): JQuery.jqXHR;
    saveTitle(id: string, data: { delta: any; value: string }, callback?: { onSuccess?: (result: any) => void }): JQuery.jqXHR; // Define delta type
    saveDescription(id: string, data: { longDesc: any; shortDesc: any }, callback?: { onSuccess?: (result: any) => void }): JQuery.jqXHR; // Define desc types
    saveDelta(id: string, delta: any, callback?: { onSuccess?: (result: any) => void }): JQuery.jqXHR; // Define delta type
    updateDate(id: string, args: { date: string; startTime: string; endTime: string }, callback?: { onSuccess?: (result: any) => void }): JQuery.jqXHR;
    updateKey(id: string, key: string, value: any, callback?: { onSuccess?: (result: any) => void }): JQuery.jqXHR;
    uploadFileToStorage(id: string, filename: string, file: any, callback?: (result: any) => any): JQuery.jqXHR;
    deleteFileFromStorage(id: string, uniqueFileId: string, callback?: { onSuccess?: (result: any) => void }): void;
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
    }): Promise<Event[]> {
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
                success: (events: Event[]) => resolve(events),
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
    }): Promise<Event[]> {
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
                success: (events: Event[]) => resolve(events),
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

    deleteEvent: function(eventid, callback) {
        callback = callback == null ? function() {
            alert("event " + eventid + " deleted.");
            window.location.replace("/events");
        } : callback;

        return $.ajax({
            url: "/api/v1/eventmod/" + eventid,
            type: "DELETE",
            success: function(result: any) {
                callback(result);
            },
        });
    },

    uploadImage: function(eventid) {
        return $.ajax({
            url: "/api/v1/eventmod/" + eventid + "/uploadUserImage",
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
            id: eventid,
            userId: userid,
            args: {},
        };
        return $.ajax({
            url: "/api/v1/eventmod/addParticipant",
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
            id: eventid,
            userId: userid,
            role: role,
            args: {},
        };
        return $.ajax({
            url: "/api/v1/eventmod/changeParticipant",
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
            url: "/api/v1/eventmod/removeParticipant",
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

        const startDate = parseHTMLInputDate(args.date, args.startTime).getTime();
        const endDate = parseHTMLInputDate(args.date, args.endTime).getTime();

        postingData.date = {
            startDate: startDate,
            endDate: endDate,
        };

        const data = {
            id: eventId,
            posting: postingData,
            args: {},
        };
        return $.ajax({
            url: "/api/v1/eventmod/addPost",
            type: "PUT",
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(data),
            success: function(result: any) {
                callback(result);
            },
        });
    },

    updatePosting: function(eventId, postingData, callback, args) {
        callback = callback == null ? function() { } : callback;

        const startDate = parseHTMLInputDate(args.date, args.startTime).getTime();
        const endDate = parseHTMLInputDate(args.date, args.endTime).getTime();

        postingData.date = {
            startDate: startDate,
            endDate: endDate,
        };
        const data = {
            id: eventId,
            posting: postingData,
            args: {},
        };

        return $.ajax({
            url: "/api/v1/eventmod/updatePost",
            type: "POST",
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(data),
            success: function(result: any) {
                callback(result);
            },
        });
    },

    removePosting: function(eventId, postingId, callback) {
        callback = callback == null ? function() { } : callback;
        const data = {
            id: eventId,
            postingId: postingId,
            args: {},
        };
        return $.ajax({
            url: "/api/v1/eventmod/removePost",
            type: "DELETE",
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(data),
            success: function(result: any) {
                callback(result);
            },
        });
    },

    assignPost: function(eventId, postingId, userId, callback) {
        callback = callback == null ? function() { } : callback;
        const data = {
            id: eventId,
            postingId: postingId,
            userId: userId,
            args: {},
        };
        return $.ajax({
            url: "/api/v1/eventmod/assignPost",
            type: "POST",
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(data),
            success: function(result: any) {
                callback(result);
            },
        });
    },

    unassignPost: function(eventId, postingId, userId, callback) {
        callback = callback == null ? function() { } : callback;
        const data = {
            id: eventId,
            postingId: postingId,
            userId: userId,
            args: {},
        };
        return $.ajax({
            url: "/api/v1/eventmod/unassignPost",
            type: "POST",
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(data),
            success: function(result: any) {
                callback(result);
            },
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
            url: "/api/v1/eventmod/" + id + "/uploadFile",
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
            url: "/api/v1/eventmod/" + id + "/uploadFile",
            type: "DELETE",
            contentType: "text/plain",
            data: uniqueFileId,
            success: function(result: any) {
                callback.onSuccess(result);
            },
        });
    },
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

export default eventActions;