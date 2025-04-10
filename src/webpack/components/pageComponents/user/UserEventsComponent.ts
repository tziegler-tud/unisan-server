import ComponentPage from "../../ComponentPage";
import Component from "../../Component";
import Searchbar from "../../../searchbar/SearchBar";
import ScrollableList, {ScrollableListArgs} from '../../../scrollableList/ScrollableList';

interface TsEvent {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
}

interface ComponentArgs {
    page: ComponentPage;
    section: any;
    componentId: string;
    pageData?: any;
    data?: {
        user: any;
        targetUser: string | object;
    };
    args?: any;
}

interface SearchbarArgs {
    onInput: {
        enabled: boolean;
        callback: (inputValue: string) => Promise<void>;
    };
}

interface ScrollableListCallback {
    listItem: {
        onClick: (e: MouseEvent) => void;
    };
}

export default class UserEventsComponent extends Component {
    /**
     *
     * @param options {ComponentArgs} Component initialization options
     * @constructor
     */
    constructor({
                    page,
                    section,
                    componentId,
                    pageData = {},
                    data,
                    args = {}
                }: ComponentArgs) {
        super({ page, section, componentId, pageData, data, args });

        if (this.data.targetUser === "current") {
            this.data.targetUser = this.data.user;
        }

        if (this.data.targetUser === undefined) {
            throw new Error("Invalid Arguments received: targetUser cannot be undefined.");
        }

        this.templateUrl = "/webpack/components/templates/user/UserEvents.hbs";
    }

    private targetUserId!: string;
    private viewConfig!: { sort: string; order: string };
    private upcomingList: ScrollableList | null;
    private pastList: ScrollableList | null;
    private eventData!: {
        upcoming: TsEvent[];
        past: TsEvent[];
    };
    private upcomingListContainer: HTMLElement | null;
    private pastListContainer: HTMLElement | null;
    private searchbarUpcoming!: Searchbar;
    private searchbarPast!: Searchbar;

    async postRender(): Promise<void> {
        this.targetUserId = this.data.targetUser.id.toString();
        this.viewConfig = { sort: "date.startDate", order: "desc" };
        this.upcomingList = null;
        this.pastList = null;
        this.eventData = { upcoming: [], past: [] };
        this.upcomingListContainer = document.getElementById('eventlist-container--upcoming');
        this.pastListContainer = document.getElementById('eventlist-container--past');
        const searchbarContainerUpcoming: HTMLElement | null = document.getElementById("eventsearch--upcoming");
        const searchbarContainerPast: HTMLElement | null = document.getElementById("eventsearch--past");

        // Setup searchbars
        this.searchbarUpcoming = new Searchbar(searchbarContainerUpcoming, {
            onInput: {
                enabled: true,
                callback: async (inputValue: string) => {
                    try {
                        this.eventData.upcoming = await this.getUpcomingEvents(inputValue);
                        this.showUpcoming();
                    } catch (err) {
                        console.error(err);
                    }
                }
            }
        });

        this.searchbarPast = new Searchbar(searchbarContainerPast, {
            onInput: {
                enabled: true,
                callback: async (inputValue: string) => {
                    try {
                        this.eventData.past = await this.getPastEvents(inputValue);
                        this.showPast();
                    } catch (err) {
                        console.error(err);
                    }
                }
            }
        });

        this.eventData.upcoming = await this.getUpcomingEvents();
        this.eventData.past = await this.getPastEvents();

        this.showUpcoming();
        this.showPast();
    }

    getHtml(): string {
        return this.html;
    }

    showUpcoming() {
        const upcoming = this.eventData.upcoming;
        this.upcomingList = this.displayEventList(upcoming, this.upcomingListContainer, this.viewConfig.sort, 1);
        // this.searchbarUpcoming.show();
    }

    showPast() {
        const past = this.eventData.past;
        this.pastList = this.displayEventList(past, this.pastListContainer, this.viewConfig.sort, -1);
        // this.searchbarPast.show();
    }

    async getPastEvents(matchString: string = ""): Promise<TsEvent[]> {
        const endDate = Date.now();
        return this.getEvents({
            userId: this.targetUserId,
            matchString,
            endDate,
            amount: 5
        });
    }

    async getUpcomingEvents(matchString: string = ""): Promise<TsEvent[]> {
        const startDate = Date.now();
        return this.getEvents({
            userId: this.targetUserId,
            matchString,
            startDate
        });
    }

    async getEvents({
                        userId,
                        matchString = "",
                        startDate,
                        endDate,
                        sort = this.viewConfig.sort,
                        amount
                    }: {
        userId: string;
        matchString?: string;
        startDate?: number;
        endDate?: number;
        sort?: string;
        amount?: number;
    }): Promise<TsEvent[]> {
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
                success: (events: TsEvent[]) => resolve(events),
                error: (XMLHttpRequest, textStatus, errorThrown) => {
                    console.error(`AJAX error: ${XMLHttpRequest.status} ${XMLHttpRequest.statusText}`);
                    reject(errorThrown);
                }
            });
        });
    }

    displayEventList(
        events: TsEvent[],
        container: HTMLElement | null,
        sort: string = "date.startDate",
        direction: number = 1
    ): ScrollableList {
        const args: ScrollableListArgs = {
            enableSorting: true,
            enableMobile: true,
            hasTitle: false,
            title: "",
            height: "fixed",
            fixedHeight: "500px",
            sorting: {
                property: sort,
                direction: direction
            }
        };

        const callback: ScrollableListCallback = {
            listItem: {
                onClick: (e: MouseEvent) => {
                    const target = e.currentTarget;
                    e.preventDefault();
                    if(target instanceof HTMLElement && target.dataset.id !== undefined) {
                        window.location.href = `/unisams/events/view/${target.dataset.id}`;
                    }
                }
            }
        };

        return new ScrollableList(container, "event", events, args, callback);
    }
}