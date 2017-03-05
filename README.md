# Bugfixed SmartFritz for Node-RED (bugfix not finalized)
1. switch to fritzapi: Ok
2. update api usage: writer Ok, reader under dev
3. bugfix multi actor: writer Ok, reader under dev
4. enhance configuration for selectable actors: under dev
5. cleanup and format source code: under dev

Easily integrate AVM Fritz!Dect 200 switches into your node-RED flow. Based on the smartfritz-promise library.
Please make sure to give some critical feedback. :)

## Installation
Use `npm install node-red-contrib-smartfritz` to install.

## Usage
This package provides nodes to read and write signals to Fritz!Dect 200 switches via Node-RED. The configuration node lets you setup your Fritz!Box account and Actor Identification (AID).

The fritz read node is used to read the switch state (1/on, 0/off) from a Fritz!Dect 200 device. Make sure to use a valid AID or leave it empty. The message contains the info structure in `msg.payload`.

The fritz write node is used to write the switch state (1/on, 0/off) from a Fritz!Dect 200 device. Make sure to use a valid AID or leave it empty. The message can contain boolean or string values in `msg.payload`.

## Contributing
1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## History

## Credits
Pedro Reboredo

## License
MIT
