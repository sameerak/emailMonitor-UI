Read me file for email monitor system's jaggery application.

This is the front end jaggery app for the email monitoring service project at [1].

First clone this project and execute "mvn clean install" command in the terminal from "emailMonitor-UI".
After setting up the email monitoring system at [1], copy emailMonitor-UI/target/emailMonitor-1.0.0.zip file in to CEP's jaggery app folder and start both ESB and CEP with ESB server with a port off set.

Then user can access the jaggery app at following URL.

https://localhost:<CEP_server_port>/emailMonitor/

[1] https://github.com/Wihidum/NewEmailMonitor