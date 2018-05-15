
// Maximum length of a text in order to not display it as summary (when sumary mode anabled)
var maxfulltextlen = 400;

// Minimum length of a summary of a text
var mintextpreviewlen = 300;


// Creal all documents that are children of targetreference in the DOM tree
function clearBroadcasts(targetreference) {

    // Find all docuemnts
    var broadcasts = $(targetreference).children(".broadcast");

    // delete all documents but not the root
    for (var i=0; i<broadcasts.length; i++) {
        var broadcast = broadcasts.get(i);
        if (broadcast.id !== "-1") $(targetreference).children("#"+broadcast.id).remove();
    }
};

// Inserts a document contained in ethevent in the list below targetreference in the DOM tree. If summarize
// is set to true, long documents are summarized and a link to a full text viewer is proveded. If comments
// is set to true, a link to an editor for comments is provided if the docuemnt is not summarized
function printDocument(ethevent, targetreference, summarize, comments) {

    web3.eth.getBlock(ethevent.blockNumber, function(error, result) {
        
        if(!error) {
            var msgblock = result;

            // Get timestamp of the document
            var msgdate = new Date(msgblock.timestamp*1000);            // Mining timestamp
//            var msgdate2 = new Date(ethevent.args.doctime*1000);      // submission timestamp

            // Find all documents below targetreference
            var broadcasts = $(targetreference).children(".broadcast");

            // Loop trough the list of documents and insert the document in cronologically descending order
            for (var i=0; i<broadcasts.length; i++) {
                var broadcast = broadcasts.get(i);

                // Quit if the document is already present in the list
                if (parseInt(broadcast.id) == parseInt(ethevent.args.docid)) break;

                // Insert the document at the current position and quit
                if (parseInt(broadcast.id) < parseInt(ethevent.args.docid)) {
                    $(targetreference).children("#"+broadcast.id).before(createDocumentHtml(ethevent.args.docid, msgdate, ethevent.args.title, ethevent.args.author, ethevent.args.tags, ethevent.args.text, summarize, comments));
                    break;
                }
            }
        }

        else {
            console.log(error);
        }
    });
};

// Creates the html fragment of a document with the passed parameters. If summarize
// is set to true, long documents are summarized and a link to a full text viewer is proveded. If comments
// is set to true, a link to an editor for comments is provided if the docuemnt is not summarized
function createDocumentHtml(docid, date, title, author, tags, text, summarize, comments) {

    // Create html fragment for short documents and long documents in case a summary is not desired
    if (text.length < maxfulltextlen || summarize === false) {

        // Without link to a comment editor
        if (comments === false) {
            return "<div class=\"broadcast\" id=\"" + docid + "\"> <div class=\"bccontent\"> <div class=\"timestamp\">" + date + "</div> <div class=\"headline\">" + cleanupAndFormat(title) + "</div> <div class=\"author\"> From " + author + "</div> <div class=\"tags\"> Tags: " + cleanupAndFormat(tags) + "</div> <div class=\"bctext\"><p>" + cleanupAndFormat(text) + "</p></div></div><hr class=\"hr-markup\"></div>";
        }

        // With link to a comment editor
        else {
            return "<div class=\"broadcast\" id=\"" + docid + "\"> <div class=\"bccontent\"> <div class=\"timestamp\">" + date + "</div> <div class=\"headline\">" + cleanupAndFormat(title) + "</div> <div class=\"author\"> From " + author + "</div> <div class=\"tags\"> Tags: " + cleanupAndFormat(tags) + "</div> <div class=\"bctext\"><p>" + cleanupAndFormat(text) + " <a href=\"javascript:showDocument(" + docid + ")\">[leave a comment]</a>" + "</p></div></div><hr class=\"hr-markup\"></div>";
        }
    }

    // Create html fragment of a summary of a long document
    else {

        var textpreviewlen;
        for (textpreviewlen=mintextpreviewlen; textpreviewlen<mintextpreviewlen+30; textpreviewlen++) {
            if (text.charAt(textpreviewlen) == ' ') break;
        }

        var textpreview = text.substring(0, textpreviewlen) + "...";

        return "<div class=\"broadcast\" id=\"" + docid + "\"> <div class=\"bccontent\"> <div class=\"timestamp\">" + date + "</div> <div class=\"headline\">" + cleanupAndFormat(title) + "</div> <div class=\"author\"> From " + author + "</div> <div class=\"tags\"> Tags: " + cleanupAndFormat(tags) + "</div> <div class=\"bctext\"><p>" + cleanupAndFormat(textpreview) + " <a href=\"javascript:showDocument(" + docid + ")\">[read full document]</a>" + "</p></div></div><hr class=\"hr-markup\"></div>";
    }
}


// Inserts a comment contained in ethevent in the list below targetreference in the DOM tree. If summarize
// is set to true, long documents are summarized and a link to a full text viewer is proveded. If comments
// is set to true, a link to an editor for comments is provided if the docuemnt is not summarized
function printComment(ethevent, targetreference, summarize, comments) {

    web3.eth.getBlock(ethevent.blockNumber, function(error, result) {
        
        if(!error) {
            var msgblock = result;

            // Get timestamp of the document
            var msgdate = new Date(msgblock.timestamp*1000);            // Mining timestamp
//            var msgdate2 = new Date(ethevent.args.doctime*1000);      // Submission timestamp

            // Find all comments below targetreference
            var broadcasts = $(targetreference).children(".broadcast");

            // Loop trough the list of comments and insert the comment in cronologically descending order
            for (var i=0; i<broadcasts.length; i++) {
                var broadcast = broadcasts.get(i);

                // Quit if the comment is already present in the list
                if (parseInt(broadcast.id) == parseInt(ethevent.args.docid)) break;

                // Insert the comment at the current position and quit
                if (parseInt(broadcast.id) < parseInt(ethevent.args.docid)) {
                    $(targetreference).children("#"+broadcast.id).before(createCommentHtml(ethevent.args.docid, msgdate, ethevent.args.title, ethevent.args.author, ethevent.args.tags, ethevent.args.text, summarize, comments));
                    break;
                }
            }
        }

        else {
            console.log(error);
        }
    });
};

// Creates the html fragment of a document with the passed parameters. If summarize
// is set to true, long documents are summarized and a link to a full text viewer is proveded. If comments
// is set to true, a link to an editor for comments is provided if the docuemnt is not summarized
function createCommentHtml(docid, date, title, author, tags, text, summarize, comments) {
    return "<div class=\"broadcast\" id=\"" + docid + "\"> <div class=\"bccontent\"> <div class=\"timestamp\">" + date + "</div> <div class=\"author\"> From " + author + "</div> <div class=\"bctext\"><p>" + cleanupAndFormat(text) + " <a href=\"javascript:showDocument(" + docid + ")\">[leave a comment]</a>" + "</p></div></div><hr class=\"hr-markup\"></div>";
}
