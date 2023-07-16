

//find key in json by string in dot-notation
export function refJSON (obj, str) {
    return str.split(".").reduce(function(o, x) { return o[x] }, obj);
}

/**
 * @param value {String|Number|Date} the value to be transformed
 * @param origin {String} Type of value given. One of "s, ms, date"
 * @param target {String} Desired output format. One of "s, ms, date"
 *
 * @returns {String|Number|Date}
 */
export function transformTimestamp(value, origin="ms", target="ms"){
    let dateValue = origin;
    let date;
    try {
        switch(origin){
            default:
            case "ms":
                date = new Date(value);
                break;
            case "s":
                date = new Date(Number(value) * 1000);
                break;
            case "date":
                date = origin;
                break;
        }

        const ms = date.getTime()
        switch(target){
            default:
            case "ms":
                return ms;
            case "s":
                return (Math.floor(Number(ms) / 1000));
            case "date":
                return date;
        }
    }
    catch(e){
        return "Error parsing date.";
    }

}