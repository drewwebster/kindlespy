# KindleSpy

[KindleSpy](http://www.kdspy.com/) is the ultimate amazon spy tool.

It's a browser plugin for chrome, opera and firefox.

## Pre-requirements
### Firefox
* Node.js from [nodejs.org](https://nodejs.org/download/)
* [jpm](https://developer.mozilla.org/en-US/Add-ons/SDK/Tools/jpm) tool can be installed from node.js **npm install jpm -g**

* Firefox browser

Note: Python 2.* is not needed anymore.

### Chrome
* Chrome browser

## Install
### Firefox
1. Run command window `cmd`
3. Go to the project folder `cd project_folder`
4. Use `jpm run` command to run a new instance of Firefox with the add-on installed
5. You can use the `jpm run --profile=c:\firefox-profile` to store profile data and use it in future

### Chrome
1. Open [extensions](chrome://extensions) page in chrome
2. Turn on the **developer mode**
3. Click **Load unpacked extension...** to pop up a file-selection dialog
4. Navigate to project_folder\data folder

# Packaging
### Firefox
The command **jpm xpi** from the mozilla SDK can be used to package the add-on into an XPI file for distribution

### Chrome
Packaging of chrome extension is described [here](https://developer.chrome.com/extensions/packaging)