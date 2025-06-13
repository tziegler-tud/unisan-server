import {type IEventBlueprint} from "../types/EventBlueprint"

export default class EventBlueprintProfile
{
    private eventId: number;
    private event: IEventBlueprint

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

    _getEventFromServer(): Promise<IEventBlueprint> {
        let url = "/api/v1/eventfactory/" + this.eventId;
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

    async refreshEvent() : Promise<IEventBlueprint>{
        await this._getEventFromServer();
        return this.event;
    }
}