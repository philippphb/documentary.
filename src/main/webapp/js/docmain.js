

// Contract ABI and addresses
var contractAbi = [{"constant":true,"inputs":[{"name":"user","type":"address"},{"name":"docnum","type":"uint32"}],"name":"getUserDocId","outputs":[{"name":"","type":"uint128"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"docid","type":"uint128"}],"name":"makeVisible","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"refid","type":"uint128"},{"name":"doctime","type":"uint64"},{"name":"taghashes","type":"bytes32[]"},{"name":"tags","type":"string"},{"name":"title","type":"string"},{"name":"text","type":"string"}],"name":"documentIt","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"user","type":"address"}],"name":"getUserDocCount","outputs":[{"name":"","type":"uint32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"user","type":"address"}],"name":"grantEditorRights","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getDocCount","outputs":[{"name":"","type":"uint128"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"docid","type":"uint128"},{"name":"doctime","type":"uint64"},{"name":"taghashes","type":"bytes32[]"},{"name":"tags","type":"string"},{"name":"title","type":"string"},{"name":"text","type":"string"}],"name":"editIt","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"docid","type":"uint128"}],"name":"makeInvisible","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"editor","type":"address"}],"name":"revokeEditorRights","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"docid","type":"uint128"},{"indexed":true,"name":"refid","type":"uint128"},{"indexed":false,"name":"state","type":"uint16"},{"indexed":false,"name":"doctime","type":"uint256"},{"indexed":true,"name":"author","type":"address"},{"indexed":false,"name":"tags","type":"string"},{"indexed":false,"name":"title","type":"string"},{"indexed":false,"name":"text","type":"string"}],"name":"DocumentEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"docid","type":"uint128"},{"indexed":true,"name":"author","type":"address"},{"indexed":true,"name":"taghash","type":"bytes32"},{"indexed":true,"name":"channelid","type":"uint64"}],"name":"TagEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"docid","type":"uint128"},{"indexed":false,"name":"state","type":"uint16"}],"name":"InvisibleDocumentEvent","type":"event"}];
var contractAddress_rinkeby = "0xaDdBEC01921ff2B46992F2a40fc322F7B08a86F9";         // Rinkeby
var contractAddress_mainnet = "0xaDdBEC01921ff2B46992F2a40fc322F7B08a86F9";         // Main net
var deployBlockNr_rinkeby = 2230231;
var deployBlockNr_mainnet = 5560679;

// Contract address, reference and instance according to selected network
var contractAddress;
var documentaryContract;
var documentaryInstance;
var deployBlockNr;

// Ifd of the currently selected document
var curdocid;

// Event for getting a specific document, identified by its id
var docGetEevent;

// Event for searching for comments, i.e. documents that have a refid equal to the current document id
var commentSearchEvent;

// Earliest block for event seatch
var numLookBackBlocks = 30*24*60*4;
var startBlockNo; 


// For site initialization
window.addEventListener('load', function() {
    init();
});
    
function init() {

    // Blockchain initialization
    initEth();

    // Local initialization
    curdocid = 0;

    // Page initialization, external function, has to be defined in site js script
    initPage();
};

// Creates instance of the contract and connects it to the contract address according to the selected network
function connectToBlockchain() {

    if (contractAddress !== undefined) {

        documentaryContract = web3.eth.contract(contractAbi);

        try {
            documentaryInstance = documentaryContract.at(contractAddress);
        }
        catch(err) {
            showError("Error connecting to Ethereum block chain.");
        }
    }
}

function isNetworkValid() {
    var nid = getNetworkId();
    if (nid === "1" || nid === "4") return true;
    return false;
}

// Deleivers the error message when no ethereum provider is found
function showNoEthereumProviderError() {
    showModal("No Ethereum Provider", "No Ethereum Provider was Found. Please install the <a target=\"_blank\" href=\"https://metamask.io/\">MetaMask</a> plugin or load the <a target=\"_blank\" href=\"http://www.toshi.org/\">Toshi</a> browser on your mobile device.");
}

// Deleivers the error message when no user is logged in
function showNoUserLoggedInError() {
    showModal("Login required", "You are not logged in. Please login to your wallet to be able to publish documents.");
}

