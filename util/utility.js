/*
 *  Copyright (c) 2005-2011, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *  WSO2 Inc. licenses this file to you under the Apache License,
 *  Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var DEFAULT_CLAIM_URL = "http://wso2.org/claims";
var OPENID_REG_CLAIM_URL = "http://schema.openid.net/2007/05/claims";
var UI_USER_PERMISSIONS = "user-permissions";
var UI_COMPONENTS = "ui-components";

var LOGGED_IN_USER = "user";
var USER_NAME = "user.name";
var USER_HEADER = "user-header";

var I18N = "i18n";
var SERVER_URL = "https://localhost:9443/services";

var AUTH_CONFIG_PARSED = "auth.config.parsed";
var SAML_ENABLED = "saml.enabled";

var SAML_RESPONSE = "saml.response";
var SAML_PROPERTIES = "saml.config";

var log = new Log();

function initI18N(){
	var i18n = session.get(I18N)
	if(i18n == null){
	    i18n = require(I18N);
	    i18n.init(request, "/" );
	    session.put(I18N, i18n);
	}
	return i18n;

}

function sortNumber(jsonArray, property, ascending, zeroLast) {
    jsonArray.sort(function (a, b) {
        var aProp = parseFloat(a[property]);
        var bProp = parseFloat(b[property]);

        if(zeroLast){
             if(aProp == 0){
                aProp = 500000;
             }
             if(bProp == 0 ){
                bProp = 500000;
             }
        }

        return aProp === bProp ? 0 : ( ascending ? (aProp >= bProp ? 1 : -1 ) : (aProp >= bProp ? -1 : 1 ));
    });

    return jsonArray;
}

function inputNotNullOrEmpty(jsonObj, paramNameArray){
    var input;
    for (var i = 0; i < paramNameArray.length; i++) {
        input = jsonObj[paramNameArray[i]];
        if(input == "" || input === 'null' || input == null || input.length <= 0){
            return false;
        }
    }
    return true;
}


function getServerUrl(){

	var serverUrl = application.get('serverUrl');
	if(serverUrl === 'null' || serverUrl == null || serverUrl.length <= 0){
	setServerURL();
	serverUrl = application.get('serverUrl');

	}
log.debug('Connecting to ' + serverUrl);
return serverUrl;
}

function getServiceUrl(){

	var serviceUrl = application.get('serviceUrl');
	if(serviceUrl === 'null' || serviceUrl == null || serviceUrl.length <= 0){
	setServiceURL();
	serviceUrl = application.get('serviceUrl');

	}
log.debug('Connecting to ' + serviceUrl);
return serviceUrl;
}

function setServiceURL(){
	var serviceUrl = stringify(application.get('serviceUrl'));
	if(serviceUrl === 'null' || serviceUrl == null || serviceUrl.length <= 0){
		//Server URL is not specified in the jaggery.conf, therefore using the service url mentioned in the carbon.conf
		var carbon = require('carbon');

    serviceUrl = "https://" + carbon.server.ip + ":" + carbon.server.httpsPort + "/services/"

    application.put('serviceUrl', serviceUrl);
	
	log.info("serviceUrl = " + serviceUrl);

	}
		
}

function isNotNullOrEmpty(checkText){
	if(checkText == "" || checkText === 'null' || checkText == null || checkText.length <= 0){
		return false;
	}
	return true;
}

function getSuccessErrorJson(request, i18n){
    var error = request.getParameter("e");
    var errorMsg = request.getParameter("error");
    var success = request.getParameter("s");
    var successMsg = request.getParameter("sMsg");

    var errorJson = {};

    if(error != null){
        if(errorMsg != null && errorMsg.length > 0){
            var temp = i18n.localize(errorMsg);
            errorJson.eMsg = (temp != null && temp.length > 0) ? temp : errorMsg;
        }else{
            errorJson.eMsg = i18n.localize("common_error");
        }
    }
    
    if(success != null && success === "1"){
        if(successMsg != null && successMsg.length > 0){
            var temp = i18n.localize(successMsg);
            errorJson.successMsg = (temp != null && temp.length > 0) ? temp : successMsg;
        }else{
            errorJson.successMsg = i18n.localize("common_success");
        }
    }
    
    return errorJson;
	
}

function doAuthenticate(obj){
    //this is the requested resource
    if(obj["login-required"] !== 'false'){
       if(session.get('user') == null){
            throw 'InvalidLogin';
       }
    }

    var permissions = obj.permissions;
    if(permissions != null){
        for each(var perm in permissions){
              if(!isAuthorized(perm)){
                throw 'NotAuthorized'
              }
        }
    }

}



function isAuthorized(resource){
    var perms = session.get(UI_USER_PERMISSIONS);
    if(perms == null) {
        return false;
    }

    for each(var p in perms){
        if(resource.indexOf(p) > -1){
            return true;
        }
    }

    return false;
}

function createLinkObject(obj, context, i18n){
	var tmp = {};
	tmp['link'] =  generateHeaderLink(obj, context, i18n);
	tmp['dash'] =  generateDashboard(obj, context, i18n);

	return tmp;
}

function generateHeader(loggedin, i18n){
	var uiComponents = application.get(UI_COMPONENTS);
	var pages = uiComponents.pages;
	var context = uiComponents.context;
	var accessiblePages = {};
		
	var logReqLinks = [];
	var logReqDash = [];
	var logNotReqLinks = [];
	var logNotReqDash = [];
			
	if(loggedin){
		for each(var obj in pages){
 	        try{
 	        	var pageLoginReq = obj['login-required'] === 'true';
 	        	if(pageLoginReq){
 	        		
		        	doAuthenticate(obj);
		        	if(obj.displayorder != '-1' && obj['login-required']){
			        	var ob = createLinkObject(obj, context, i18n);
			        	logReqLinks.push(ob.link);
			        	logReqDash.push(ob.dash);
		        	}
 	        	}
	        }catch(e){
	        	//Ignore the exception
	        }
	    }
	}else{
		
		// only the pages that does not need a user login are displayed here
	    for each(var obj in pages){
	        if(obj['login-required'] && obj['login-required'] === 'false'){
	        	if(obj.displayorder != '-1'){
		        	var ob = createLinkObject(obj, context, i18n);
		        	logNotReqLinks.push(ob.link);
		        	logNotReqDash.push(ob.dash);
	        	}
	        }
	    }
	}
	
	var logReqLinkStr = "";
	for each(var obj in logReqLinks){
		logReqLinkStr += obj;
	}
	logReqLinks = logReqLinkStr;
	
	var logReqDashStr = "<div class='row'>";
	var count = 0;
	for each(var obj in logReqDash){
		logReqDashStr += obj;
		if(count == 3){
			logReqDashStr += "</div><div class='row second-row-gap'>";
			count = 0;
		}
		count++;
	}
	if(count < 3){
		logReqDashStr  += "</div>";
	}
	
	logReqDash = logReqDashStr;
	
	var logNotReqLinksStr = "";
	for each(var obj in logNotReqLinks){
		logNotReqLinksStr += obj;
	}
	logNotReqLinks = logNotReqLinksStr;
	
	
	var logNotReqDashStr = "";
	for each(var obj in logNotReqDash){
		logNotReqDashStr += obj;
	}
	logNotReqDash = logNotReqDashStr;
	
	accessiblePages['logReqLinks'] = logReqLinks;
	accessiblePages['logReqDash'] = logReqDash;
	accessiblePages['logNotReqLinks'] = logNotReqLinks;
	accessiblePages['logNotReqDash'] = logNotReqDash;
		
	return accessiblePages;
}

/**
 * accessiblePages - object containing page arrays
 */
