// import {
//   View,
//   Text,
//   StyleSheet,
//   Switch,
//   TouchableOpacity,
//   Alert,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { useNotification } from "../../context/notification-context";
// import { useTheme } from "../../context/theme-context";

// const NotificationSettings = () => {
//   const { theme } = useTheme();
//   const {
//     settings,
//     permissionGranted,
//     toggleNotifications,
//     toggleHealthReminders,
//     requestPermissions,
//   } = useNotification();

//   const handleRequestPermissions = async () => {
//     const granted = await requestPermissions();
//     if (!granted) {
//       Alert.alert(
//         "Permission Required",
//         "Please enable notifications in your device settings to receive reminders.",
//         [{ text: "OK" }]
//       );
//     }
//   };

//   return (
//     <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
//       <View style={styles.header}>
//         <Ionicons name="notifications" size={22} color={theme.primary} />
//         <Text style={[styles.headerText, { color: theme.text }]}>
//           Notifications
//         </Text>
//       </View>

//       {!permissionGranted && (
//         <View
//           style={[styles.permissionWarning, { backgroundColor: "#FFF3E0" }]}
//         >
//           <Ionicons
//             name="warning-outline"
//             size={20}
//             color="#FF9800"
//             style={styles.warningIcon}
//           />
//           <Text style={styles.warningText}>
//             Notifications are disabled. Enable them to receive important
//             reminders.
//           </Text>
//           <TouchableOpacity
//             style={[
//               styles.permissionButton,
//               { backgroundColor: theme.primary },
//             ]}
//             onPress={handleRequestPermissions}
//           >
//             <Text style={styles.permissionButtonText}>Enable</Text>
//           </TouchableOpacity>
//         </View>
//       )}

//       <View style={styles.settingRow}>
//         <View style={styles.settingInfo}>
//           <Text style={[styles.settingTitle, { color: theme.text }]}>
//             Enable All Notifications
//           </Text>
//           <Text
//             style={[styles.settingDescription, { color: theme.textSecondary }]}
//           >
//             Receive all app notifications
//           </Text>
//         </View>
//         <Switch
//           value={settings.enabled}
//           onValueChange={(value) => toggleNotifications(value)}
//           trackColor={{ false: "#D1D1D6", true: `${theme.primary}80` }}
//           thumbColor={settings.enabled ? theme.primary : "#F4F4F4"}
//           ios_backgroundColor="#D1D1D6"
//         />
//       </View>

//       <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

//       <View style={styles.settingRow}>
//         <View style={styles.settingInfo}>
//           <Text
//             style={[
//               styles.settingTitle,
//               { color: settings.enabled ? theme.text : theme.textTertiary },
//             ]}
//           >
//             Vaccination Reminders
//           </Text>
//           <Text
//             style={[
//               styles.settingDescription,
//               {
//                 color: settings.enabled
//                   ? theme.textSecondary
//                   : theme.textTertiary,
//               },
//             ]}
//           >
//             Daily reminders for due vaccinations
//           </Text>
//         </View>
//         <Switch
//           value={settings.enabled && settings.healthReminders}
//           onValueChange={(value) => toggleHealthReminders(value)}
//           trackColor={{ false: "#D1D1D6", true: `${theme.primary}80` }}
//           thumbColor={
//             settings.enabled && settings.healthReminders
//               ? theme.primary
//               : "#F4F4F4"
//           }
//           ios_backgroundColor="#D1D1D6"
//           disabled={!settings.enabled}
//         />
//       </View>

//       <View style={styles.infoContainer}>
//         <Text style={[styles.infoText, { color: theme.textSecondary }]}>
//           Vaccination reminders will be sent daily at 12:00 PM when your child
//           has vaccinations due in the current month.
//         </Text>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     borderRadius: 12,
//     marginBottom: 16,
//     overflow: "hidden",
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: "#F0F0F0",
//   },
//   headerText: {
//     fontSize: 16,
//     fontWeight: "600",
//     marginLeft: 10,
//   },
//   permissionWarning: {
//     flexDirection: "row",
//     alignItems: "center",
//     padding: 12,
//     marginHorizontal: 16,
//     marginTop: 12,
//     borderRadius: 8,
//     flexWrap: "wrap",
//   },
//   warningIcon: {
//     marginRight: 8,
//   },
//   warningText: {
//     flex: 1,
//     color: "#E65100",
//     fontSize: 13,
//   },
//   permissionButton: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 16,
//     marginTop: 8,
//   },
//   permissionButtonText: {
//     color: "white",
//     fontSize: 12,
//     fontWeight: "600",
//   },
//   settingRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: 16,
//   },
//   settingInfo: {
//     flex: 1,
//     marginRight: 16,
//   },
//   settingTitle: {
//     fontSize: 15,
//     fontWeight: "500",
//     marginBottom: 4,
//   },
//   settingDescription: {
//     fontSize: 13,
//   },
//   divider: {
//     height: 1,
//     marginHorizontal: 16,
//   },
//   infoContainer: {
//     padding: 16,
//     paddingTop: 0,
//   },
//   infoText: {
//     fontSize: 12,
//     fontStyle: "italic",
//   },
// });

// export default NotificationSettings;
