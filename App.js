import React from 'react';
import { ListView, Text, TextInput, TouchableHighlight, View, StyleSheet, Dimensions, Button, ActivityIndicator } from 'react-native';
import { StackNavigator} from 'react-navigation';
import { Constants } from 'expo';
import { ChallengeScreen } from './Screens/ChallengeScreen.js';
import { HomeScreen } from './Screens/HomeScreen.js';
import { MorningScreen } from './Screens/MorningScreen.js';
import { PersonalScreen } from './Screens/PersonalScreen.js';
import { ProgressScreen } from './Screens/ProgressScreen.js';
import { SettingsScreen } from './Screens/SettingsScreen.js';
import { SummaryScreen } from './Screens/SummaryScreen.js';
import { Permissions, Notifications } from 'expo';


//let PUSH_ENDPOINT = "http://192.168.43.75:8080/push";
//let PUSH_ENDPOINT = "http://s134859.ml:8080/push";
//let ENDPOINT = "http://34.240.2.7:8080"
let ENDPOINT = "http://10.16.140.153:8080"
let PUSH_ENDPOINT = ENDPOINT+"/pushtoken";
let STATE_ENDPOINT = ENDPOINT+"/getstate";
let NOTIFICATION_PUSHENDPOINT = ENDPOINT+"/addnotification";
let NOTIFICATION_UPDATEENDPOINT = ENDPOINT+"/updatenotification";

const SleepBetter = StackNavigator({
  Home: { screen: HomeScreen, navigationOptions: { header: null }},
  Progress: { screen: ProgressScreen, navigationOptions: { header: null } },
  Morning: { screen: MorningScreen, navigationOptions: { header: null }},
  DailySummary: { screen: SummaryScreen, navigationOptions: { header: null } },
  PersonalOverview: { screen: PersonalScreen, navigationOptions: { header: null }},
  Settings: { screen: SettingsScreen, navigationOptions: { header: null } },
  Challenges: { screen: ChallengeScreen, navigationOptions: { header: null } }
},
{ initialRouteName: 'Home'},
);

async function registerForPushNotificationsAsync() {
  const { status: existingStatus } = await Permissions.getAsync(
    Permissions.NOTIFICATIONS
  );
  let finalStatus = existingStatus;

  // only ask if permissions have not already been determined, because
  // iOS won't necessarily prompt the user a second time.
  if (existingStatus !== 'granted') {
    // Android remote notification permissions are granted during the app
    // install, so this will only ask on iOS
    const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
    finalStatus = status;
  }
  // Stop here if the user did not grant permissions
  if (finalStatus !== 'granted') {
    return;
  }
  // Get the token that uniquely identifies this device
  let token = await Notifications.getExpoPushTokenAsync();

  return token;

}

export default class App extends React.Component {
constructor(){
    super();
    this.state = {
        token: "",
        notification: [],
        username: "",
        registered: false,
        loading: true
    };
}

handleUsername =(text)=>{
    this.setState({ username: text })
}



ChangeTextFunction =()=>{
    (async() =>{
        let token = await registerForPushNotificationsAsync();
        console.log(token)

    this.setState({
        token: token
    })
    //alert('Token: ' + token + ' Username: ' + this.state.username)
    fetch(PUSH_ENDPOINT,{
    method: 'POST',
    headers: {
                 'Accept': 'application/json',
                 'Content-Type': 'application/json',
    },
    body: JSON.stringify(this.state),
})
      .then((response) => response.json())
      .then((responseJson) => {
        if(responseJson.success){
            alert(responseJson.success)
        }else{
            console.log(responseJson)
        }

      })
      .catch((error) =>{
        console.error(error);
      });

    })();
}


 async componentDidMount() {
   let token = await registerForPushNotificationsAsync();
   url = ENDPOINT + "/getstate/"+token
   console.log(url)
   fetch(url)
   .then((response) => response.json())
   .then((responseJson) => {
       console.log("HANDLED LOGIN")
       console.log(responseJson)
       if(responseJson){
           this.setState({registered: true,token:token,loading: false})
       } else{
           this.setState({token:token,loading: false})
       }
   })

   // Handle notifications that are received or selected while the app
   // is open. If the app was closed and then opened by tapping the
   // notification (rather than just tapping the app icon to open it),
   // this function will fire on the next tick after the app starts
   // with the notification data.
   this._notificationSubscription = Notifications.addListener(this._handleNotification);
 }

 _handleNotification = (notification) => {
   this.setState({notification: notification});
   console.log(notification);
   if(notification.origin == "received" || notification.origin == "selected"){
   console.log("Handle OK");

   fetch(NOTIFICATION_UPDATEENDPOINT,{
       method: 'POST',
       headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
       body: JSON.stringify(notification),
   })
     .then((response) => response.json())
     .then((responseJson) => {
       if(responseJson.success){
           alert(responseJson.success)

       }else{
           alert(responseJson)
       }


     })
     .catch((error) =>{
       console.error(error);
     });

 }
};

  render() {
    if(this.state.loading){
        return(
        <View style={[styles.container, styles.horizontal]}>
            <ActivityIndicator size="large" color="#0000ff" />
        </View>);
    } else {


        if(this.state.registered){
        return (
          <View style={styles.container}>
            <SleepBetter style={{ width: Dimensions.get("window").width }} />
          </View>
        );
        } else{

            return(
            <View style={styles.container}>
                <Text>{this.state.token}</Text>
                <TextInput style = {styles.input}
                      underlineColorAndroid = "transparent"
                      placeholder = "Email"
                      placeholderTextColor = "#9a73ef"
                      autoCapitalize = "none"
                      onChangeText = {this.handleUsername}/>
                <Button title="Register Phone for Experiment" onPress={this.ChangeTextFunction}/>
                </View>
);
    }
    }
}
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#fff',
  }
})
