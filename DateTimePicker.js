import React, { Component } from 'react';
import {
    DatePickerIOS,
    DatePickerAndroid,
    Dimensions,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TimePickerAndroid,
    View,
} from 'react-native';
import Button from 'react-native-osd-simple-button';

const styles = StyleSheet.create({
    dateDisplay: {
        backgroundColor: '#FFFFFF',
        ...(Platform.OS === 'ios'
            ? {
                borderWidth: 1,
                borderRadius: 4, // Tried to fit with the apple doc https://developer.apple.com/library/ios/documentation/UserExperience/Conceptual/MobileHIG/Controls.html#//apple_ref/doc/uid/TP40006556-CH15-SW1
            }
            : {},
        ),
        borderColor: '#DDDDDD',
        justifyContent: 'center',
        padding: 5,
    },
    dateTextContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 5,
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    iosClosePickerButton: {
        backgroundColor: '#00CC00',
        width: Dimensions.get('window').width,
        borderWidth: 0,
        borderRadius: 0,
        marginBottom: 0,
    },
    iosPickerContainer: {
        position: 'absolute',
        bottom: 0,
        width: Dimensions.get('window').width,
        backgroundColor: '#FFFFFF',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    label: {
        flex: 1,
    },
    value: {
        flex: 1,
        textAlign: 'right',
    },
});

export default class DateTimePicker extends Component {
    static propTypes = {
        date: React.PropTypes.oneOfType([
            React.PropTypes.date,
            React.PropTypes.string,
        ]),
        label: React.PropTypes.string,
        mode: React.PropTypes.oneOf([
            'datetime',
            'date',
            'time',
        ]),
        onChange: React.PropTypes.func.isRequired,
        renderAndroidButton: React.PropTypes.func,
    };

    static defaultProps = {
        label: 'Date',
        mode: 'datetime',
    };

    constructor(props) {
        super(props);

        const currentDate = typeof props.date === 'string'
            ? this.parseStringDate(props.date)
            : null;

        this.state = {
            date: currentDate,
            mode: props.mode,
            pickerVisible: false,
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.date) {
            this.setState({
                date: typeof nextProps.date === 'string'
                    ? this.parseStringDate(nextProps.date)
                    : null,
            });
        }
    }

    getDisplayValue = (date) => {
        if (!date) {
            return null;
        }

        if (this.props.mode === 'time') {
            date.setSeconds(0);

            return date.toLocaleTimeString();
        } else if (this.props.mode === 'date') {
            return date.toLocaleDateString();
        } else {
            return date.toLocaleString();
        }
    }

    parseStringDate = (stringDate) => {
        const date = new Date(stringDate);

        const parsedDate = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            date.getHours(),
            date.getMinutes()
        );

        return parsedDate;
    };

    handleDateChange = (date) => {
        this.setState({ date });
        this.props.onChange(this.getDisplayValue(date));
    };

    handleAndroidPickerDisplay = () => {
        if (this.props.mode === 'date' || this.props.mode === 'datetime') {
            DatePickerAndroid.open({
                date: this.state.date || new Date(),
            })
            .then(({ datePickerAction, year, month, day }) => {
                if (datePickerAction !== DatePickerAndroid.dismissedAction) {
                    if (this.props.mode === 'datetime') {
                        TimePickerAndroid.open({
                            date: this.state.date,
                            is24Hour: true,
                        })
                        .then(({ timePickerAction, hour, minute }) => {
                            if (timePickerAction !== TimePickerAndroid.dismissedAction) {
                                const dateWithHoursAndMinutes = new Date(
                                    year,
                                    month,
                                    day,
                                    hour,
                                    minute
                                );

                                this.handleDateChange(dateWithHoursAndMinutes);
                            }
                        })
                        .catch(({ code, message }) => console.info(`Cannot open date picker ${code}`, message));
                    } else {
                        const newDate = new Date(year, month, day);

                        this.handleDateChange(newDate);
                    }
                }
            })
            .catch(({ code, message }) => console.info(`Cannot open date picker ${code}`, message));
        } else if (this.props.mode === 'time') {
            TimePickerAndroid.open({
                date: this.state.date,
                is24Hour: true,
            })
            .then(({ action, hour, minute }) => {
                if (action !== TimePickerAndroid.dismissedAction) {
                    const date = new Date();

                    date.setHours(hour);
                    date.setMinutes(minute);

                    this.handleDateChange(date);
                }
            })
            .catch(({ code, message }) => console.info(`Cannot open date picker ${code}`, message));
        }
    };

    handleIOSPickerDisplay = () => {
        this.setState({
            pickerVisible: true,
        });
    };

    handleClose = () => {
        this.setState({
            pickerVisible: false,
        });

        if (!this.state.date) {
            this.handleDateChange(new Date());
        }
    };

    render() {
        let iosPicker = null;

        if (Platform.OS === 'ios') {
            iosPicker = (
                <Modal
                    animationType={'slide'}
                    transparent={true}
                    visible={this.state.pickerVisible}
                    onRequestClose={this.handleClose}
                >
                    <View
                        style={styles.modalBackground}
                    >
                        <View style={styles.iosPickerContainer}>
                            <DatePickerIOS
                                date={this.state.date || new Date()}
                                mode={this.state.mode}
                                onDateChange={this.handleDateChange}
                            />
                            <Button
                                containerStyle={styles.iosClosePickerButton}
                                text={'Done'}
                                underlayColor={'#00AA00'}
                                onPress={this.handleClose}
                            />
                        </View>
                    </View>
                </Modal>
            );
        }

        const toRender = (
            <View>
                <Button
                    containerStyle={styles.dateDisplay}
                    textContainerStyle={styles.dateTextContainer}
                    onPress={Platform.OS === 'ios'
                        ? this.handleIOSPickerDisplay
                        : this.handleAndroidPickerDisplay
                    }
                    underlayColor={'rgba(0, 0, 0, 0.5)'}
                >
                    <Text style={styles.label}>{this.props.label}</Text>
                    <Text style={styles.value}>
                        {this.getDisplayValue(this.state.date)}
                    </Text>
                </Button>
                {iosPicker}
            </View>
        );


        return (
            <View>
                {Platform.OS === 'android' && this.props.renderAndroidButton
                    ? (this.props.renderAndroidButton)()
                    : toRender
                }
            </View>
        );
    }
}
