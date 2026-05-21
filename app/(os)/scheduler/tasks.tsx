import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';

interface Task {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  dueDate?: string;
}

const priorityColors = {
  high: '#DC2626',
  medium: '#D97706',
  low: '#059669',
};

export default function SchedulerTasks() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Review court cases', priority: 'high', completed: false },
    { id: '2', title: 'Update prisoner records', priority: 'medium', completed: false },
    { id: '3', title: 'Schedule maintenance', priority: 'low', completed: true },
  ]);
  const [newTask, setNewTask] = useState('');

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now().toString(), title: newTask, priority: 'medium', completed: false }]);
    setNewTask('');
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome5 name="arrow-left" size={20} color="#334155" />
        </TouchableOpacity>
        <Text style={styles.title}>Tasks</Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Add a new task..."
          value={newTask}
          onChangeText={setNewTask}
          onSubmitEditing={addTask}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addTask}>
          <FontAwesome5 name="plus" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {tasks.map((task) => (
          <View key={task.id} style={styles.taskItem}>
            <TouchableOpacity onPress={() => toggleTask(task.id)}>
              <FontAwesome5
                name={task.completed ? 'check-circle' : 'circle'}
                size={20}
                color={task.completed ? '#059669' : '#CBD5E1'}
              />
            </TouchableOpacity>
            <View style={styles.taskContent}>
              <Text style={[styles.taskTitle, task.completed && styles.completed]}>{task.title}</Text>
              <View style={[styles.priorityBadge, { backgroundColor: priorityColors[task.priority] + '15' }]}>
                <Text style={[styles.priorityText, { color: priorityColors[task.priority] }]}>{task.priority}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => deleteTask(task.id)}>
              <FontAwesome5 name="trash" size={16} color="#DC2626" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  inputRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#334155',
  },
  addBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#059669',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { padding: 16 },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 14, fontWeight: '600', color: '#334155' },
  completed: { textDecorationLine: 'line-through', color: '#94A3B8' },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  priorityText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
});
