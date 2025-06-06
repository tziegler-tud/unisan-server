export function wrapTime(timeString){
    if(parseInt(timeString) < 10){
        return "0" + timeString;
    }
    else return timeString
}

export function extractDateString(date){
    return wrapTime(date.getDate()) + "." + wrapTime(date.getMonth()+1) + "." + date.getFullYear();
}

export function extractTimeRangeString(startDate, endDate){
    return wrapTime(startDate.getHours()) + ":" + wrapTime(startDate.getMinutes()) + " - " + wrapTime(endDate.getHours()) + ":" + wrapTime(endDate.getMinutes())
}