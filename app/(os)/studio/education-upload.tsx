import React, { useState } from 'react';
import { Alert, View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Alert, SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface EducationContent {
  title: string;
  type: 'lesson' | 'course' | 'quiz' | 'exam' | 'assignment' | 'pdf' | 'slides' | 'worksheet';
  description: string;
  subject: string;
  grade: string;
  language: string;
  duration: string;
  files: { id: string; uri: string; name: string; type: string }[];
  questions: { question: string; options: string[]; correct: number }[];
  isPublic: boolean;
  price: string;
}

const SUBJECTS = ['Mathematics', 'Science', 'English', 'Kiswahili', 'History', 'Geography', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Art', 'Music', 'Physical Education', 'Other'];
const GRADES = ['Pre-Primary', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Form 1', 'Form 2', 'Form 3', 'Form 4', 'University', 'Adult Learning'];
const LANGUAGES = ['English', 'Swahili', 'French', 'Arabic', 'Local Language'];

export default function EducationUploadScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [content, setContent] = useState<EducationContent>({
    title: '',
    type: 'lesson',
    description: '',
    subject: 'Mathematics',
    grade: 'Grade 1',
    language: 'English',
    duration: '30',
    files: [],
    questions: [],
    isPublic: true,
    price: '0',
  });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const updateContent = (updates: Partial<EducationContent>) => setContent(prev => ({ ...prev, ...updates }));

  const addFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
    if (!result.canceled && result.assets?.[0]) {
      updateContent({ files: [...content.files, { id: `file-${Date.now()}`, uri: result.assets[0].uri, name: result.assets[0].name, type: result.assets[0].mimeType || 'application/octet-stream' }] });
    }
  };

  const removeFile = (id: string) => updateContent({ files: content.files.filter((f: any) => f.id !== id) });

  const addQuestion = () => {
    updateContent({ questions: [...content.questions, { question: '', options: ['', '', '', ''], correct: 0 }] });
  };

  const updateQuestion = (idx: number, updates: Partial<EducationContent['questions'][0]>) => {
    const newQuestions = [...content.questions];
    newQuestions[idx] = { ...newQuestions[idx], ...updates };
    updateContent({ questions: newQuestions });
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    const newQuestions = [...content.questions];
    newQuestions[qIdx].options[oIdx] = value;
    updateContent({ questions: newQuestions });
  };

  const uploadContent = async () => {
    if (!user?.id || !content.title.trim()) {
      Alert.alert('Missing Info', 'Please enter a title.');
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      const fileUrls: string[] = [];
      for (let i = 0; i < content.files.length; i++) {
        const file = content.files[i];
        const response = await fetch(file.uri);
        const blob = await response.blob();
        const path = `${user.id}/education/${Date.now()}-${file.name}`;
        await supabase.storage.from('mstudio-education').upload(path, blob);
        const { data } = supabase.storage.from('mstudio-education').getPublicUrl(path);
        fileUrls.push(data?.publicUrl || '');
        setProgress(10 + Math.round((i + 1) / content.files.length * 30));
      }

      const { error } = await supabase.from('studio_education_content').insert({
        creator_id: user.id,
        title: content.title,
        type: content.type,
        description: content.description,
        subject: content.subject,
        grade_level: content.grade,
        language: content.language,
        duration_minutes: parseInt(content.duration) || 0,
        file_urls: fileUrls,
        questions: content.questions,
        is_public: content.isPublic,
        price_kes: parseFloat(content.price) || 0,
        status: 'published',
      });

      if (error) throw error;
      setProgress(100);
      Alert.alert('Success', `"${content.title}" published!`, [
        { text: 'View in Studio', onPress: () => router.push('/(os)/studio/creator-profile' as any) },
      ]);
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message);
    } finally {
      setUploading(false);
    }
  };

  const isQuizOrExam = content.type === 'quiz' || content.type === 'exam';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }} edges={['top']}>
      <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={24} color="#fff" /></TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Upload Education</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Type */}
        <View style={{ padding: 16 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>Content Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(['lesson', 'course', 'quiz', 'exam', 'assignment', 'pdf', 'slides', 'worksheet'] as const).map((t: any) => (
              <TouchableOpacity key={t} onPress={() => updateContent({ type: t })} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginRight: 8, backgroundColor: content.type === t ? '#ff0000' : '#1a1a1a' }}>
                <Text style={{ color: '#fff', fontSize: 12, textTransform: 'capitalize' }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Title */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Title</Text>
          <TextInput value={content.title} onChangeText={t => updateContent({ title: t })} placeholder="Content title" placeholderTextColor="#555" style={{ backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, color: '#fff', fontSize: 14 }} />
        </View>

        {/* Subject & Grade */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Subject</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {SUBJECTS.map((s: any) => (
              <TouchableOpacity key={s} onPress={() => updateContent({ subject: s })} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginRight: 8, backgroundColor: content.subject === s ? '#ff0000' : '#1a1a1a' }}>
                <Text style={{ color: '#fff', fontSize: 12 }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Grade Level</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {GRADES.map((g: any) => (
              <TouchableOpacity key={g} onPress={() => updateContent({ grade: g })} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginRight: 8, backgroundColor: content.grade === g ? '#ff0000' : '#1a1a1a' }}>
                <Text style={{ color: '#fff', fontSize: 11 }}>{g}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Language</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {LANGUAGES.map((l: any) => (
              <TouchableOpacity key={l} onPress={() => updateContent({ language: l })} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginRight: 8, backgroundColor: content.language === l ? '#ff0000' : '#1a1a1a' }}>
                <Text style={{ color: '#fff', fontSize: 12 }}>{l}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Description */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Description</Text>
          <TextInput value={content.description} onChangeText={t => updateContent({ description: t })} multiline numberOfLines={3} placeholder="Learning objectives, topics covered..." placeholderTextColor="#555" style={{ backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, color: '#fff', fontSize: 14, textAlignVertical: 'top', minHeight: 80 }} />
        </View>

        {/* Duration & Price */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12, flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Duration (min)</Text>
            <TextInput value={content.duration} onChangeText={t => updateContent({ duration: t })} keyboardType="numeric" placeholder="30" placeholderTextColor="#555" style={{ backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, color: '#fff', fontSize: 14 }} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Price (KES)</Text>
            <TextInput value={content.price} onChangeText={t => updateContent({ price: t })} keyboardType="numeric" placeholder="0 = Free" placeholderTextColor="#555" style={{ backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, color: '#fff', fontSize: 14 }} />
          </View>
        </View>

        {/* Files */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>Files ({content.files.length})</Text>
          {content.files.map((file: any) => (
            <View key={file.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, marginBottom: 6 }}>
              <Feather name="file" size={16} color="#888" />
              <Text style={{ color: '#fff', fontSize: 12, flex: 1, marginLeft: 8 }} numberOfLines={1}>{file.name}</Text>
              <TouchableOpacity onPress={() => removeFile(file.id)}><Feather name="x" size={16} color="#ff0000" /></TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={addFile} style={{ borderWidth: 1, borderColor: '#333', borderStyle: 'dashed', borderRadius: 8, padding: 16, alignItems: 'center' }}>
            <Feather name="plus" size={20} color="#666" />
            <Text style={{ color: '#888', marginTop: 4, fontSize: 12 }}>Add File (PDF, PPT, Video, etc.)</Text>
          </TouchableOpacity>
        </View>

        {/* Questions (for quiz/exam) */}
        {isQuizOrExam && (
          <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>Questions ({content.questions.length})</Text>
            {content.questions.map((q, qIdx) => (
              <View key={qIdx} style={{ backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                <Text style={{ color: '#888', fontSize: 11, marginBottom: 4 }}>Question {qIdx + 1}</Text>
                <TextInput value={q.question} onChangeText={t => updateQuestion(qIdx, { question: t })} placeholder="Enter question" placeholderTextColor="#555" style={{ backgroundColor: '#111', borderRadius: 6, padding: 8, color: '#fff', fontSize: 13, marginBottom: 8 }} />
                {q.options.map((opt, oIdx) => (
                  <View key={oIdx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <TouchableOpacity onPress={() => updateQuestion(qIdx, { correct: oIdx })} style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: q.correct === oIdx ? '#00ff00' : '#555', justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
                      {q.correct === oIdx && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#00ff00' }} />}
                    </TouchableOpacity>
                    <TextInput value={opt} onChangeText={t => updateOption(qIdx, oIdx, t)} placeholder={`Option ${oIdx + 1}`} placeholderTextColor="#555" style={{ flex: 1, backgroundColor: '#111', borderRadius: 6, padding: 6, color: '#fff', fontSize: 12 }} />
                  </View>
                ))}
              </View>
            ))}
            <TouchableOpacity onPress={addQuestion} style={{ borderWidth: 1, borderColor: '#333', borderStyle: 'dashed', borderRadius: 8, padding: 12, alignItems: 'center' }}>
              <Feather name="plus" size={18} color="#666" />
              <Text style={{ color: '#888', marginTop: 4, fontSize: 12 }}>Add Question</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#1a1a1a' }}>
        {uploading && <View style={{ marginBottom: 12 }}><View style={{ height: 4, backgroundColor: '#1a1a1a', borderRadius: 2 }}><View style={{ width: `${progress}%`, height: '100%', backgroundColor: '#ff0000', borderRadius: 2 }} /></View><Text style={{ color: '#888', fontSize: 11, marginTop: 4, textAlign: 'center' }}>{progress}% uploaded</Text></View>}
        <TouchableOpacity onPress={uploadContent} disabled={uploading} style={{ backgroundColor: uploading ? '#333' : '#ff0000', borderRadius: 12, padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          {uploading ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="upload-cloud" size={18} color="#fff" />}
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{uploading ? 'Publishing...' : 'Publish Content'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
