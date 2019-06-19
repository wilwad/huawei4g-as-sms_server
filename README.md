# huawei4g-as-sms_server
Use a Huawei 4G E5186s-22a router as an SMS Server using Node

![Interface](https://github.com/wilwad/huawei4g-as-sms_server/blob/master/s-l640.jpg)

Apart from providing 4G internet connectivity, this router also has SMS receive and send capability.
Unfortunately you need to login to the web interface to read and compose text messages.
Javascript is used to talk to the router's API.

Here are the notable REST routes used by the router

![Interface](https://github.com/wilwad/huawei4g-as-sms_server/blob/master/routes.png)

What would you use this for?

You can send an SMS from your application (e.g. bash). Get a list of received messages and auto respond on keywords.

Let's get started

huawei4G.js -- set the router url (default 192.168.8.1), user and password
huawei4G.websocket.server.js -- node huawei4G.websocket.server.js to start the test WebSocket Server

![Interface](https://github.com/wilwad/huawei4g-as-sms_server/blob/master/server.png)

huawei4G.websocket.client.interval.js -- node huawei4G.websocket.client.interval.js to start a WebSocket test client that sends api/sms/sms-count to the WebSocket server to get total number of messages read (and a list of new messages if there are any).

![Interface](https://github.com/wilwad/huawei4g-as-sms_server/blob/master/websocket-interval-get-sms-unreadcount.png)

huawei4G.websocket.client.js -- node huawei4G.websocket.client.js to start the test WebSocket client. 
Type routes to get a list of the REST routes and specify some routes to get a response from the router.
E.g. api/wlan/basic-settings, would return:

![Interface](https://github.com/wilwad/huawei4g-as-sms_server/blob/master/websocket-client-routes.png)

To get you started, included are tests

unittest.request.sms_get_list.js -- Get list of text messages

unittest.request.sms_send.js -- Send an sms

unittest.request.sms_set_read.js -- Set sms status to read

unittest.request.sms_delete.js -- Delete an sms