// Deleivers the error message when a not supported network is selected
function showNetworkNotSupportedError() {
    showModal("Network not supported", "documentary is available on Mainnet and Rinkeby. Please connect to Mainnet or Rinkeby.");
}

// General function for error display
function showError(message) {
    showModal("An error occurred", message);
}

// General function for displaying info/error modal
function showModal(title, message) {
    $('#modal_error_title').html(title);
    $('#modal_error_message').html(message);
    $('#modal_error').modal('show');   
}

// General function for hiding info/error modal
function hideModal() {
    $('#modal_error').modal('hide');   
}

// getter function for avoiding access to globals
function getCurrentDocId() {
    return curdocid;
}

// Retrieves and displays document with id id in the modal '#modal_documentdisplay_header'
function showDocument(id) {

    // Set current document id for later use, for example retrieving comments
    curdocid = id;

    // Stop watchers if active from last document display
    if (docGetEevent !== undefined) docGetEevent.stopWatching();
    if (commentSearchEvent !== undefined) commentSearchEvent.stopWatching();

    // Clear display of last document
    clearBroadcasts("#modal_documentdisplay_document");
    clearBroadcasts("#modal_documentdisplay_comments");

    // Retrieve and display document 
    docGetEevent = documentaryInstance.DocumentEvent({docid: id}, {fromBlock: startBlockNo, toBlock: 'latest'});
    docGetEevent.watch(function(error, event) {
        if (!error) {

            // Identify if document is a comment or an original document and set header of modal for displaying accordingly
            var refid = event.args.refid.toNumber();
            if (refid === 0) {
                $('#modal_documentdisplay_header').html("");
            }
            else {
                $('#modal_documentdisplay_header').html("This document is a comment. Read the <a href=\"javascript:showDocument(" + refid + ")\">commented document</a>.");
            }

            // Display document
            printDocument(event, "#modal_documentdisplay_document", false, false);
            $('#modal_documentdisplay').modal('show');   
        }
        else {
            showError(error);
        }
    });        

    // Retrieve and display comments to the document
    commentSearchEvent = documentaryInstance.DocumentEvent({refid: id}, {fromBlock: startBlockNo, toBlock: 'latest'});
    commentSearchEvent.watch(function(error, event) {
        if (!error) {
            printComment(event, "#modal_documentdisplay_comments", false, true);
        }
        else {
            showError(error);
        }
    });        

}

// Sends a document of the logged in user with refid, title, tags and text to the documentary contract
function sendDocument(refid, title, tags, text) {

    // Connection to Ethereum not established
    if (isConnected() === false) {
        showNoEthereumProviderError();
    }

    // Unsupported network selected
    else if (isNetworkValid() === false) {
        showNetworkNotSupportedError();
    }

    // No user logged in
    else if (userLoggedIn() === false) {
        showNoUserLoggedInError();
    }

    // Everything ready
    else {

        // Extract the separate tags and create tag hashes 
        var tagarray = tags.split(new RegExp("[\\s\\,\\;]+"));
        var taghasharray = Array(tagarray.length);
        for (var t=0; t<tagarray.length; t++) {
            var tag = tagarray[t].trim().toLowerCase();
            taghasharray[t] = web3.sha3(tag);
        }    

        // Get current blocknumber to get current block
        web3.eth.getBlockNumber(function(error, blocknr) {
            
            if (!error) {          

                // Get current block to obtain publication date
                web3.eth.getBlock(blocknr, function(error, block) {
                    
                    if(!error) {

                        // Get publication date
                        var timestamp = block.timestamp;

                        // Call contract function for document submission
                        documentaryInstance.documentIt(refid, timestamp, taghasharray, tags, title, text, function(error, txhash) {
                            
                            if (!error) {
                                $('#alert_message').html("The document was sent to the blockchain. It will be displayed as soon as the transaction is mined. Check the <a href=\"" + getEtherscanUrl() + "/tx/" + txhash + "\" target=\"_blank\" class=\"alert-link\">state of the transaction</a>.");
                                $('#alert_docsent').show();    
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

            else {
                showError(error);
            }
        });
    }
};

function getNumLookBackBlocks() {
    return numLookBackBlocks;
}
