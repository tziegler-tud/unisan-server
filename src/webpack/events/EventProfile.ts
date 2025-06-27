import {type IEvent} from "../types/Event"
import {IUser} from "../types/User";

export default class EventProfile
{
    private eventId: number;
    private event: IEvent

    constructor(id: number) {
        this.eventId = id;
    }

    async getEvent() {
        if(this.event) return this.event
        else {
            await this._getEventFromServer()
            return this.event;
        }
    }

    _getEventFromServer(): Promise<IEvent> {
        let url = "/api/v1/eventmod/" + this.eventId + "/populateParticipants";
        return new Promise((resolve, reject) => {
            $.ajax(url, {
                type: 'GET',
                cache: false,
                data: {},
                success: (context) => {
                    this.event = context;
                    resolve(context);
                },
                error: (context) => {
                    reject(context);
                }
            });
        })
    }

    async refreshEvent() : Promise<IEvent>{
        await this._getEventFromServer();
        return this.event;
    }

    checkIfUserIsRegistered(user: IUser, args: {role: string}){
        if (args === undefined) args = {
            role: "any",
        };
        var index = -1;
        let event = this.event
        // create array of participants by id
        try {
            //check if array contains elements
            if (event.participants.length > 0) {
                if (args.role === "any"){
                    index = event.participants.findIndex(e => {
                        return (e.user._id.toString() === user.id)
                    });
                }
                else {
                    index = event.participants.findIndex(e => {
                        return (e.user._id.toString() === user.id && e.role.toString() === args.role)
                    });
                }
            }
            //false if no user are registered
            else return false;
        }
        catch (e) {
            if (e instanceof TypeError) {
                console.error("Exception:" + e);
                console.error("Aborting operation to ensure data integrity.");
                throw e;
            } else {
                console.error("Unhandled exception: " + e);
                throw e;
            }
        }
        return index > -1;
    }
}