function generateHeaderLink(page, context, i18n){
	
	var link = "<li class='"+ page.name +"' ><a title='"+ i18n.localize('pages')[page.text] +"' href='" + context + "/" + page.url +"'><i class='"+ page.styles +"'></i> <span><br>"+ i18n.localize('pages')[page.text] +"</span></a></li>";
	return link;

}

function generateDashboard(page, context, i18n){
	if(page['dashboard-styles']){
		
		var dashboard =     "<div class='col-md-4'>" +
							    "<div class='box-title'><h3>"+ i18n.localize('pages')[page.text] +"</h3></div>" +
							    "<div class='box-content'>" +
							        "<div class='" + page['dashboard-styles'] + "'></div>" +
							        i18n.localize('pages')[page.desc] +
							        "<p><a class='btn btn-default' href='"+ context + "/" + page.url +"'>View details &raquo;</a></p>" +
							    "</div>" +
						    "</div>";
	
		return dashboard;
	}
	return "";
}


String.prototype.replaceAll = function(stringToFind,stringToReplace){
    var temp = this;
    var index = temp.indexOf(stringToFind);
    while(index != -1){
        temp = temp.replace(stringToFind,stringToReplace);
        index = temp.indexOf(stringToFind);
    }
    return temp;
};

function setServerURL(){
	var serverUrl = stringify(application.get('serverUrl'));
	if(serverUrl === 'null' || serverUrl == null || serverUrl.length <= 0){
		//Server URL is not specified in the jaggery.conf, therefore using the service url mentioned in the carbon.conf
		var carbon = require('carbon');
		var serverConfigService = carbon.server.osgiService('org.wso2.carbon.base.api.ServerConfigurationService');
		var configContextService = carbon.server.osgiService('org.wso2.carbon.utils.ConfigurationContextService');
		
		var configContext = configContextService.getServerConfigContext();

		
		var ServerConfiguration = Packages.org.wso2.carbon.base.ServerConfiguration;


	    var mgtTransport = ServerConfiguration.getInstance().getFirstProperty("ManagementTransport");
	    if (mgtTransport == null || mgtTransport.startsWith("${")) {
	    	mgtTransport = "https";
	    }
	    
	    var carbonMgtParam = "${carbon.management.port}";
	    var carbonContext = "${carbon.context}";


	    
		var server = serverConfigService.getFirstProperty("ServerURL");
		var hostName = serverConfigService.getFirstProperty("HostName");
		var mgtHostName = serverConfigService.getFirstProperty("MgtHostName");
		
		
		var CarbonUtils = Packages.org.wso2.carbon.utils.CarbonUtils;
	   var httpsPort =
	                CarbonUtils.getTransportPort(configContext, mgtTransport) + "";		
	                
		application.put("mgtHostName", mgtHostName);		
		application.put("mgtTransport", mgtTransport);
		
	   application.put("httpsPort", httpsPort);
		
		if(server.indexOf("local:/") == 0){
			server = mgtTransport + "://"+ hostName +":" + carbonMgtParam + carbonContext + "/services"
		}

	    var serverUrl = server;
		 if (serverUrl.indexOf(carbonMgtParam) != -1) {
	        serverUrl = serverUrl.replace(carbonMgtParam, httpsPort);
	    }
	    if (serverUrl.indexOf(carbonContext) != -1) {
	        var context = ServerConfiguration.getInstance().getFirstProperty("WebContextRoot");
	        if (context.equals("/")) {
	            context = "";
	        }
	        serverUrl = serverUrl.replace(carbonContext, context);
	    }
	    
		
	    if(serverUrl.lastIndexOf('/') === (serverUrl.length - 1)){
	    	serverUrl = serverUrl.substring(0, serverUrl.length - 1);
	    }
	//	application.put(SERVER_URL, serverUrl);
application.put('serverUrl', serverUrl);
serverURL = serverUrl;
	
	log.info("connecting to " + serverUrl);

	}
		
}
