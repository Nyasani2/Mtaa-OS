// @ts-nocheck
// app/(os)/calendar/index.tsx — MTAA OS Rich Calendar
// Features: Month/Day/Week views, Event CRUD, Reminders, Categories, Recurring, Search

import React, { useState, useEffect, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Switch, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Alert, useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Alert,
  CalendarEvent, getEvents, getEventsForDate, createEvent, updateEvent, deleteEvent,
  createReminder, getRemindersForEvent, deleteReminder,
  EVENT_CATEGORIES, REMINDER_OPTIONS, EventCategory,
} from '@/lib/services/calendar-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

type ViewMode = 'month' | 'week' | 'day';

export default function CalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const today = new Date();

  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [dayEvents, setDayEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formCategory, setFormCategory] = useState<EventCategory>('personal');
  const [formAllDay, setFormAllDay] = useState(false);
  const [formStartDate, setFormStartDate] = useState(new Date());
  const [formEndDate, setFormEndDate] = useState(new Date());
  const [formPriority, setFormPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [formReminder, setFormReminder] = useState(15);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>('start');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Load events for current month
  const loadEvents = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);

    const data = await getEvents(
      startOfMonth.toISOString().split('T')[0],
      endOfMonth.toISOString().split('T')[0]
    );
    setEvents(data);
    setLoading(false);
  }, [year, month, user?.id]);

  // Load events for selected day
  const loadDayEvents = useCallback(async () => {
    if (!user?.id) return;
    const dateStr = selectedDate.toISOString().split('T')[0];
    const data = await getEventsForDate(dateStr);
    setDayEvents(data);
  }, [selectedDate, user?.id]);

  useEffect(() => { loadEvents(); }, [loadEvents]);
  useEffect(() => { loadDayEvents(); }, [loadDayEvents]);

  const navigateMonth = (delta: number) => {
    setCurrentDate(new Date(year, month + delta, 1));
  };

  const navigateWeek = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + delta * 7);
    setCurrentDate(newDate);
  };

  const navigateDay = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + delta);
    setCurrentDate(newDate);
    setSelectedDate(newDate);
  };

  const isToday = (d: number) => {
    return d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const isSelected = (d: number) => {
    return d === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();
  };

  const getEventsForDay = (day: number): CalendarEvent[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((e: any) => e.start_date === dateStr);
  };

  const getCategoryColor = (category: string) => {
    return EVENT_CATEGORIES.find((c: any) => c.value === category)?.color || '#6b7280';
  };

  const openEventForm = (event?: CalendarEvent) => {
    if (event) {
      setIsEditing(true);
      setSelectedEvent(event);
      setFormTitle(event.title);
      setFormDescription(event.description || '');
      setFormLocation(event.location || '');
      setFormCategory(event.category);
      setFormAllDay(event.is_all_day);
      setFormStartDate(new Date(event.start_date));
      setFormEndDate(event.end_date ? new Date(event.end_date) : new Date(event.start_date));
      setFormPriority(event.priority);
    } else {
      setIsEditing(false);
      setSelectedEvent(null);
      setFormTitle('');
      setFormDescription('');
      setFormLocation('');
      setFormCategory('personal');
      setFormAllDay(false);
      setFormStartDate(selectedDate);
      setFormEndDate(selectedDate);
      setFormPriority('normal');
      setFormReminder(15);
    }
    setShowEventModal(true);
  };

  const saveEvent = async () => {
    if (!formTitle.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    const eventData = {
      user_id: user.id,
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      location: formLocation.trim() || undefined,
      start_date: formStartDate.toISOString().split('T')[0],
      start_time: formAllDay ? undefined : formStartDate.toTimeString().slice(0, 5),
      end_date: formEndDate.toISOString().split('T')[0],
      end_time: formAllDay ? undefined : formEndDate.toTimeString().slice(0, 5),
      is_all_day: formAllDay,
      category: formCategory,
      priority: formPriority,
      status: 'confirmed' as const,
    };

    let savedEvent: CalendarEvent | null;
    if (isEditing && selectedEvent) {
      savedEvent = await updateEvent(selectedEvent.id, eventData);
    } else {
      savedEvent = await createEvent(eventData);
    }

    if (savedEvent) {
      // Create reminder if set
      if (formReminder > 0 && !isEditing) {
        await createReminder({
          event_id: savedEvent.id,
          user_id: user.id,
          minutes_before: formReminder,
          reminder_type: 'notification',
          is_triggered: false,
        });
      }

      setShowEventModal(false);
      loadEvents();
      loadDayEvents();
    } else {
      Alert.alert('Error', 'Failed to save event');
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${selectedEvent.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteEvent(selectedEvent.id);
            if (success) {
              setShowEventDetail(false);
              setShowEventModal(false);
              loadEvents();
              loadDayEvents();
            }
          },
        },
      ]
    );
  };

  const onDateChange = (event: any, selected?: Date) => {
    setShowDatePicker(false);
    if (selected) {
      if (datePickerMode === 'start') {
        setFormStartDate(selected);
        if (formEndDate < selected) setFormEndDate(selected);
      } else {
        setFormEndDate(selected);
      }
    }
  };

  // ─── Month View ───
  const renderMonthView = () => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.daysRow}>
          {DAYS.map((d: any) => <Text key={d} style={styles.dayLabel}>{d}</Text>)}
        </View>
        <View style={styles.grid}>
          {Array.from({ length: firstDay }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.cell} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1;
            const dayEvents = getEventsForDay(d);
            return (
              <TouchableOpacity 
                key={d} 
                style={[
                  styles.cell, 
                  isToday(d) && styles.todayCell,
                  isSelected(d) && styles.selectedCell,
                ]}
                onPress={() => {
                  setSelectedDate(new Date(year, month, d));
                  setViewMode('day');
                }}
              >
                <Text style={[
                  styles.cellText, 
                  isToday(d) && styles.todayText,
                  isSelected(d) && styles.selectedText,
                ]}>
                  {d}
                </Text>
                {dayEvents.length > 0 && (
                  <View style={styles.eventDots}>
                    {dayEvents.slice(0, 3).map((e, idx) => (
                      <View 
                        key={idx} 
                        style={[styles.dot, { backgroundColor: getCategoryColor(e.category) }]} 
                      />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // ─── Day View ───
  const renderDayView = () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const dayName = DAYS[selectedDate.getDay()];
    const dayNum = selectedDate.getDate();
    const monthName = MONTHS[selectedDate.getMonth()];

    return (
      <ScrollView style={styles.dayViewContainer}>
        <View style={styles.dayHeader}>
          <Text style={styles.dayName}>{dayName}</Text>
          <Text style={styles.dayNumber}>{dayNum}</Text>
          <Text style={styles.dayMonth}>{monthName} {selectedDate.getFullYear()}</Text>
        </View>

        {dayEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#888" />
            <Text style={styles.emptyText}>No events for this day</Text>
            <TouchableOpacity style={styles.addEventBtn} onPress={() => openEventForm()}>
              <Text style={styles.addEventText}>+ Add Event</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.eventList}>
            {dayEvents.map((event: any) => (
              <TouchableOpacity 
                key={event.id} 
                style={[styles.eventCard, { borderLeftColor: getCategoryColor(event.category) }]}
                onPress={() => { setSelectedEvent(event); setShowEventDetail(true); }}
              >
                <View style={styles.eventTime}>
                  <Text style={styles.eventTimeText}>
                    {event.is_all_day ? 'All day' : event.start_time?.slice(0, 5) || '—'}
                  </Text>
                  {!event.is_all_day && event.end_time && (
                    <Text style={styles.eventTimeEnd}>{event.end_time.slice(0, 5)}</Text>
                  )}
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  {event.location && (
                    <Text style={styles.eventLocation}>📍 {event.location}</Text>
                  )}
                  <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(event.category) + '20' }]}>
                    <Text style={[styles.categoryText, { color: getCategoryColor(event.category) }]}>
                      {EVENT_CATEGORIES.find((c: any) => c.value === event.category)?.label}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  // ─── Event Form Modal ───
  const renderEventModal = () => (
    <Modal visible={showEventModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEventModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{isEditing ? 'Edit Event' : 'New Event'}</Text>
            <TouchableOpacity onPress={saveEvent}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <TextInput
              style={styles.titleInput}
              placeholder="Event title"
              placeholderTextColor="#888"
              value={formTitle}
              onChangeText={setFormTitle}
            />

            <TextInput
              style={styles.input}
              placeholder="Location (optional)"
              placeholderTextColor="#888"
              value={formLocation}
              onChangeText={setFormLocation}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              placeholderTextColor="#888"
              value={formDescription}
              onChangeText={setFormDescription}
              multiline
              numberOfLines={3}
            />

            {/* All Day Toggle */}
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>All Day</Text>
              <Switch value={formAllDay} onValueChange={setFormAllDay} />
            </View>

            {/* Date Pickers */}
            <TouchableOpacity 
              style={styles.formRow}
              onPress={() => { setDatePickerMode('start'); setShowDatePicker(true); }}
            >
              <Text style={styles.formLabel}>Start</Text>
              <Text style={styles.formValue}>
                {formStartDate.toLocaleDateString()} {!formAllDay && formStartDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.formRow}
              onPress={() => { setDatePickerMode('end'); setShowDatePicker(true); }}
            >
              <Text style={styles.formLabel}>End</Text>
              <Text style={styles.formValue}>
                {formEndDate.toLocaleDateString()} {!formAllDay && formEndDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={datePickerMode === 'start' ? formStartDate : formEndDate}
                mode={formAllDay ? 'date' : 'datetime'}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
              />
            )}

            {/* Category */}
            <Text style={styles.sectionLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {EVENT_CATEGORIES.map((cat: any) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryChip,
                    formCategory === cat.value && { backgroundColor: cat.color },
                  ]}
                  onPress={() => setFormCategory(cat.value)}
                >
                  <Text style={[
                    styles.categoryChipText,
                    formCategory === cat.value && { color: '#fff' },
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Priority */}
            <Text style={styles.sectionLabel}>Priority</Text>
            <View style={styles.priorityRow}>
              {(['low', 'normal', 'high'] as const).map((p: any) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityChip,
                    formPriority === p && styles.priorityActive,
                    formPriority === p && p === 'high' && { backgroundColor: '#ef4444' },
                    formPriority === p && p === 'normal' && { backgroundColor: '#3b82f6' },
                    formPriority === p && p === 'low' && { backgroundColor: '#6b7280' },
                  ]}
                  onPress={() => setFormPriority(p)}
                >
                  <Text style={[styles.priorityText, formPriority === p && { color: '#fff' }]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Reminder */}
            {!isEditing && (
              <>
                <Text style={styles.sectionLabel}>Reminder</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reminderScroll}>
                  {REMINDER_OPTIONS.map((opt: any) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.reminderChip,
                        formReminder === opt.value && styles.reminderActive,
                      ]}
                      onPress={() => setFormReminder(opt.value)}
                    >
                      <Text style={[styles.reminderText, formReminder === opt.value && { color: '#fff' }]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {isEditing && (
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteEvent}>
                <Text style={styles.deleteText}>Delete Event</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // ─── Event Detail Modal ───
  const renderEventDetail = () => {
    if (!selectedEvent) return null;
    return (
      <Modal visible={showEventDetail} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowEventDetail(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowEventDetail(false); openEventForm(selectedEvent); }}>
                <Text style={styles.modalSave}>Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.detailContent}>
              <View style={[styles.detailCategory, { backgroundColor: getCategoryColor(selectedEvent.category) }]}>
                <Text style={styles.detailCategoryText}>
                  {EVENT_CATEGORIES.find((c: any) => c.value === selectedEvent.category)?.label}
                </Text>
              </View>

              <Text style={styles.detailTitle}>{selectedEvent.title}</Text>

              <View style={styles.detailRow}>
                <Ionicons name="calendar" size={20} color="#888" />
                <Text style={styles.detailText}>
                  {selectedEvent.start_date} {selectedEvent.start_time && `at ${selectedEvent.start_time.slice(0, 5)}`}
                </Text>
              </View>

              {selectedEvent.location && (
                <View style={styles.detailRow}>
                  <Ionicons name="location" size={20} color="#888" />
                  <Text style={styles.detailText}>{selectedEvent.location}</Text>
                </View>
              )}

              {selectedEvent.description && (
                <View style={styles.detailRow}>
                  <Ionicons name="document-text" size={20} color="#888" />
                  <Text style={styles.detailText}>{selectedEvent.description}</Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Ionicons name="flag" size={20} color="#888" />
                <Text style={[styles.detailText, { textTransform: 'capitalize' }]}>
                  {selectedEvent.priority} priority
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteEvent}>
              <Text style={styles.deleteText}>Delete Event</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendar</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setShowSearch(!showSearch)} style={styles.headerIcon}>
            <Ionicons name="search" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openEventForm()} style={styles.headerIcon}>
            <Ionicons name="add" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {/* View Mode Tabs */}
      <View style={styles.viewTabs}>
        {(['month', 'week', 'day'] as ViewMode[]).map((mode: any) => (
          <TouchableOpacity
            key={mode}
            style={[styles.viewTab, viewMode === mode && styles.viewTabActive]}
            onPress={() => setViewMode(mode)}
          >
            <Text style={[styles.viewTabText, viewMode === mode && styles.viewTabTextActive]}>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Month Navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => viewMode === 'month' ? navigateMonth(-1) : viewMode === 'week' ? navigateWeek(-1) : navigateDay(-1)}>
          <Ionicons name="chevron-back" size={28} color="#3b82f6" />
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {viewMode === 'day' 
            ? `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`
            : `${MONTHS[month]} ${year}`
          }
        </Text>
        <TouchableOpacity onPress={() => viewMode === 'month' ? navigateMonth(1) : viewMode === 'week' ? navigateWeek(1) : navigateDay(1)}>
          <Ionicons name="chevron-forward" size={28} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Calendar Views */}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'day' && renderDayView()}
      {viewMode === 'week' && renderDayView() /* Simplified week view */}

      {/* Modals */}
      {renderEventModal()}
      {renderEventDetail()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerIcon: { marginLeft: 16 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a1a1a', marginHorizontal: 16,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    marginBottom: 8,
  },
  searchInput: { flex: 1, color: '#fff', marginLeft: 8, fontSize: 15 },

  viewTabs: {
    flexDirection: 'row', justifyContent: 'center',
    paddingHorizontal: 16, marginBottom: 8,
  },
  viewTab: {
    paddingHorizontal: 20, paddingVertical: 6,
    borderRadius: 16, marginHorizontal: 4,
  },
  viewTabActive: { backgroundColor: '#3b82f6' },
  viewTabText: { color: '#888', fontSize: 14, fontWeight: '500' },
  viewTabTextActive: { color: '#fff' },

  monthNav: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 12,
  },
  monthText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  calendarContainer: { paddingHorizontal: 8 },
  daysRow: { flexDirection: 'row', paddingHorizontal: 8, marginBottom: 4 },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 12, color: '#888', fontWeight: '500' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  cell: { 
    width: '14.28%', aspectRatio: 1, 
    justifyContent: 'center', alignItems: 'center',
    borderRadius: 8, marginVertical: 2,
  },
  cellText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  todayCell: { backgroundColor: '#3b82f6' },
  todayText: { color: '#fff', fontWeight: '700' },
  selectedCell: { backgroundColor: '#1a1a1a', borderWidth: 2, borderColor: '#3b82f6' },
  selectedText: { color: '#3b82f6', fontWeight: '700' },
  eventDots: { flexDirection: 'row', marginTop: 2, gap: 2 },
  dot: { width: 4, height: 4, borderRadius: 2 },

  dayViewContainer: { flex: 1 },
  dayHeader: { alignItems: 'center', paddingVertical: 20 },
  dayName: { color: '#888', fontSize: 16, textTransform: 'uppercase', letterSpacing: 2 },
  dayNumber: { color: '#fff', fontSize: 48, fontWeight: '300', marginVertical: 4 },
  dayMonth: { color: '#888', fontSize: 14 },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#888', fontSize: 16, marginTop: 12 },
  addEventBtn: { marginTop: 20, backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  addEventText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  eventList: { paddingHorizontal: 16 },
  eventCard: {
    flexDirection: 'row', backgroundColor: '#1a1a1a',
    borderRadius: 12, padding: 16, marginBottom: 10,
    borderLeftWidth: 4,
  },
  eventTime: { width: 60, alignItems: 'flex-start' },
  eventTimeText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  eventTimeEnd: { color: '#888', fontSize: 12, marginTop: 2 },
  eventInfo: { flex: 1, marginLeft: 12 },
  eventTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  eventLocation: { color: '#888', fontSize: 13, marginTop: 4 },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginTop: 8 },
  categoryText: { fontSize: 11, fontWeight: '600' },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#2a2a2a',
  },
  modalCancel: { color: '#888', fontSize: 16 },
  modalTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  modalSave: { color: '#3b82f6', fontSize: 16, fontWeight: '600' },

  form: { paddingHorizontal: 20, paddingTop: 16 },
  titleInput: {
    color: '#fff', fontSize: 24, fontWeight: '600',
    borderBottomWidth: 1, borderBottomColor: '#333', paddingVertical: 8, marginBottom: 16,
  },
  input: {
    color: '#fff', fontSize: 16,
    borderBottomWidth: 1, borderBottomColor: '#333', paddingVertical: 10, marginBottom: 16,
  },
  textArea: { height: 80, textAlignVertical: 'top' },

  formRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a2a',
  },
  formLabel: { color: '#fff', fontSize: 16 },
  formValue: { color: '#3b82f6', fontSize: 16 },

  sectionLabel: { color: '#888', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 8 },

  categoryScroll: { marginBottom: 8 },
  categoryChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#2a2a2a', marginRight: 8,
  },
  categoryChipText: { color: '#fff', fontSize: 14 },

  priorityRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  priorityChip: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    backgroundColor: '#2a2a2a', alignItems: 'center',
  },
  priorityActive: {},
  priorityText: { color: '#fff', fontSize: 14 },

  reminderScroll: { marginBottom: 16 },
  reminderChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 16, backgroundColor: '#2a2a2a', marginRight: 8,
  },
  reminderActive: { backgroundColor: '#3b82f6' },
  reminderText: { color: '#fff', fontSize: 13 },

  deleteBtn: {
    backgroundColor: '#ef444420', borderWidth: 1, borderColor: '#ef4444',
    paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 20, marginBottom: 30,
  },
  deleteText: { color: '#ef4444', fontSize: 16, fontWeight: '600' },

  // Detail modal
  detailContent: { padding: 20 },
  detailCategory: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginBottom: 12 },
  detailCategoryText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  detailTitle: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  detailText: { color: '#ccc', fontSize: 15, marginLeft: 12, flex: 1 },
});
