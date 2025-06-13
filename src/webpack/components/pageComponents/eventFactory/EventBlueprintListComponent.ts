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

export default class EventBlueprintListComponent extends Component {
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

        this.data.targetUser = this.data.user;
        this.templateUrl = "/webpack/components/templates/eventfactory/list.hbs";
    }

    private viewConfig!: { sort: string; order: string };
    private list: ScrollableList | null;
    private eventData!: {
        list: TsEvent[];
    };
    private listContainer: HTMLElement | null;
    private searchbar!: Searchbar;


    async postRender(): Promise<void> {
        this.viewConfig = { sort: "date.startDate", order: "desc" };
        this.list = null;
        this.eventData = { list: [] };
        this.listContainer = document.getElementById('eventlist-container');
        const searchbarContainer: HTMLElement | null = document.getElementById("eventsearch");

        this.searchbar = new Searchbar(searchbarContainer, {
            onInput: {
                enabled: true,
                callback: async (inputValue: string) => {
                    try {
                        this.eventData.list = await this.getEventBlueprints(inputValue);
                        this.showList();
                    } catch (err) {
                        console.error(err);
                    }
                }
            }
        });

        this.eventData.list = await this.getEventBlueprints();

        this.showList();
    }

    getHtml(): string {
        return this.html;
    }


    showList() {
        const list = this.eventData.list;
        this.list = this.displayEventList(list, this.listContainer, this.viewConfig.sort, -1);
        // this.searchbarPast.show();
    }

    async getEventBlueprints(matchString: string = ""): Promise<TsEvent[]> {
        const endDate = Date.now();
        return this.getEvents({
            matchString
        });
    }

    async getEvents({
                        matchString = "",
                        sort = this.viewConfig.sort,
                        amount
                    }: {
        matchString?: string;
        sort?: string;
        amount?: number;
    }): Promise<TsEvent[]> {
        const data = {
            filter: matchString,
            amount: amount
        };

        return new Promise((resolve, reject) => {
            $.ajax({
                url: "/api/v1/eventfactory/filter",
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
            height: "full",
            // fixedHeight: "500px",
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
                        window.location.href = `/unisams/eventfactory/${target.dataset.id}`;
                    }
                }
            }
        };

        return new ScrollableList(container, "event", events, args, callback);
    }
}