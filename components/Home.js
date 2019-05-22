import React, { Component } from "react";
import {
  View,
  Image,
  TextInput,
  ActivityIndicator,
  Platform
} from "react-native";
import styles from "../styles/homeStyles";
import { connect } from "react-redux";
import Picker from "./Picker";
import { changeCountry, calculateTip, setError } from "../actions";
import ValidatedTip from "./ValidatedTip";
import DeviceInfo from "react-native-device-info";
import { countries } from "../countryList";
import AsyncStorage from "@react-native-community/async-storage";
import Title from "./Title";

class Home extends Component {
  state = {
    //the user entered amount from which the tip is to be calculated
    inputValue: null
  };

  //perform validation after every key press
  handleChange = event => {
    this.setState({ inputValue: event });
    if (this.props.country.tips[this.props.country.selectedTipIndex] !== null) {
      if (isNaN(event)) {
        this.props.setError("NOT_A_NUMBER");
      } else if (event < 0) {
        this.props.setError("NEGATIVE");
      } else if (event === "") {
        this.props.calculateTip(0);
        this.props.setError(null);
      } else if (event >= 0) {
        this.props.calculateTip(event);
        this.props.setError(null);
      }
    }
  };

  componentWillMount() {
    //get persisted country from AsyncStorage
    this.getCountryFromDevice();
  }

  getCountryFromDevice = async () => {
    try {
      const value = await AsyncStorage.getItem("COUNTRY");
      if (value !== null) {
        //found a persisted country
        this.props.changeCountry(value);
      } else {
        //no persisted country available
        const countryCode = DeviceInfo.getDeviceCountry();
        for (let i = 0; i < countries.length; i++) {
          if (countryCode === countries[i].flag) {
            this.props.changeCountry(countries[i].name);
          }
        }
        if (this.props.country.name === null) {
          //could not get device country. defaulting to first country in list (Afghanistan)
          this.props.changeCountry(countries[0].name);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  shouldComponentUpdate(nextProps, nextState) {
    //Detecting if country has changed
    if (nextProps.country.name !== this.props.country.name) {
      //Reset error when changing country
      if (this.props.err !== null) {
        this.props.setError(null);
        return true;
      }
      let prefixRemovedValue = this.state.inputValue;
      //Checking if currency symbol needs to be removed
      if (prefixRemovedValue !== null && isNaN(prefixRemovedValue)) {
        const { currency } = this.props.country;
        //Removing currency symbol
        if (currency.length === 1) {
          prefixRemovedValue = prefixRemovedValue.slice(1);
        } else if (currency.length === 2) {
          prefixRemovedValue = prefixRemovedValue.slice(2);
        } else if (currency.length === 3) {
          prefixRemovedValue = prefixRemovedValue.slice(3);
        } else if (currency.length === 4) {
          prefixRemovedValue = prefixRemovedValue.slice(4);
        } else {
          //error occured
          prefixRemovedValue = null;
        }
        //checking that input value is a valid number to which a currency symbol should be appended
        if (
          prefixRemovedValue !== null &&
          !isNaN(prefixRemovedValue) &&
          prefixRemovedValue > 0
        ) {
          this.setState({
            inputValue: `${nextProps.country.currency}${prefixRemovedValue}`
          });
        }
      }
    }
    return true;
  }

  render() {
    //Only need text input if country accepts tips
    const getTextInput =
      this.props.country.tips[this.props.country.selectedTipIndex] ===
      null ? null : (
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          returnKeyType="done"
          onChangeText={this.handleChange}
          placeholder="amount..."
          placeholderTextColor="#666"
          maxLength={8}
          onBlur={() => {
            if (!isNaN(this.state.inputValue) && this.state.inputValue > 0) {
              this.setState({
                inputValue: `${this.props.country.currency}${
                  this.state.inputValue
                }`
              });
            }
          }}
          onFocus={() => {
            //remove currency symbol while user is typing
            let prefixRemovedValue = this.state.inputValue;
            let sliceAmount = 0;
            if (prefixRemovedValue !== null && isNaN(prefixRemovedValue)) {
              const { currency } = this.props.country;
              if (currency.length === 1) {
                sliceAmount = 1;
              } else if (currency.length === 2) {
                sliceAmount = 2;
              } else if (currency.length === 3) {
                sliceAmount = 3;
              } else if (currency.length === 4) {
                sliceAmount = 4;
              } else {
                //error occured
                prefixRemovedValue = null;
              }
              if (prefixRemovedValue !== null) {
                prefixRemovedValue = prefixRemovedValue.slice(sliceAmount);
              }
            }
            if (
              prefixRemovedValue !== null &&
              !isNaN(prefixRemovedValue) &&
              prefixRemovedValue > 0
            ) {
              this.setState({
                inputValue: this.state.inputValue.slice(sliceAmount)
              });
            } else {
              this.setState({ inputValue: null });
            }
          }}
          value={this.state.inputValue}
        />
      );

    //Adding whitespace for a better look
    const getBuffer =
      this.props.country.tips[this.props.country.selectedTipIndex] ===
      null ? null : this.props.country.name === null ? null : (
        <View style={styles.buffer} />
      );

    //to best comply with UI guidelines flags on Android will be shiny and iOS will be flat
    const flagAppearance = Platform.OS === "ios" ? "flat" : "shiny";

    //getting the country flag
    const flagImgUrl = `https://www.countryflags.io/${
      this.props.country.flag
    }/${flagAppearance}/64.png`;

    //This is where the user can select a country. display activity indicator until country loaded
    const getCountryRow =
      this.props.country.name === null ? (
        <ActivityIndicator size="large" style={{ marginTop: 150 }} />
      ) : (
        <View style={styles.countryRow}>
          <View style={styles.flag}>
            <Image
              source={{ uri: flagImgUrl }}
              style={{ width: 50, height: 50 }}
            />
          </View>
          <View style={styles.picker}>
            <Picker />
          </View>
        </View>
      );

    //This is where the user can enter an amount from which the tip will be calculated
    const getTipRow =
      this.props.country.name === null ? null : (
        <View style={styles.tipRow}>
          {getTextInput}
          <View style={styles.description}>
            <ValidatedTip />
          </View>
        </View>
      );

    return (
      <View style={styles.container}>
        <Title />
        {getBuffer}
        {getCountryRow}
        {getTipRow}
      </View>
    );
  }
}

const mapStateToProps = state => {
  return {
    country: state.country,
    enteredValue: state.enteredValue,
    amount: state.amount,
    err: state.err
  };
};

const mapDispatchToProps = dispatch => {
  return {
    changeCountry: country => {
      dispatch(changeCountry(country));
    },
    calculateTip: amount => {
      dispatch(calculateTip(amount));
    },
    setError: error => {
      dispatch(setError(error));
    }
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Home);
