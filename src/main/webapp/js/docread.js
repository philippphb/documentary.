

// For searching for document events
var docSearchEvent;

// For searching for tag events
var tagSearchEvent;

// If true indicates that adocument loading process if running
var loadingDoc = false;

// Size of the document id ring buffer
var docidarraysize = 100;

// Ringbuffer holding ids of dicuments to be loaded
var docidarray = Array(docidarraysize);

// Pointer to ther read and write position of the ringbuffer docidarray. Note: from a reading perspective,
// the ring buffer is empty if rdcnt == wrcnt BEFORE rdcnt is increased. From a writing perspective, the
// ring buffer is full if rdcnt == wrcnt AFTER wrcnt is increased. As a consequence: Write operations have
// to check for (wrcnt+1)%bufsize == rdcnt first and then increase wrcnt and then write. read operations
// have to check for rdcnt == wrcnt first, and then increase rdcnt and read.
var wrcnt = 0;
var rdcnt = 0;

//
var displaydocid;


// Initalize the page, externally called from docmain.js
function initPage() {

    displaydocid = 0;

    // Handle links that point to a document
    var queryitems = window.location.search.substr(1).split("&");
    if (queryitems[0].startsWith("docid=")) {
        var docid = parseInt(queryitems[0].substring(6));
        if (docid !== undefined && docid !== NaN) {
            displaydocid = docid;
        }
    }
}

// Login, initially or when the account or network was changed. Eexternally called from ethbasics2.js
function login() {

    stopWatchers();

    // Clear serach result list
    clearBroadcasts("#searchresultlist");

    if (isConnected() === false) {
        showNoEthereumProviderError();
    }

    else if (isNetworkValid() === false) { 
        showNetworkNotSupportedError();
    }

    else {

        // Display contract address
        $("#val_contract").html("<small>from contract " + contractAddress + " @ " + getNetworkName() + "</small>");        

        // Display account address according to login state
        if (userLoggedIn() == true) {
            $("#val_account").html(myaddress.toString() + " @ " + getNetworkName());
        }
        else {
             $("#val_account").html("You are not logged in");   
        }

        // Displaya document that is pointed to by the URL
        if (displaydocid > 0) {
            showDocument(displaydocid);    
            displaydocid = 0;
        }

        // Initially, search for all documents, such that the latest publications are displayed
        search("", "");  
    }
}

// Lougout when site is left, or account or network was changed. Eexternally called from ethbasics2.js
function logout() {
}

// Setup watchers. Externally called
function setUpWatchers() {

}

// Setup watchers. Externally called
function stopWatchers() {
    if (docSearchEvent !== undefined) docSearchEvent.stopWatching();
    if (tagSearchEvent !== undefined) tagSearchEvent.stopWatching();
}

// Handle clicks search button
function searchButtonPressed() {
    
    // Extract search parameters
    var author = document.getElementById('searchauthor').value;
    var tag = document.getElementById('searchtags').value;

    // Search according to search parameters    
    search(author, tag);
}

// Handle clicks on send comment button
function sendCommentButtonPressed() {

    // Extract comment parameters, currently displayed document is the reference document
    var refid = getCurrentDocId();
    var title = "";
    var tags = "";
    var text = document.getElementById('comment_text').value;

    // Submit comment as new document to the contract
    sendDocument(refid, title, tags, text);
}

