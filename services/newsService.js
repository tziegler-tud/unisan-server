const NewsEntry = require('/models/newsEntry.js');

class NewsService {

    constructor (){

    }

    static findEntry (id){
        //TODO: Database lookup
        var newsentry = new NewsEntry(); //dummy
        return newsentry
    }

    static logout (token){

    }


}

module.exports = NewsService();