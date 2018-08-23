class AppComponent extends React.Component {
    static appId = "6ad153b2";
    static appKey = "47c1c4957a01401be106bfadbb5bc779";
    static apiUrl = "https://api.flightstats.com/flex/flightstatus/rest/v2/jsonp";
    static requestTypes = [
        "flight",
        "airport"
    ];
    static flightTypes = [
        "arr",
        "dep"
    ];
    static days = [
        "today",
        "tomorrow",
        "aftertomorrow"
    ];
    static flightTimings = [
        "all",
        "delayed"
    ];
    static airportCode = "GYD";
    static utc = "false";
    static defaultValues = {
        "requestType": "airport",
        "flightType": "dep",
        "flightDate": new Date(),
        "anytime": true,
        "time": "0",
        "numHours": 6,
        "showDelayedOnly": false,
        "search": "",
        "searchCode": "",
        "searchNumber": "",
        "hasErrors": false
    }

    constructor() {
        super();
        this.requestType = AppComponent.defaultValues["requestType"];
        this.flightType = AppComponent.defaultValues["flightType"];
        this.flightDate = AppComponent.defaultValues["flightDate"];
        this.anytime = AppComponent.defaultValues["anytime"];
        this.time = AppComponent.defaultValues["time"];
        this.numHours = AppComponent.defaultValues["numHours"];
        this.showDelayedOnly = AppComponent.defaultValues["showDelayedOnly"];
        this.search = "";
        this.searchCode = AppComponent.defaultValues["searchCode"];
        this.searchNumber = AppComponent.defaultValues["searchNumber"];
        this.hasErrors = AppComponent.defaultValues["hasErrors"];
        this.state = {
            isLoaded: false,
            flightTables: [],
            flightTablesCount: 0,
            errors: []
        }
        this.loadFlights = this.loadFlights.bind(this);
        this.prepareRequestUrl = this.prepareRequestUrl.bind(this);
        this.fetchData = this.fetchData.bind(this);
        this.compareParamsWithCurrent = this.compareParamsWithCurrent.bind(this);
        this.setDefaultParams = this.setDefaultParams.bind(this);
        this.setNewParams = this.setNewParams.bind(this);
        this.checkParams = this.checkParams.bind(this);
        this.submitHandlerFromFilter = this.submitHandlerFromFilter.bind(this);
        this.resetHandlerFromFilter = this.resetHandlerFromFilter.bind(this);
        this.addErrors = this.addErrors.bind(this);
        this.loadMore = this.loadMore.bind(this);
    }

    async componentDidMount() {
        const searchString = window.location.search;
        if (searchString.length > 0) {
            const urlSearchParams = new URLSearchParams(document.location.search);
            let params = {};
            for (var pair of urlSearchParams.entries()) {
                params[pair[0]] = pair[1];
            }
            const checkResult = this.checkParams(params);
            if (!checkResult.isValid) {
                return this.addErrors(checkResult.error);
            }
            this.setNewParams(params);
        }
        await this.loadFlights();
    }

    prepareRequestUrl() {
        let url = new URL(AppComponent.apiUrl);
        if (this.requestType == "airport") {
            url.patchAppend(
                "airport",
                AppComponent.airportCode,
                this.flightType,
                this.flightDate,
                this.time);
            url.searchParams.set("numHours", this.numHours.toString());
        } else if (this.requestType == "flight") {
            url.patchAppend(
                "flight",
                this.searchCode + "/" + this.searchNumber,
                this.flightType,
                this.flightDate);
            url.searchParams.set("airport", AppComponent.airportCode);
        }
        url.searchParams.set("appId", AppComponent.appId);
        url.searchParams.set("appKey", AppComponent.appKey);
        url.searchParams.set("utc", AppComponent.utc);
        console.log(url.href);
        return url.href;
    }

    async fetchData() {
        const requestString = this.prepareRequestUrl();
        return await fetchJsonp(requestString);
    }

    async submitHandlerFromFilter(params) {
        const checkResult = this.checkParams(params)
        if (!checkResult.isValid) {
            return this.addErrors(checkResult.error)
        }
        this.setNewParams(params);
        await this.loadFlights()
    }

    async resetHandlerFromFilter() {
        let areCurrentParamsDefault = this.compareParamsWithCurrent(AppComponent.defaultValues);
        if (!areCurrentParamsDefault) {
            this.setDefaultParams();
            await this.loadFlights();
        }
    }

    checkParams(params) {
        let result = {
            isValid: true,
            error: null
        };
        const paramKeys = Object.keys(params);
        const validKeyValues = [
            "flightType",
            "day",
            "time",
            "flightTiming",
            "search"
        ]
        const found = paramKeys.some(r => validKeyValues.includes(r));
        if (!found) {
            this.hasErrors = true;
            result.isValid = false;
            result.error = <Nostification title="Error" message="Param name is not correct"/>;
            return result;
        }
        if (params.hasOwnProperty("flightType")) {
            if (!AppComponent.flightTypes.includes(params["flightType"])) {
                result.error = <Nostification title="Error" message="Flight type is not correct"/>;
                result.isValid = false;
                return result;
            }
        }
        if (params.hasOwnProperty("day")) {
            if (!AppComponent.days.includes(params["day"])) {
                this.hasErrors = true;
                result.error = <Nostification title="Error" message="Day is not correct"/>;
                result.isValid = false;
                return result;
            }
        }
        if (params.hasOwnProperty("time")) {
            const searchTime = params["time"]
            if (searchTime % 2 !== 0 && searchTime > 22 && searchTime < 0) {
                if (searchTime !== "anytime") {
                    this.hasErrors = true;
                    result.error = <Nostification title="Error" message="Time is not correct"/>;
                    result.isValid = false;
                    return result;
                }
            }
        }
        if (params.hasOwnProperty("flightTiming")) {
            if (!AppComponent.flightTimings.includes(params["flightTiming"])) {
                this.hasErrors = true;
                result.error = <Nostification title="Error" message="Flight timing is not correct"/>;
                result.isValid = false;
                return result;
            }
        }
        if (params.hasOwnProperty("search")) {
            const search = params["search"].replace(/\s+/g, "")
            if (params["search"].length > 0 && search.length === 0) {
                this.hasErrors = true;
                result.isValid = false;
                result.error =
                    <Nostification title="Error" message="Only spaces in search"/>;
                return result;
            }
            if (search.length !== 0) {
                const searchCode = search.match(/\D+/)
                const searchNumber = search.match(/\d+/)
                if (searchCode == null) {
                    this.hasErrors = true;
                    result.isValid = false;
                    result.error =
                        <Nostification title="Error"
                                       message="Invalid flight number. Missing flight number. Example: SU6374"/>;
                    return result;
                }
                if (searchNumber == null) {
                    this.hasErrors = true;
                    result.isValid = false;
                    result.error =
                        <Nostification title="Error"
                                       message="Invalid flight number. Missing flight code. Example: SU6374"/>;
                    return result;
                }
            }
        }
        this.hasErrors = !result.isValid;
        return result;
    }

    compareParamsWithCurrent(params) {
        for (let key in params) {
            if (params[key] !== this[key]) return false;
        }
        return true;
    }

    setNewParams(params) {
        if (params.hasOwnProperty("flightType")) {
            this.flightType = params["flightType"];
        }
        if (params.hasOwnProperty("day")) {
            let date = new Date()
            date.setDate(date.getDate() + AppComponent.days.indexOf(params["day"]));
            this.flightDate = date;
        }
        if (params.hasOwnProperty("time")) {
            const searchTime = params["time"]
            if (searchTime === "anytime") {
                this.anytime = true;
                this.time = "0";
                this.numHours = 6;
            } else {
                this.anytime = false;
                this.time = searchTime;
                this.numHours = 2;
            }
        } else if (this.anytime && this.time !== "0") {
            this.time = "0";
            this.numHours = 6;
        }
        if (params.hasOwnProperty("flightTiming")) {
            if (params["flightTiming"] === "delayed") {
                this.showDelayedOnly = true;
            } else {
                this.showDelayedOnly = false;
            }
        }
        if (params.hasOwnProperty("search")) {
            this.search = params["search"];
            const search = params["search"].replace(/\s+/g, "")

            if (search.length == 0) {
                this.requestType = "airport";
                this.searchCode = "";
                this.searchNumber = "";
            } else {
                const searchCode = search.match(/\D+/)
                const searchNumber = search.match(/\d+/)

                this.requestType = "flight";
                this.searchCode = searchCode;
                this.searchNumber = searchNumber;
            }
        }
    }

    setDefaultParams() {
        for (let key in AppComponent.defaultValues) {
            this[key] = AppComponent.defaultValues[key]
        }
    }

    addErrors(error) {
        this.setState(prevState => ({
            flightTables: [error],
            flightTablesCount: 0,
            isLoaded: true
        }));
    }

    async loadFlights() {
        this.setState({
            isLoaded: false
        });
        const response = await this.fetchData();
        const json = await response.json();

        let flightTable = <FlightList data={json}
                                      flightType={this.flightType}
                                      showDelayedOnly={this.showDelayedOnly}
                                      requestType={this.requestType}
                                      anytime={this.anytime}
                                      time={this.time}/>;
        this.setState(prevState => ({
            flightTables: [flightTable],
            flightTablesCount: 1,
            isLoaded: true
        }));
    }

    async loadMore() {
        this.time = this.state.flightTablesCount * 6;
        const response = await this.fetchData();
        const json = await response.json();

        let flightTable = <FlightList data={json}
                                      flightType={this.flightType}
                                      showDelayedOnly={this.showDelayedOnly}
                                      requestType={this.requestType}
                                      anytime={this.anytime}/>;
        this.setState(prevState => ({
            flightTables: [...prevState.flightTables, flightTable],
            flightTablesCount: (prevState.flightTablesCount + 1) % 4,
            isLoaded: true
        }));

    }

    render() {
        let loadMoreButton = false;

        if (this.anytime &&
            this.requestType == "airport" &&
            !this.hasErrors &&
            (this.time + this.numHours) != 24
        ) loadMoreButton = true;

        if (!this.state.isLoaded) {
            var contant = <Loading/>;
        } else {
            var contant = <FlightsComponent loadMore={this.loadMore}
                                            loadMoreButton={loadMoreButton}>
                {this.state.flightTables}
            </FlightsComponent>
        }

        return (
            [
                <div className="filter">
                    <div className="container">
                        <Filter submitHandlerFromApp={this.submitHandlerFromFilter}
                                resetHandlerFromApp={this.resetHandlerFromFilter}/>
                    </div>
                </div>,
                <div class="main">
                    <div className="container main-container">
                        <div className="flights-table__head">
                            <div className="flights-table__cell table__head__cell">Time</div>
                            <div className="flights-table__cell table__head__cell">City</div>
                            <div className="flights-table__cell table__head__cell">Flight number</div>
                            <div className="flights-table__cell table__head__cell flex-justify-center">Terminal
                            </div>
                            <div className="flights-table__cell table__head__cell flex-justify-center">Status</div>
                        </div>
                        {contant}
                    </div>
                </div>
            ]
        );
    }
}

