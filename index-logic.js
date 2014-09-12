function getStoredQueries() {
    var util = require("util/utility.js");
    var serviceUrl = util.getServiceUrl();
    serviceUrl = serviceUrl + "EmailMonitorAdminService";

    var emailMonitorAdminServiceStub = Packages.org.wso2.cep.email.monitor.stub.admin.EmailMonitorAdminServiceStub;
    var myEmailMonitorAdminServiceStub = new emailMonitorAdminServiceStub(serviceUrl);


    return myEmailMonitorAdminServiceStub.getEmailMonitorResources("emailMonitorCollection/queryCollection");
}