import { createBrowserRouter } from 'react-router-dom';
import Home from './screens/Home';
import NewHabit from './screens/NewHabit';
import HabitType from './screens/HabitType';
import HabitName from './screens/HabitName';
import HabitIcon from './screens/HabitIcon';
import Frequency from './screens/Frequency';
import MeasureBy from './screens/MeasureBy';
import Target from './screens/Target';
import Reminder from './screens/Reminder';
import HabitDetail from './screens/HabitDetail';
import CalendarScreen from './screens/CalendarScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import Settings from './screens/Settings';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Home,
  },
  {
    path: '/calendar',
    Component: CalendarScreen,
  },
  {
    path: '/analytics',
    Component: AnalyticsScreen,
  },
  {
    path: '/settings',
    Component: Settings,
  },
  {
    path: '/habit/:id',
    Component: HabitDetail,
  },
  {
    path: '/new-habit',
    Component: NewHabit,
  },
  {
    path: '/edit-habit/:id',
    Component: NewHabit,
  },
  {
    path: '/new-habit/type',
    Component: HabitType,
  },
  {
    path: '/new-habit/name',
    Component: HabitName,
  },
  {
    path: '/new-habit/icon',
    Component: HabitIcon,
  },
  {
    path: '/new-habit/frequency',
    Component: Frequency,
  },
  {
    path: '/new-habit/measure',
    Component: MeasureBy,
  },
  {
    path: '/new-habit/target',
    Component: Target,
  },
  {
    path: '/new-habit/reminder',
    Component: Reminder,
  },
]);