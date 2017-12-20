Modern web applications require an authentication solution thats flexible enough to go where your users are. Auth0 provides just that. They provide a framework of tools to authenticate your users on mobile and web. 

### Installation

Once you've installed react native, create a stock react native application

```zsh
$ create-react-native-app Auth0Example
$ cd Auth0Example

```


*note:  do not use '-' charachter in your names. Somthing about it keeps breaking gradle down below.*

#### Ejecting

If you have a recent version of react native, you probably noticed a distinct lack of ios or android folders. React-native assumes you will write your app in pure javascript. If you have no intention of using an oauth flow, you don't really need it. However, I've never had a client that didn't want facebook or google login. 

This means we need to stray off the neat path react native lays out into some serious evil dead territory. Beware the trees...

Ejecting is a permanent change to react-native setup that causes it to spit out an android and ios folder with their respective build folders. This means you will need to install gradle(https://gradle.org/install/), [maven](https://maven.apache.org/download.cgi) and [pods](https://cocoapods.org/)

```
$ brew install gradle
$ brew install maven
$ gem install cocoapods
```


```
$ yarn eject
```
![Screen Shot 2017-12-19 at 2.22.44 PM.png](https://cdn.filestackcontent.com/Fo8wLScBSeVMWIytfUHm)

Create your ios and android identifiers and keep them noted. Once the script has run, you should now see android and ios folders.

From here, make sure you have adb setup. Adb is the android commandline tools for interacting with and android device. You can install them using android studio. In addition, I reccomend installing genymotion. It includes its own adb tooling. add the path to those tools to the $PATH in your `.bashrc` or `zshrc`.

```
export PATH=$HOME/bin:/Applications/Genymotion.app/Contents/MacOS/tools:$PATH
export ANDROID_HOME=$HOME/Library/Android/sdk
```

You will need to start genymotion and start a vm. Have it running in the background before you run the android build. the ios script launches the simulator automatically.

From the top level, we need to reset things and reinstall our modules. (might not be necessary for you but I found myself doing a lot of mantra reciting here). Run open 3 terminals to your project root directory.
```
1$ rm -rf node_modules
1$ yarn install
1$ yarn start
2$ yarn run ios
3$ yarn run android
```
 
 *fingers crossed*, you should have an ios and android emulator running side by side.
 
![initial-rn-export.png](https://cdn.filestackcontent.com/dOctbzaSaOMjDHUSh9Yn)

Next we need to install auth0. Auth0 has official native modules for both ios and android. In this tutorial, I will use the officia react native library: [react-native-auth0](https://github.com/auth0/react-native-auth0), to set up authentication.

```zsh
$ yarn add react-native-auth0
$ react-native link react-native-auth0
$ yarn run ios
$ yarn run android
```
we run the builds for ios and android again because we are now hooking in native code modules.

Now its time to setup our login process.

###Setup

if you haven't already setup an auth0 account, now's a good time. In the top right hand corner, you will see your accounts manager. Create a new Tenant.
![new-tenant.png](https://cdn.filestackcontent.com/3AnqN0kDQ5ioN5RuawgD)

A Tenant represents a federation of clients that share a base of users. Lets say I wanted to create my own super duper project management hub called "TopCamp".The set of users in my saas would be a tenant and the clients would be web and mobile respectivly. I might even go so far as to have diffrent kinds of web applications for my own backend teams and customer service vs the main product. By using Auth0, I can specify diffrent authentication policies for each respective entry to my application.

The important thing here is that each tenant has a cannonical domain which is chosen when we create the tenant.

![Screen Shot 2017-12-19 at 1.36.52 PM.png](https://cdn.filestackcontent.com/KvPE3FWnShuyIxPFob6L)

Next, we create our first client. This will be the authentication policy used by our react-native application.

![new-client.png](https://cdn.filestackcontent.com/aqeSPRfpT61q1RWs0UWd)

![Screen Shot 2017-12-19 at 1.42.14 PM.png](https://cdn.filestackcontent.com/AQuyMUrzTrWGAXUdEkTF)

Now that you have a client, go to the settings page were we will get the details necessary to configure out mobile app.

![Screen Shot 2017-12-19 at 1.43.29 PM.png](https://cdn.filestackcontent.com/FNAmh4AR4exfX07P9ulJ)

Now we just need to add a singleton for our instantiated auth0 instance. Create a file `src/lib/auth0.js`.

```js

import Auth0 from 'react-native-auth0';

const AUTH0_DOMAIN = 'auth0-login-example.auth0.com';
const CLIENT_ID = 'cZXbmzjn5vnMjZzwxhFc4foDWU1Wq4AA';

const auth0 = new Auth0({
  domain: `${AUTH0_DOMAIN}`,
  clientId: `${CLIENT_ID}` 
});

export {
  auth0,
  AUTH0_DOMAIN,
  CLIENT_ID
};

```

### Getting your Identifiers

Ios and Android have special they use to denote their packages.

To get your android bundle identifier, find `android/app/src/main/AndroidManifest.xml` and locate `package="${BUNDLE_IDENTIFIER}"`

![manifest.png](https://cdn.filestackcontent.com/IVzop7yFS22X72UMoFq1)

Your ios package name will be the value of the name proprty at the top level's app.json.

```json
{
  "expo": {
    "sdkVersion": "23.0.0"
  },
  "name": "Auth0Example",
  "displayName": "auth0 login"
}
```

next inside your `android/app/src/main/AndroidManifest.xml`, you will want to add `android:launchMode="singleTask"` to the Activity and add an intent. It should look like this

```
<activity
  android:name=".MainActivity"
  android:label="@string/app_name"
  android:launchMode="singleTask"
  android:configChanges="keyboard|keyboardHidden|orientation|screenSize"
  android:windowSoftInputMode="adjustResize">
  <intent-filter>
      <action android:name="android.intent.action.MAIN" />
      <category android:name="android.intent.category.LAUNCHER" />
  </intent-filter>
  <intent-filter>
      <action android:name="android.intent.action.VIEW" />
      <category android:name="android.intent.category.DEFAULT" />
      <category android:name="android.intent.category.BROWSABLE" />
      <data
          android:host="auth0-login-example.auth0.com"
          android:pathPrefix="/android/${applicationId}/callback"
          android:scheme="${applicationId}" />
  </intent-filter>
</activity>
```

Note the `android:host="auth0-login-example.auth0.com"`, this would be the auth0 domain that you selected.

Next, we add to the ios build. Locate the Appdelegate.m by finding `ios/{PACKAGE_NAME}/AppDelegate.[swift|m]` and add the following 

```
#import <React/RCTLinkingManager.h>

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url
  sourceApplication:(NSString *)sourceApplication annotation:(id)annotation
{
  return [RCTLinkingManager application:application openURL:url
                      sourceApplication:sourceApplication annotation:annotation];
}
```

Next locate Info.plist in the same directory and locate a line of code that looks like this.

```
<key>CFBundleIdentifier</key>
<string>org.reactjs.native.example.$(PRODUCT_NAME:rfc1034identifier)</string>
```

the `PRODUCT_NAME:rfc1034identifier` is a unique value we need to use for adding a url type. Underneath that key string pair, add the following, subsituting the identifier value with whatever you have for CFBundleIdentifier.

```
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleTypeRole</key>
        <string>None</string>
        <key>CFBundleURLName</key>
        <string>auth0</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>org.reactjs.native.example.$(PRODUCT_NAME:rfc1034identifier)</string>
        </array>
    </dict>
</array>

```



rerun `yarn run ios && yarn run android to load the changes.

Lets return to the auth0 client page we were on earlier. Here we need to add in some callback urls.

for ios, look back at that line.

```
<string>org.reactjs.native.example.$(PRODUCT_NAME:rfc1034identifier)</string>
```
this evaluates to the callback token you'll use in ios. So in my case, the package name is `com.auth0example` so my callback token is `org.reactjs.native.example.Auth0Example`

```
// ios
{PRODUCT_BUNDLE_IDENTIFIER}://auth0-login-example.auth0.com/ios/{PRODUCT_BUNDLE_IDENTIFIER}/callback
// -- example:
org.reactjs.native.example.Auth0Example://auth0-login-example.auth0.com/ios/org.reactjs.native.example.Auth0Example/callback

//andoid

{YOUR_APP_PACKAGE_NAME}://auth0-login-example.auth0.com/android/{YOUR_APP_PACKAGE_NAME}/callback
// -- example
com.auth0example://auth0-login-example.auth0.com/android/com.auth0example/callback

```

![Screen Shot 2017-12-19 at 6.03.13 PM.png](https://cdn.filestackcontent.com/HbyBThCSlJcuX5vkCyBQ)


with that, we can test the authentication flow from App.js

```
import React from 'react';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';

import { auth0, AUTH0_DOMAIN } from './src/lib/auth0';
export default class App extends React.Component {
  loginWindow() {
    //Alert.alert('You tapped the button!');
    auth0
      .webAuth
      .authorize({scope: 'openid profile email', audience: `https://${AUTH0_DOMAIN}/userinfo`, useBrowser: true})
      .then(credentials => {
        console.log(credentials)
        Alert.alert('You tapped the button!');
        // Successfully authenticated
        // Store the accessToken
      })
      .catch(error => console.log(error));

  }
  render() {
    return (
      <View style={styles.container}>
        <Text>auth0 login example!!</Text>
        <Text>Changes you make will automatically reload.</Text>
        <Text>Shake your phone to open the developer menu.</Text>
        <Button
          title="login"
          onPress={() => this.loginWindow()}
        />
      
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});


```

click on the button and you should see the screen

![Screen Shot 2017-12-20 at 1.51.40 AM.png](https://cdn.filestackcontent.com/SGCD0skhRUlEOuZIAo29)

And now you have an auth0 based login! 