// Search for a document of author authoraddr and tag tag
function search(authoraddr, tag) {

    // Connection to Ethereum not established
    if (isConnected() === false) {
        showNoEthereumProviderError();
    }

    // Unsupported network selected
    else if (isNetworkValid() === false) {
        showNetworkNotSupportedError();
    }

    // Everything ready
    else {

        // Hash search tag
        var taghash = web3.sha3(tag.trim().toLowerCase());

        // Remove result from previous search
        clearBroadcasts("#searchresultlist");

        
    //    startBlockNo = web3.eth.blockNumber - numLookBackBlocks;

        // Stop watchers from previous search
        stopWatchers();

        // Search for ids of documents by authoraddr with tag identified by taghash
        if (authoraddr !== "" && tag !== "") {

            tagSearchEvent = documentaryInstance.TagEvent({author: authoraddr, taghash: taghash}, {fromBlock: startBlockNo, toBlock: 'latest'});
            tagSearchEvent.watch(function(error, result) {
                if (!error) {

                    var nextwrcnt = wrcnt++;
                    if (nextwrcnt >= docidarraysize) nextwrcnt = 0;

                    // Add id to array of documents to be loaded
                    if (nextwrcnt != rdcnt) {
                        wrcnt = nextwrcnt;
                        docidarray[wrcnt] = result.args.docid;

                        // Trigger loading of documents
                        getDocs();
                    }

                    // Stop searching for documents if ring buffer for document ids is full
                    else {
                        tagSearchEvent.stopWatching();
                    }
                }
                else {
                    showError(error);
                }
            });        
        }
        
        // Search for latest publications
        if (authoraddr === "" && tag === "") {

            docSearchEvent = documentaryInstance.DocumentEvent({}, {fromBlock: startBlockNo, toBlock: 'latest'});
            docSearchEvent.watch(function(error, result) {
                if (!error) {

                    // Display only original documents, no comments. Display using summaries and comment links
                    if (result.args.refid.toNumber() === 0) {
                        printDocument(result, "#searchresultlist", true, true);
                    }
                }
                else {
                    showError(error);
                }
            });        
        }

        // Search for documents written by authoraddr
        else if (authoraddr !== "") {

            docSearchEvent = documentaryInstance.DocumentEvent({author: authoraddr}, {fromBlock: startBlockNo, toBlock: 'latest'});
            docSearchEvent.watch(function(error, result) {
                if (!error) {

                    // Display only original documents, no comments. Display using summaries and comment links
                    if (result.args.refid.toNumber() === 0) {
                        printDocument(result, "#searchresultlist", true, true);
                    }
                }
                else {
                    showError(error);
                }
            });        
        }
        
        // Search for ids of documents with tag identified by taghash
        else if (tag !== "") {

            tagSearchEvent = documentaryInstance.TagEvent({taghash: taghash}, {fromBlock: startBlockNo, toBlock: 'latest'});
            tagSearchEvent.watch(function(error, result) {
                if (!error) {

                    var nextwrcnt = wrcnt + 1;
                    if (nextwrcnt >= docidarraysize) nextwrcnt = 0;

                    // Add id to array of documents to be loaded
                    if (nextwrcnt != rdcnt) {
                        wrcnt = nextwrcnt;
                        docidarray[wrcnt] = result.args.docid;

                        // Trigger loading of documents
                        getDocs();
                    }

                    // Stop searching for documents if ring buffer for document ids is full
                    else {
                        tagSearchEvent.stopWatching();
                    }
                }
                else {
                    showError(error);
                }
            });        
        }
    }
};

// Retrieve documents based on ids
function getDocs() {

    // Do not interfere with a running document loading process
    if (loadingDoc) return;

    // Leave if ring buffer is empty
    if (rdcnt == wrcnt) return;

    // Indicate that a loading process is running    
    loadingDoc = true;
    
    // Stop previous document search
    if (docSearchEvent !== undefined) docSearchEvent.stopWatching();

    // Prepare id of next document to retrieve 
    rdcnt++;
    if (rdcnt >= docidarraysize) rdcnt = 0;

    // Retrieve document based on id
    docSearchEvent = documentaryInstance.DocumentEvent({docid: docidarray[rdcnt]}, {fromBlock: startBlockNo, toBlock: 'latest'});
    docSearchEvent.watch(function(error, result) {
        if (!error) {

            // Display only original documents, no comments. Display using summaries and comment links
            if (result.args.refid.toNumber() === 0) {
                printDocument(result, "#searchresultlist", true, true);
            }

            // Docuemnt loading process has finished
            loadingDoc = false;

            // Trigger loading of next document
            getDocs();
        }
        else {
            showError(error);

            // Docuemnt loading process has finished
            loadingDoc = false;

            // Trigger loading of next document
            getDocs();
        }
    });        
}
