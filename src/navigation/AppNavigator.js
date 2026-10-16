import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { useTheme, useThemeControls } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import CTLogo from '../components/CTLogo';
import YCCELogo from '../components/YCCELogo';

import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import AttendanceDetailScreen from '../screens/Attendance/AttendanceDetailScreen';
import PendingApprovalsScreen from '../screens/Admin/PendingApprovalsScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import SubjectsScreen from '../screens/Subjects/SubjectsScreen';
import SubjectDetailScreen from '../screens/Subjects/SubjectDetailScreen';
import AttendanceScreen from '../screens/Attendance/AttendanceScreen';
import AnnouncementsScreen from '../screens/Announcements/AnnouncementsScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import ResultsScreen from '../screens/Results/ResultsScreen';
import CompufestScreen from '../screens/Events/CompufestScreen';
import FestScreen from '../screens/Events/FestScreen';
import TimetableScreen from '../screens/Timetable/TimetableScreen';
import FacultyScreen from '../screens/Faculty/FacultyScreen';
import ChatScreen from '../screens/Chat/ChatScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const ICONS = {
  Home:          ['home',              'home-outline'],
  Subjects:      ['book',              'book-outline'],
  Attendance:    ['checkmark-circle',  'checkmark-circle-outline'],
  Announcements: ['notifications',     'notifications-outline'],
  Results:       ['bar-chart',         'bar-chart-outline'],
  Profile:       ['person',            'person-outline'],
};

const icon = (name, focused, color) => {
  const [filled, outline] = ICONS[name] ?? ['ellipse', 'ellipse-outline'];
  return <Ionicons name={focused ? filled : outline} size={22} color={color} />;
};

function MainTabs() {
  const colors = useTheme();
  const header = {
    headerStyle: { backgroundColor: colors.card, borderBottomWidth: 0.5, borderBottomColor: colors.border },
    headerTintColor: colors.text,
    headerTitleStyle: { fontWeight: '300', color: colors.text, letterSpacing: 1, textTransform: 'uppercase', fontSize: 13 },
  };
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) =>
          route.name === 'Home'
            ? <CTLogo size={26} />
            : icon(route.name, focused, color),
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.card, borderTopWidth: 0.5, borderTopColor: colors.border, paddingBottom: 4 },
        tabBarLabelStyle: { fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: '400' },
        ...header,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ headerTitle: () => <YCCELogo size={32} /> }} />
      <Tab.Screen name="Subjects" component={SubjectsScreen} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} />
      <Tab.Screen name="Announcements" component={AnnouncementsScreen} />
      <Tab.Screen name="Results" component={ResultsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function MainStack() {
  const colors = useTheme();
  const header = {
    headerStyle: { backgroundColor: colors.card, borderBottomWidth: 0.5, borderBottomColor: colors.border },
    headerTintColor: colors.text,
    headerTitleStyle: { fontWeight: '300', color: colors.text, letterSpacing: 1, textTransform: 'uppercase', fontSize: 13 },
  };
  return (
    <Stack.Navigator screenOptions={header}>
      <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="SubjectDetail" component={SubjectDetailScreen} options={{ title: 'Subject' }} />
      <Stack.Screen name="Timetable" component={TimetableScreen} options={{ title: 'Timetable' }} />
      <Stack.Screen name="Faculty" component={FacultyScreen} options={{ title: 'Faculty' }} />
      <Stack.Screen name="Compufest" component={CompufestScreen} options={{ title: 'Compufest' }} />
      <Stack.Screen name="Fest" component={FestScreen} options={{ title: 'Yash Fest' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'CT Assistant' }} />
      <Stack.Screen name="PendingApprovals" component={PendingApprovalsScreen} options={{ title: 'Pending Approvals' }} />
      <Stack.Screen name="AttendanceDetail" component={AttendanceDetailScreen} options={{ title: 'Attendance Detail' }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const c = useTheme();
  const { navTheme } = useThemeControls();
  // Restoring the session takes a moment; a themed spinner beats a blank screen.
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }}>
        <ActivityIndicator size="large" color={c.text} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainStack} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
