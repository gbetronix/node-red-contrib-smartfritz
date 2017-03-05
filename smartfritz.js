var fritz = require('fritzapi');

module.exports = function(RED) {

  function SmartfritzConfigNode(n) {
    RED.nodes.createNode(this, n);
    var node = this;
    node.fritzurl = n.fritzurl;
    node.sid = null;
    var sessionID;

    try {
      node.log('Init SmartfritzConfigNode.');
      if (!node.credentials.username) {
        node.error('Empty username.');
        return;
      }
      node.log('Username: ' + node.credentials.username);

      fritz.getSessionID(node.credentials.username, node.credentials.password, { url:node.fritzurl })
        .then(function(sessionID) {
            node.log('Session ID: ' + sessionID);
            if ((!sessionID) || (sessionID === '0000000000000000')) {
              node.error('Error logging in to Fritz URL: ' + node.fritzurl +
                '. \nWrong password?');
              return;
            }
            node.sid = sessionID;
            fritz.getSwitchList(sessionID).then( function(switches) {
                node.switches = switches;
            }).catch(function(err){
            	console.error('Invalid sessionID '+sessionID);
            });
          }).catch(function(err) {
              node.error("Did not get session id! Invalid url, username or password? (" + node.fritzurl + ').');
          });

    } catch (err) {
      node.error("Did not get session id! Invalid url, username or password? (" + node.fritzurl + ').');
      return;
    }
  }

  RED.nodes.registerType("smartfritz-config", SmartfritzConfigNode, {
    credentials: {
      username: {
        type: "text"
      },
      password: {
        type: "password"
      }
    }
  });


  /* ---------------------------------------------------------------------------
   * WRITE node
   * -------------------------------------------------------------------------*/
  function FritzWriteNode(n) {
    RED.nodes.createNode(this, n);
    var node = this;
    node.config = RED.nodes.getNode(n.config);

    if (!node.config) {
      node.error("Config node missing.");
      node.status({
        fill: "red",
        shape: "ring",
        text: "Error. Config node missing."
      });
      return;
    }

    node.config.aid = n.aid;
    var sessionID;
    var actorID;

    node.on('input', function(msg) {
      node.log('FritzWriteNode called');
      sessionID = node.config.sid;
      actorID = node.config.aid;

      if (!sessionID) {
        node.error('No session established.');
        node.status({
          fill: "red",
          shape: "ring",
          text: "Error. No session established."
        });
        return;
      }

      if (!actorID) {
          node.error('No AID configured.');
          node.status({
            fill: "red",
            shape: "ring",
            text: "Error. No AID configured."
          });
          return;
        }


      fritz.getSwitchList(sessionID).then( function(switches) {
    	  var found = false;
    	  switches.map(function(sw) {
    		  if (actorID === sw) {
    			  found=true;
    		  }
    	  });
    	  if (!found) {
    		  node.error('AID '+actorID+' not found.');
    		  node.status({
    			  fill: "red",
    			  shape: "ring",
    			  text: "Error. AID "+actorID+" not found."
    		  });
    			  var aids = '';
    			  switches.map(function(sw) {
    				  aids = aids + sw + "\n";
    			  });
    			  node.error('Known AIDs :'+aids);
    		  return;
    	  }
    	  
    	  node.log('AID: ' + actorID);
          node.log('Write SwitchState to:' + msg.payload);

          function retSwitchOnOff(funRet) {
            if (funRet === '') {
              node.error(
                'Error writing Switch. Fritz URL (' +
                node.config.fritzurl +
                ')');
              node.status({
                fill: "red",
                shape: "ring",
                text: "Error writing Switch. Fritz URL (" +
                  node.config.fritzurl +
                  ")"
              });
              return;
            }

            msg.payload = {
              sessionId: sessionID,
              actorID: actorID,
              switchState: funRet
            };
            node.status({
              fill: "green",
              shape: "dot",
              text: "OK"
            });
            node.send(msg);
          }

          if (
            (msg.payload === 'true') || (msg.payload === '1') ||
            (msg.payload === 1) || (msg.payload === true)
          ) {
            node.log('SwitchOn Switch AID: ' + actorID);
            fritz.setSwitchOn(sessionID, actorID, retSwitchOnOff);
          } else if (
            (msg.payload === 'false') || (msg.payload === '0') ||
            (msg.payload === 0) || (msg.payload === false)
          ) {
            node.log('SwitchOff Switch AID: ' + actorID);
            fritz.setSwitchOff(sessionID, actorID, retSwitchOnOff);
          } else {
            node.error('Error interpreting SwitchState: ' +
              msg.payload);
          }

    	  
    	  
      }).catch(function(err){
          node.error('Error: ' + err);
          node.status({
            fill: "red",
            shape: "ring",
            text: "Error" + err
          });
      });

    });
  }

  RED.nodes.registerType('fritz write', FritzWriteNode);


  /* ---------------------------------------------------------------------------
   * READ node
   * -------------------------------------------------------------------------*/
  function FritzReadNode(n) {
    RED.nodes.createNode(this, n);
    var node = this;
    node.config = RED.nodes.getNode(n.config);

    if (!node.config) {
      node.error("Config node missing");
      node.status({
        fill: "red",
        shape: "ring",
        text: "Error. Config node missing"
      });
      return;
    }

    node.config.aid = n.aid;
    var sessionID;
    var actorID;

    node.on('input', function(msg) {
      node.log('FritzReadNode called');
      sessionID = node.config.sid;

      if (!sessionID) {
        node.error('Error no session established.');
        node.status({
          fill: "red",
          shape: "ring",
          text: "Error. No session established."
        });
        return;
      }

      try {
        fritz.getSwitchList(sessionID, function(actorID) {
          if (node.config.aid) {
            node.log('Using configured AID.');
            actorID = node.config.aid;
          }

          if (!actorID) {
            node.error('No Switch found, Fritz URL (' + node
              .config.fritzurl + ')');
            node.status({
              fill: "red",
              shape: "ring",
              text: "Error. No Switch found, Fritz URL (" + node
                .config.fritzurl + ")"
            });
            return;
          }
          node.log('AID: ' + actorID);

          fritz.getSwitchEnergy(sessionID, actorID, function(
            switchEnergy) {

            fritz.getSwitchPower(sessionID, actorID,
              function(
                switchPower) {

                fritz.getSwitchState(sessionID, actorID,
                  function(switchState) {


                    msg.payload = {
                      sessionID: sessionID,
                      actorID: actorID,
                      switchState: switchState,
                      switchEnergy: switchEnergy,
                      switchPower: switchPower
                    };

                    if (switchState ==
                      'HTTP/1.0 500 Internal Server Error\nContent-Length: 0\nContent-Type: text/plain; charset=utf-8'
                    ) {
                      node.error(
                        'Switch not ready (yet).'
                      );
                      node.log('msg.payload: ' + JSON.stringify(
                        msg.payload));
                      node.status({
                        fill: "red",
                        shape: "ring",
                        text: "Error. Switch not ready (yet)."
                      });
                      return;
                    }
                    if (
                      (switchEnergy === 'inval') ||
                      (switchPower === 'inval') ||
                      (switchState === 'inval')
                    ) {
                      node.error(
                        'Error Switch values invalid.'
                      );
                      node.log('msg.payload: ' + JSON.stringify(
                        msg.payload));
                      node.status({
                        fill: "red",
                        shape: "ring",
                        text: "Error. Switch values invalid."
                      });
                      return;
                    }

                    node.status({
                      fill: "green",
                      shape: "dot",
                      text: "OK"
                    });
                    node.send(msg);
                  });
              });
          });
        });
      } catch (err) {
        node.error('Error: ' + err);
        node.status({
          fill: "red",
          shape: "ring",
          text: "Error" + err
        });
      }
    });
  }

  RED.nodes.registerType('fritz read', FritzReadNode);
};
