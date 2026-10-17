import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { useTheme, useThemeControls } from '../context/ThemeContext';
import { useUnread } from '../context/UnreadContext';
import useNotificationRouting from './useNotificationRouting';
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
import SubjectDetailScreen from '../screens/Subjects/SubjectDetail';
import AttendanceScreen from '../screens/Attendance/AttendanceScreen';
import AnnouncementsScreen from '../screens/Announcements/AnnouncementsScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import AppearanceScreen from '../screens/Profile/AppearanceScreen';
import NotificationSettingsScreen from '../screens/Profile/NotificationSettingsScreen';
import ResultsScreen from '../screens/Results/ResultsScreen';
import CompufestScreen from '../screens/Events/CompufestScreen';
import FestScreen from '../screens/Events/FestScreen';
import TimetableScreen from '../screens/Timetable/TimetableScreen';
import FacultyScreen from '../screens/Faculty/FacultyScreen';
import ChatScreen from '../screens/Chat/ChatScreen';
import MemoriesScreen from '../screens/Chat/MemoriesScreen';
import ConversationsScreen from '../screens/Messages/ConversationsScreen';
import NewMessageScreen from '../screens/Messages/NewMessageScreen';
import ConversationScreen from '../screens/Messages/ConversationScreen';
import FeesScreen from '../screens/Fees/FeesScreen';
import MyTicketsScreen from '../screens/Events/MyTicketsScreen';
import CheckInScreen from '../screens/Events/CheckInScreen';
import AttendanceSessionScreen from '../screens/QRAttendance/AttendanceSessionScreen';
import ScanAttendanceScreen from '../screens/QRAttendance/ScanAttendanceScreen';
import CalendarSyncScreen from '../screens/Calendar/CalendarSyncScreen';
import StudyHomeScreen from '../screens/Study/StudyHomeScreen';
import QuizScreen from '../screens/Study/QuizScreen';
import FlashcardsScreen from '../screens/Study/FlashcardsScreen';
import PlanScreen from '../screens/Study/PlanScreen';
import PlacementsScreen from '../screens/Placements/PlacementsScreen';
import PlacementDetailScreen from '../screens/Placements/PlacementDetailScreen';
import FeeDetailScreen from '../screens/Fees/FeeDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const navigationRef = createNavigationContainerRef();

// Each tab: route name, screen, Ionicons base name (the "-outline" variant is
// used when unfocused) and an optional title for the header and tab label.
const TABS = {
  Home: { component: HomeScreen, icon: 'home', options: { headerTitle: () => <YCCELogo size={32} /> } },
  Subjects: { component: SubjectsScreen, icon: 'book' },
  Classes: { name: 'Subjects', component: SubjectsScreen, icon: 'book', title: 'My classes' },
  Attendance: { component: AttendanceScreen, icon: 'checkmark-circle' },
  Announcements: { component: AnnouncementsScreen, icon: 'notifications' },
  Messages: { component: ConversationsScreen, icon: 'chatbubbles', badge: 'unread' },
  // Named apart from the "Fest" stack route so navigate('Fest') stays unambiguous.
  Fest: { name: 'FestTab', component: FestScreen, icon: 'star', title: 'Fest' },
  Profile: { component: ProfileScreen, icon: 'person' },
};

// Tab order per role.
const ROLE_TABS = {
  student: ['Home', 'Subjects', 'Attendance', 'Messages', 'Profile'],
  professor: ['Home', 'Classes', 'Announcements', 'Messages', 'Profile'],
  admin: ['Home', 'Classes', 'Announcements', 'Messages', 'Profile'],
  super_admin: ['Home', 'Classes', 'Announcements', 'Messages', 'Profile'],
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
  const { total: unread } = useUnread();
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
        tabBarBadgeStyle: { backgroundColor: c.accent, color: c.accentFg, fontSize: 10 },
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
              ...(tab.badge === 'unread' && unread > 0 ? { tabBarBadge: unread > 99 ? '99+' : unread } : null),
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
      <Stack.Screen name="Memories" component={MemoriesScreen} options={{ title: 'Memories' }} />
      <Stack.Screen name="PendingApprovals" component={PendingApprovalsScreen} options={{ title: 'Pending approvals' }} />
      <Stack.Screen name="AttendanceDetail" component={AttendanceDetailScreen} options={{ title: 'Attendance detail' }} />
      <Stack.Screen name="Results" component={ResultsScreen} options={{ title: 'Results' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit profile' }} />
      <Stack.Screen name="Appearance" component={AppearanceScreen} options={{ title: 'Appearance' }} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="NewMessage" component={NewMessageScreen} options={{ title: 'New message' }} />
      <Stack.Screen name="Conversation" component={ConversationScreen} options={{ title: '' }} />
      <Stack.Screen name="Fees" component={FeesScreen} options={{ title: 'Fees' }} />
      {/* Students reach announcements from Home and Profile rather than a tab;
          for staff the tab of the same name is found first. */}
      <Stack.Screen name="Announcements" component={AnnouncementsScreen} options={{ title: 'Announcements' }} />
      <Stack.Screen name="MyTickets" component={MyTicketsScreen} options={{ title: 'My tickets' }} />
      <Stack.Screen name="CheckIn" component={CheckInScreen} options={{ title: 'Check in' }} />
      <Stack.Screen name="AttendanceSession" component={AttendanceSessionScreen} options={{ title: 'QR attendance' }} />
      <Stack.Screen name="ScanAttendance" component={ScanAttendanceScreen} options={{ title: 'Scan attendance' }} />
      <Stack.Screen name="CalendarSync" component={CalendarSyncScreen} options={{ title: 'Calendar sync' }} />
      <Stack.Screen name="StudyHome" component={StudyHomeScreen} options={{ title: 'Study' }} />
      <Stack.Screen name="Quiz" component={QuizScreen} options={{ title: 'Quiz' }} />
      <Stack.Screen name="Flashcards" component={FlashcardsScreen} options={{ title: 'Flashcards' }} />
      <Stack.Screen name="StudyPlan" component={PlanScreen} options={{ title: 'Study plan' }} />
      <Stack.Screen name="Placements" component={PlacementsScreen} options={{ title: 'Placements' }} />
      <Stack.Screen name="PlacementDetail" component={PlacementDetailScreen} options={{ title: 'Placement' }} />
      <Stack.Screen name="FeeDetail" component={FeeDetailScreen} options={{ title: 'Fee' }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const c = useTheme();
  const { navTheme } = useThemeControls();
  const [navReady, setNavReady] = useState(false);
  useNotificationRouting(navigationRef, { ready: navReady, signedIn: Boolean(user) });
  // Restoring the session takes a moment; a themed spinner beats a blank screen.
  if (loading) {
    return (
      <View style={[styles.splash, { backgroundColor: c.bg }]}>
        <ActivityIndicator size="large" color={c.text} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme} onReady={() => setNavReady(true)}>
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