class Filter extends React.Component {
    static defaultState = {
        search: "",
        day: "today",
        time: "anytime",
        flightTiming: "all",
        flightType: "dep"
    }

    constructor() {
        super();
        const searchParams = new URLSearchParams(document.location.search).entries();

        this.state = {
            search: Filter.defaultState["search"],
            day: Filter.defaultState["day"],
            time: Filter.defaultState["time"],
            flightTiming: Filter.defaultState["flightTiming"],
            flightType: Filter.defaultState["flightType"]
        };

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleReset = this.handleReset.bind(this);
        this.handleSelectChange = this.handleSelectChange.bind(this);
        this.handleSearchInputChange = this.handleSearchInputChange.bind(this);
    }

    componentDidMount(event) {
        const searchString = window.location.search;
        if (searchString.length > 0) {
            this.fillFilterFromUrl();
        }
    }

    handleSubmit(event) {
        event.preventDefault();
        this.props.submitHandlerFromApp(this.state);
        Filter.addParamToUrl("search", this.state.search)
    }

    handleReset(event) {
        event.preventDefault();
        this.setState({
            search: Filter.defaultState["search"],
            day: Filter.defaultState["day"],
            time: Filter.defaultState["time"],
            flightTiming: Filter.defaultState["flightTiming"],
            flightType: Filter.defaultState["flightType"]
        }, function () {
            window.history.pushState("", "", "/");
            this.props.resetHandlerFromApp();
        });
    }

