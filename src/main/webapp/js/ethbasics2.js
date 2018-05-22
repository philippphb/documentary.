// Holds the actually used web3 object
var web3;

// Logged in address
var myaddress;

// Selected Ethereum network
var networkid;

// If true, the an etehreum provider is available
var connected;

// If true, user is logged in at the ethereum provider
var loggedin;


// Establish connection to ethereum
function initEth() {

    connected = false;
    loggedin = false;

	// Initially unknown to be able react to initial settings	
	myaddress = undefined;
	networkid = undefined

	// Using the injected web3 provider
	if (typeof web3 !== 'undefined') {
		web3 = new Web3(web3.currentProvider);
	    connected = true;
		setupInjectedProviderListener();

	} else {
		console.log("No Ethereum Provider found");
		showNoEthereumProviderError();
	    connected = false;
	}
};

// Setup timer that checks for changes of user account and network
function setupInjectedProviderListener() {
	
	// Start timer
	accountTimer = setInterval(function() {
		
		// Handle account changes done through the injected provider
		if (myaddress !== web3.eth.accounts[0]) {
			  
			logout();
			myaddress = web3.eth.accounts[0];
			  
			if (myaddress !== undefined) {
		 		
		 		loggedin = true;

				// Login only if a valid network was identified				
				if (networkid !== undefined) {
					login();
				}
			}			
			else {
		 		loggedin = false;
			}
		}
		

		// Handle network changes done through the injected provider
		web3.version.getNetwork(function(error, result) {
			if (!error) {
				if (networkid !== result) {
					
					networkid = result;
					
					if (networkid === "1") {
						contractAddress = contractAddress_mainnet;
						deployBlockNr = deployBlockNr_mainnet;
					}
					else if (networkid === "4") {
						contractAddress = contractAddress_rinkeby;	
						deployBlockNr = deployBlockNr_rinkeby;
					}
					
					if (networkid !== undefined) {						
						stopWatchers();
					    connectToBlockchain();				 		
						login();
					}					
				}
			}
		});
		
	}, 300);
}

// Stops checking for changes of user account and network
function stopInjectedProviderListener() {
	if (accountTimer !== undefined) clearInterval(accountTimer);
}

function getNetworkId() {
	return networkid;
}

function isConnected() {
	return connected;
}

function userLoggedIn() {
	return loggedin;
}

// Returns the name of the network as string
function getNetworkName() {
	if (networkid == 1) return "mainnet";
	else if (networkid == 2) return "ropsten";
	else if (networkid == 3) return "koval";
	else if (networkid == 4) return "rinkeby";
	else return "unknown";
}

// Returns the base URL for verifying transactions, accounts etc. according to the selected network
function getEtherscanUrl() {
	if (networkid == 1) return "https://etherscan.io";
	else if (networkid == 2) return "https://ropsten.etherscan.io";
	else if (networkid == 3) return "https://kovan.etherscan.io";
	else if (networkid == 4) return "https://rinkeby.etherscan.io";
	else return "https://etherscan.io";
}

// Returns undefined if the passed string is not a number
function verifyNumStr(str) {

	for (var p=0; p<str.length; p++) {
        var c = str.charCodeAt(p);
        if (!((c >= 48 && c <= 57) || (c == 46) || (c == 44))) return undefined;
	}

	return str;
}

// Returns undefined if the passed string is not a hexadecimal value
function verifyHexStr(str) {

	if (str === undefined) return undefined;
	
	for (var p=0; p<str.length; p++) {
        var c = str.charCodeAt(p);
        if (!((c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102) || c === 120)) return undefined;
	}
	
	return str;
}

// Returns undefined if the passed string does not have the length of en Ethereum address
function lightVerifyAddress(addr) {
	if (addr.length != 42) return undefined;
	return addr;
}

// Returns undefined if the passed string is not an Ethereum address
function fullVerifyAddress(addr) {
	return verifyHexStr(lightVerifyAddress(addr));
}

// Parses the passed string str and cleans it for not allowed content, such as javascript for example, and adapts formatting
// to html style, such as replacing \n and \r by <br> for example
function cleanupAndFormat(str) {

	if (str === undefined) return undefined;

	var cleanstr = "";
	
	var istag = false;
	var tagstr = "";
	
	for (var p=0; p<str.length; p++) {
		
		var curchar = str.charAt(p);
		var curcharcode = str.charCodeAt(p);
		
		// Parse for html tags
		if (curchar === "<") istag = true;
		
		if (istag) tagstr += curchar;
		else {
			
	        // Replace LF/CR by <br>
			if (curcharcode === 10 ||  curcharcode === 13) {
				cleanstr += "<br>";
	        }

			// Replace every other control character by a space
			if (curcharcode < 32) {
				cleanstr += " ";
	        }

	        // Pass on every readable/displayable character
	        else cleanstr += curchar;
		}
		
		// Evaluate found html tags and react according to what is allowed
		if (curchar === ">") {			
			if (tagstr.startsWith("<a ") || tagstr === "</a>"
					|| tagstr === "<b>" || tagstr === "</b>"
					|| tagstr === "<i>" || tagstr === "</i>"
					|| tagstr === "<p>" || tagstr === "</p>"
					|| tagstr === "<q>" || tagstr === "</q>"
					|| tagstr.startsWith("<h") || tagstr.startsWith("</h")
					|| tagstr === "<strong>" || tagstr === "</strong>"
					|| tagstr === "<small>" || tagstr === "</small>"
					|| tagstr === "<em>" || tagstr === "</em>"
					|| tagstr === "<mark>" || tagstr === "</mark>"
					|| tagstr === "<del>" || tagstr === "</del>"
					|| tagstr === "<ins>" || tagstr === "</ins>"
					|| tagstr === "<sub>" || tagstr === "</sub>"
					|| tagstr === "<sup>" || tagstr === "</sup>"
					|| tagstr === "<code>" || tagstr === "</code>"
					|| tagstr === "<ul>" || tagstr === "</ul>"
					|| tagstr === "<ol>" || tagstr === "</ol>"
					|| tagstr === "<li>" || tagstr === "</li>"
/*					
					|| tagstr === "<table>" || tagstr === "</table>"
					|| tagstr === "<tr>" || tagstr === "</tr>"
					|| tagstr === "<th>" || tagstr === "</th>"
					|| tagstr === "<td>" || tagstr === "</td>"
*/					
					|| tagstr === "<hr>" 
					|| tagstr.startsWith("<img ")) {

				// Make sure that links are always opened in separate windows/tabs				
				if (tagstr.startsWith("<a ")) {
					cleanstr += tagstr.substring(0,2) + " target=\"_blank\"" + tagstr.substring(2,tagstr.length);
				}
				else {
					cleanstr += tagstr;
				}
			}
			
			istag = false;
			tagstr = "";
		}
	}
	
	return cleanstr;
}
