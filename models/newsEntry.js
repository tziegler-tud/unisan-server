class NewsEntry {

    data = {};


    constructor (id, title, content){
        this._id = id;
        this.data.title_= title;
        this.data.content = content;
        this.data.media = [];

    }

    set title (title) {
        this.data.title = title;
    }

    set date (date) {
        //TODO: Check date convention
        this.data.date = date;
    }

    set text (content) {
        this.data.content = content;
    }

    addMedia (source,description){
        var mediaObject = new MediaObject(source, description);
        this.data.media.push(mediaObject);
    }
}

module.exports = NewsEntry;