    handleSelectChange(event) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;

        this.setState({
            [name]: value
        }, function () {
            this.props.submitHandlerFromApp(this.state);
            Filter.addParamToUrl(name, value);
        });
    }

    handleSearchInputChange(event) {
        const target = event.target;
        this.setState({
            [target.name]: target.value
        });
    }

    static addParamToUrl(name, value) {
        let theURL = new URL(window.location);
        if (value.toString().length > 0) {
            theURL.searchParams.set(name, value);
        } else {
            theURL.searchParams.delete(name);

        }
        const result = theURL.search.length > 0 ? theURL : "/";
        window.history.pushState("", "", result);

    }

    fillFilterFromUrl() {
        const searchParams = new URLSearchParams(document.location.search).entries();
        for (let pair of searchParams) {
            this.setState({
                [pair[0]]: pair[1]
            });
        }
    }

    render() {
        return (
            <form onSubmit={this.handleSubmit} className="filter-form">
                <div className="filter__items">
                    <div className="filter__item-block filter-search__block">
                        <input name="search"
                               type="text"
                               placeholder="Search by flight number"
                               value={this.state.search}
                               onChange={this.handleSearchInputChange}
                               className="filter__item filter-input filter-input_flight-number"/>
                        <div className="filter-search__buttons">
                            <button type="submit" className="filter__button_search">
                                <i className="icon-magnifying-glass"></i>
                            </button>
                            <button className="filter__button_search" onClick={this.handleReset}>
                                <i className="icon-cross"></i>
                            </button>
                        </div>
                    </div>

                    <div className="filter__item-block filter-select__block">
                        <select name="day"
                                value={this.state.day}
                                onChange={this.handleSelectChange}
                                className="filter__item filter-select">
                            <option value="today">today</option>
                            <option value="tomorrow">tomorrow</option>
                            <option value="aftertomorrow">day after tomorrow</option>
                        </select>
                    </div>
                    <div className="filter__item-block filter-select__block">
                        <select name="time"
                                value={this.state.time}
                                onChange={this.handleSelectChange}
                                className="filter__item filter-select">
                            <option value="anytime">anytime</option>
                            <option value="0">00:00 - 02:00</option>
                            <option value="2">02:00 - 04:00</option>
                            <option value="4">04:00 - 06:00</option>
                            <option value="6">06:00 - 08:00</option>
                            <option value="8">08:00 - 10:00</option>
                            <option value="10">10:00 - 12:00</option>
                            <option value="12">12:00 - 14:00</option>
                            <option value="14">14:00 - 16:00</option>
                            <option value="16">16:00 - 18:00</option>
                            <option value="18">18:00 - 20:00</option>
                            <option value="20">20:00 - 22:00</option>
                            <option value="22">22:00 - 00:00</option>
                        </select>
                    </div>
                    <div className="filter__item-block filter-select__block">
                        <select name="flightTiming"
                                value={this.state.flightTiming}
                                onChange={this.handleSelectChange}
                                className="filter__item filter-select">
                            <option value="all">all flights</option>
                            <option value="delayed">delayed flights</option>
                        </select>
                    </div>
                    <div className="filter__item-block filter-select__block filter-select__block_white">
                        <select name="flightType"
                                value={this.state.flightType}
                                onChange={this.handleSelectChange}
                                className="filter__item filter-select filter-select_white">
                            <option value="arr">Arrivals</option>
                            <option value="dep">Deparatures</option>
                        </select>
                    </div>
                </div>
            </form>
        );
    }
}

