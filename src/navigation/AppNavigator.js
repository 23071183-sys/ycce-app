import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { useTheme, useThemeControls } from '../context/ThemeContext';
import { Icon } from '../components/ui';
import YCCELogo from '../components/YCCELogo';
import { type } from '../theme';

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

// Each tab: route name, screen, Ionicons base name (the "-outline" variant is
// used when unfocused) and an optional title for the header and tab label.
const TABS = {
  Home: { component: HomeScreen, icon: 'home', options: { headerTitle: () => <YCCELogo size={32} /> } },
  Subjects: { component: SubjectsScreen, icon: 'book' },
  Classes: { name: 'Subjects', component: SubjectsScreen, icon: 'book', title: 'My classes' },
  Attendance: { component: AttendanceScreen, icon: 'checkmark-circle' },
  Announcements: { component: AnnouncementsScreen, icon: 'notifications' },
  // Named apart from the "Fest" stack route so navigate('Fest') stays unambiguous.
  Fest: { name: 'FestTab', component: FestScreen, icon: 'star', title: 'Fest' },
  Profile: { component: ProfileScreen, icon: 'person' },
};

// Tab order per role. Students get a Messages tab here later.
const ROLE_TABS = {
  student: ['Home', 'Subjects', 'Attendance', 'Announcements', 'Profile'],
  professor: ['Home', 'Classes', 'Announcements', 'Profile'],
  admin: ['Home', 'Classes', 'Announcements', 'Profile'],
  super_admin: ['Home', 'Classes', 'Announcements', 'Profile'],
  fest_admin: ['Home', 'Fest', 'Announcements', 'Profile'],
};

const useHeaderOptions = () => {
  const c = useTheme();
  return {
    headerStyle: {
      backgroundColor: c.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
      elevation: 0,
      shadowOpacity: 0,
    },
    headerTintColor: c.text,
    headerTitleStyle: { ...type.heading, color: c.text },
    cardStyle: { backgroundColor: c.bg },
  };
};

function MainTabs() {
  const c = useTheme();
  const header = useHeaderOptions();
  const { user } = useAuth();
  const keys = ROLE_TABS[user?.role] || ROLE_TABS.student;
  return (
    <Tab.Navigator
      screenOptions={{
        ...header,
        tabBarActiveTintColor: c.text,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: c.border,
          elevation: 0,
        },
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      {keys.map((key) => {
        const tab = TABS[key];
        const name = tab.name || key;
        return (
          <Tab.Screen
            key={key}
            name={name}
            component={tab.component}
            options={{
              ...(tab.title ? { title: tab.title } : null),
              tabBarIcon: ({ focused, color }) => (
                <Icon name={focused ? tab.icon : `${tab.icon}-outline`} size={22} color={color} />
              ),
              ...tab.options,
            }}
          />
        );
      })}
    </Tab.Navigator>
  );
}

function MainStack() {
  const header = useHeaderOptions();
  return (
    <Stack.Navigator screenOptions={header}>
      <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="SubjectDetail" component={SubjectDetailScreen} options={{ title: 'Subject' }} />
      <Stack.Screen name="Timetable" component={TimetableScreen} options={{ title: 'Timetable' }} />
      <Stack.Screen name="Faculty" component={FacultyScreen} options={{ title: 'Faculty' }} />
      <Stack.Screen name="Compufest" component={CompufestScreen} options={{ title: 'Compufest' }} />
      <Stack.Screen name="Fest" component={FestScreen} options={{ title: 'Yash Fest' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'CT Assistant' }} />
      <Stack.Screen name="PendingApprovals" component={PendingApprovalsScreen} options={{ title: 'Pending approvals' }} />
      <Stack.Screen name="AttendanceDetail" component={AttendanceDetailScreen} options={{ title: 'Attendance detail' }} />
      <Stack.Screen name="Results" component={ResultsScreen} options={{ title: 'Results' }} />
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
      <View style={[styles.splash, { backgroundColor: c.bg }]}>
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
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, fontWeight: '500', letterSpacing: 0.2 },
});
