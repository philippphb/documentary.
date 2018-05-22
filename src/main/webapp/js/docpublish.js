

// For searching for document events
var docsOfAuthorEvent;


// Initalize the page, externally called from docmain.js
function initPage() {
    $('#alert_docsent').hide();
}

// Login, initially or when the account or network was changed. Eexternally called from ethbasics2.js
function login() {

    stopWatchers();

    // Clear document list
    clearBroadcasts("#authordoclist");

    if (isConnected() === false) {
        showNoEthereumProviderError();
    }

    else if (isNetworkValid() === false) { 
        showNetworkNotSupportedError();
    }

    else {

        // Display contract address
        $("#val_contract").html("<small>to contract " + contractAddress + " @ " + getNetworkName() + "</small>");

        if (userLoggedIn() === true) {

            // Display account address and load documents authored by the logged in user
            $("#val_account").html(myaddress.toString() + " @ " + getNetworkName());

            web3.eth.getBlockNumber(function(error, blocknr) {
                
                if (!error) {          

                    startBlockNo = blocknr - getNumLookBackBlocks();

                    docsOfAuthorEvent = documentaryInstance.DocumentEvent({author: myaddress}, {fromBlock: startBlockNo, toBlock: 'latest'});
                    docsOfAuthorEvent.watch(function(error, result) {
                        if (!error) {

                            // Display only original documents, no comments. Display using summaries and without comment links
                            if (result.args.refid.toNumber() === 0) {
                                printDocument(result, "#authordoclist", true, false);
                                $('#alert_docsent').hide();
                            }
                        }
                        else {
                            showError(error);
                        }
                    });        
                }
                else {
                    showError(error);
                }                
            });
        }

        // Handle login to page when no user is logged in in injected provider
        else {
            $("#val_account").html("You are not logged in");   
            showNoUserLoggedInError()
        }
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
    if (docsOfAuthorEvent !== undefined) docsOfAuthorEvent.stopWatching();
}

// Handle clicks to preview button
function previewButtonPressed() {

    // Extract document parameters
    var title = document.getElementById('title').value;
    var tags = document.getElementById('tags').value;
    var text = document.getElementById('text').value;

    // Display document in preview modal
    $('#modal_documentpreview_body').html(createDocumentHtml(0, new Date(), title, myaddress, tags, text, false, false));
    $('#modal_documentpreview').modal('show');   
}

// Handle clicks to send button
function sendDocButtonPressed() {

    // Extract document parameters, refid is always 0 (original document)
    var refid = 0;
    var title = document.getElementById('title').value;
    var tags = document.getElementById('tags').value;
    var text = document.getElementById('text').value;

    // Submit document to the contract    
    sendDocument(refid, title, tags, text);
}