const FlightsComponent = props => {
    let renderElements = [<React.Fragment>{props.children}</React.Fragment>];

    if (props.loadMoreButton) {
        renderElements.push(<button onClick={props.loadMore} className="load-more-button">show later</button>);
    }

    return renderElements;
}

const FlightList = (props) => {
    const data = props.data;
    const showDelayedOnly = props.showDelayedOnly;
    const requestType = props.requestType;
    const flightType = props.flightType.replace("dep", "departure").replace("arr", "arrival");

    const scheduledTimeType = flightType + "Date";
    const estimatedTimeType = "estimatedGate" + flightType.capitalize();
    const terminalType = flightType + "Terminal";
    const airportCodeType = (flightType === "departure" ? "arrival" : "departure") + "AirportFsCode";
    const delayType = flightType + "GateDelayMinutes";

    let flights = data.flightStatuses;
    const airports = data.appendix.airports;

    const flightStatuses = {
        "A": "Active",
        "C": "Canceled",
        "D": "Diverted",
        "DN": "Data source needed",
        "L": "Landed",
        "NO": "Not Operational",
        "R": "Redirected",
        "S": "Scheduled",
        "U": "Unknown"
    }

    //Search by time, if it`s search by flight number
    if (requestType === "flight") {
        const anytime = props.anytime;
        if (!anytime) {
            const time = parseInt(props.time);
            flights = flights.filter(function (flight) {
                const flightDate = new Date(flight[scheduledTimeType].dateLocal);
                return flightDate.getHours() === time;
            })
        }
    }
    //Search by flight timing, show only delayed flights
    if (showDelayedOnly) {
        flights = flights.filter(flight => flight.hasOwnProperty("delays") && flight.delays.hasOwnProperty(delayType))
    }

    //Sort by time
    flights.sort(function (a, b) {
        let aDate = new Date(a[scheduledTimeType].dateLocal);
        let bDate = new Date(b[scheduledTimeType].dateLocal);
        return (aDate.getHours() * 60 + aDate.getMinutes()) - (bDate.getHours() * 60 + bDate.getMinutes());
    })

    //Generating flights list
    const flightList = flights.map(function (flight) {
        const scheduledTime = moment(flight[scheduledTimeType].dateLocal).format('HH:mm');
        let timeField = null;
        const city = airports.filter(
            function (airports) {
                return airports.fs === flight[airportCodeType];
            }
        )[0].city;
        let terminal = "";

        //Set departure or arrival time:  scheduled time and estimated time, if it exists
        if (flight.operationalTimes.hasOwnProperty(estimatedTimeType) && flight.operationalTimes[estimatedTimeType].dateLocal !== flight[scheduledTimeType].dateLocal) {
            const estimatedTime = moment(flight.operationalTimes[estimatedTimeType].dateLocal).format('HH:mm');
            timeField = (
                [
                    <div className="flight-estimated-time">{estimatedTime}</div>,
                    <div className="flight-time-old">{scheduledTime}</div>
                ]
            );
        } else {
            timeField = [
                <div className="flight-time">{scheduledTime}</div>
            ];
        }

        //Show delay, if exist
        if (flight.hasOwnProperty("delays") && flight.delays.hasOwnProperty(delayType)) {
            let delay = flight.delays[delayType].toString();
            timeField.push(
                <div className="flight-delay">{delay.duration()}</div>
            )
        }

        //Show terminal, if exist
        if (flight.hasOwnProperty("airportResources") && flight.airportResources.hasOwnProperty(terminalType)) {
            terminal = flight.airportResources[terminalType];
        }

        //Show additional fligt numbers, if they exist
        if (flight.hasOwnProperty("codeshares")) {
            var codes = flight.codeshares.map(function (code) {
                return (
                    [
                        <div className="flight-code">{code.fsCode}</div>,
                        <div className="flight-number">{code.flightNumber}</div>
                    ]
                )
            })
        }
        return (
            <div className="flights-table__row">
                <div className="flights-table__cell flight__time-info">{timeField}
                </div>
                <div className="flights-table__cell flight__city">{city}</div>
                <div className="flights-table__cell flight__number-code">
                    <div className="flight-code">{flight.carrierFsCode}</div>
                    <div className="flight-number">{flight.flightNumber}</div>
                    {codes}
                </div>
                <div className="flights-table__cell flight__terminal">{terminal}</div>
                <div className="flights-table__cell flight__status">{flightStatuses[flight.status]}</div>
            </div>
        )
    });

    if (flightList.length > 0) {
        return (
            <div className="flights-table">
                {flightList}
            </div>
        );
    } else {
        return (
            <Nostification message="No results"/>
        )
    }
}

