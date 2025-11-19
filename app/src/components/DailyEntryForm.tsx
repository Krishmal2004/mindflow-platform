import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, ActivityIndicator, Alert, Platform, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { r2, BUCKET_NAME, PUBLIC_URL_BASE } from '../lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';

export default function DailyEntryForm({ session, onSuccess }: { session: Session, onSuccess?: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{name?: string}>({});
  
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null); // 'image' | 'audio'
  const [mediaMimeType, setMediaMimeType] = useState<string>('application/octet-stream');

  function validate() {
    let isValid = true;
    let newErrors: {name?: string} = {};

    if (!name.trim()) {
      newErrors.name = 'Please enter a title for your entry';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setMediaUri(result.assets[0].uri);
      setMediaType('image');
      setMediaMimeType(result.assets[0].mimeType || 'image/jpeg');
    }
  }

  async function pickAudio() {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
    });

    if (!result.canceled && result.assets.length > 0) {
      setMediaUri(result.assets[0].uri);
      setMediaType('audio');
      setMediaMimeType(result.assets[0].mimeType || 'audio/mpeg');
    }
  }

  async function uploadFile(uri: string, mimeType: string): Promise<string> {
    try {
      console.log("Starting upload for:", uri);
      
      // Fetch file from URI to get blob
      const response = await fetch(uri);
      const blob = await response.blob();
      console.log("Blob created:", blob.size, "bytes");
      
      // Convert blob to ArrayBuffer to avoid stream reader issues in React Native
      const fileBuffer = await new Response(blob).arrayBuffer();
      
      const filename = `${session.user.id}/${Date.now()}.${mimeType.split('/')[1] || 'bin'}`;
      
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: filename,
        Body: new Uint8Array(fileBuffer), // Pass as Uint8Array
        ContentType: mimeType,
      });

      console.log("Sending to R2...");
      await r2.send(command);
      console.log("Upload success!");
      
      return `${PUBLIC_URL_BASE}/${filename}`;
    } catch (error: any) {
      console.error("Upload failed:", error);
      throw new Error(`Upload Error: ${error.message || JSON.stringify(error)}`);
    }
  }

  async function submitEntry() {
    if (!validate()) return;

    try {
      setLoading(true);
      
      let uploadedMediaUrl = null;
      if (mediaUri) {
        uploadedMediaUrl = await uploadFile(mediaUri, mediaMimeType);
      }

      // Auto-generate date for today
      const todayDate = new Date().toISOString().split('T')[0];

      const { error } = await supabase.from('daily_entries').insert({
        user_id: session.user.id,
        name: name,
        description: description,
        entry_date: todayDate, // Auto-set date
        media_url: uploadedMediaUrl,
        media_type: mediaType,
      });

      if (error) throw error;

      Alert.alert('Success', 'Entry saved successfully!');
      // Reset form
      setName('');
      setDescription('');
      setMediaUri(null);
      setMediaType(null);
      setErrors({});
      if (onSuccess) onSuccess();

    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Journal Entry</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, errors.name ? styles.inputError : null]}
          placeholder="e.g. Morning Meditation"
          placeholderTextColor="#A0A0A0"
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (errors.name) setErrors({...errors, name: undefined});
          }}
        />
        {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Media (Optional)</Text>
        <View style={styles.mediaButtons}>
          <TouchableOpacity style={styles.mediaBtn} onPress={pickImage}>
            <Text style={styles.mediaBtnText}>📷 Add Image</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mediaBtn} onPress={pickAudio}>
            <Text style={styles.mediaBtnText}>🎙️ Add Audio</Text>
          </TouchableOpacity>
        </View>
        
        {mediaUri && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewText}>
              Selected: {mediaType === 'image' ? 'Image' : 'Audio'} file
            </Text>
            {mediaType === 'image' && (
              <Image source={{ uri: mediaUri }} style={styles.imagePreview} />
            )}
            <TouchableOpacity 
              onPress={() => { setMediaUri(null); setMediaType(null); }}
              style={styles.removeMediaBtn}
            >
              <Text style={styles.removeMediaText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="What did you do today?"
          placeholderTextColor="#A0A0A0"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity 
        style={styles.submitButton} 
        onPress={submitEntry}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>
            {loading ? 'Uploading...' : 'Save Entry'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  textArea: {
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  mediaBtn: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mediaBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  previewContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 5,
  },
  imagePreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
    resizeMode: 'cover',
  },
  removeMediaBtn: {
    alignSelf: 'flex-end',
  },
  removeMediaText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
  },
});