const Nostification = (props) => {
    return <div class="nostification"><p className="nostification__title">{props.title}</p>
        <div className="nostification__message">{props.message}</div>
    </div>;
}

const Loading = () => <div class="loading"></div>;

//Helpers

String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

URL.prototype.patchAppend = function (searchBy, searchByValue, flightType, flightDate, time = "") {
    let params = [
        searchBy,
        "status",
        searchByValue,
        flightType,
        flightDate.getFullYear(),
        flightDate.getMonth() + 1,
        flightDate.getDate(),
        time
    ];

    if (this.pathname[this.pathname.length - 1] === "/") {
        this.pathname -= "/";
    }

    for (let i = 0; i < params.length; i++) {
        if (params[i].toString().length > 0) {
            this.pathname += ("/" + params[i]);
        }
    }
}

String.prototype.duration = function () {
    let count = parseInt(this);
    let hours = Math.floor(count / 60);
    let minutes = count % 60;
    let result = "";

    if (hours > 0) result += (hours + " h. ")
    if (minutes > 0) result += (minutes + " min.")
    return result;
}

$(window).scroll(function () {
    if ($(this).scrollTop()) {
        $('.scroll-button').fadeIn();
    } else {
        $('.scroll-button').fadeOut();
    }
});
$(".scroll-button").click(function () {
    $("html, body").animate({scrollTop: 0}, 1000);
});

ReactDOM.render(
    <AppComponent/>,
    document.getElementById('appComponent')
);

