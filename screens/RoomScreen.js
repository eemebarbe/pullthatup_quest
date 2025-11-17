import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import {
  subscribeToRoomUsers,
  subscribeToConversation,
  addConversationSegment,
  leaveRoom,
} from '../services/firebase';
import {
  requestAudioPermissions,
  initializeAudioMode,
  startRecording,
  stopRecording,
  prepareAudioForWhisper,
} from '../services/audioRecording';
import { transcribeAudio } from '../services/whisper';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 768;
const RECORDING_INTERVAL = 10000; // 10 seconds

export default function RoomScreen({ route, navigation }) {
  const { roomId, userId, username } = route.params;
  const [users, setUsers] = useState([]);
  const [conversation, setConversation] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const recordingIntervalRef = useRef(null);
  const currentRecordingStart = useRef(null);

  // Request audio permissions on mount
  useEffect(() => {
    async function setupAudio() {
      try {
        const granted = await requestAudioPermissions();
        setHasPermission(granted);

        if (granted) {
          await initializeAudioMode();
          console.log('Audio setup complete');
        } else {
          const msg = 'Microphone permission is required for speech-to-text';
          Platform.OS === 'web' ? alert(msg) : Alert.alert('Permission Required', msg);
        }
      } catch (error) {
        console.error('Error setting up audio:', error);
      }
    }

    setupAudio();
  }, []);

  // Subscribe to room users and conversation
  useEffect(() => {
    const unsubscribeUsers = subscribeToRoomUsers(roomId, setUsers);
    const unsubscribeConversation = subscribeToConversation(roomId, setConversation);

    return () => {
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubscribeConversation) unsubscribeConversation();
      leaveRoom(roomId, userId).catch(console.error);
    };
  }, [roomId, userId]);

  // Handle recording cycle
  const handleRecordingCycle = async () => {
    try {
      console.log('Starting recording cycle...');
      const startTime = Date.now();
      currentRecordingStart.current = startTime;

      // Start recording
      await startRecording();

      // Stop and process after interval
      setTimeout(async () => {
        try {
          setIsProcessing(true);
          const recordingResult = await stopRecording();

          if (recordingResult && recordingResult.uri) {
            console.log('Processing recording:', recordingResult.uri);

            // Prepare audio for Whisper
            const { uri, mimeType } = await prepareAudioForWhisper(recordingResult.uri);

            // Transcribe with Whisper
            const transcribedText = await transcribeAudio(uri, mimeType);

            if (transcribedText && transcribedText.trim()) {
              console.log('Transcribed:', transcribedText);

              // Add to Firebase
              await addConversationSegment(
                roomId,
                userId,
                username,
                transcribedText,
                startTime
              );
            } else {
              console.log('No speech detected in segment');
            }
          }
        } catch (error) {
          console.error('Error processing recording:', error);
        } finally {
          setIsProcessing(false);
        }
      }, RECORDING_INTERVAL + 100);
    } catch (error) {
      console.error('Error in recording cycle:', error);
      setIsProcessing(false);
    }
  };

  // Start/stop recording
  const toggleRecording = async () => {
    if (!hasPermission) {
      const msg = 'Microphone permission is required';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Permission Required', msg);
      return;
    }

    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    } else {
      // Start recording
      setIsRecording(true);

      // Immediate first recording
      await handleRecordingCycle();

      // Set up interval for continuous recording
      recordingIntervalRef.current = setInterval(() => {
        handleRecordingCycle();
      }, RECORDING_INTERVAL);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const handleCopyRoomId = async () => {
    try {
      await Clipboard.setStringAsync(roomId);
      const msg = `Room ID ${roomId} copied to clipboard!`;
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Copied!', msg);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleLeaveRoom = () => {
    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to leave this room?')) {
        leaveRoom(roomId, userId)
          .then(() => navigation.goBack())
          .catch(console.error);
      }
    } else {
      Alert.alert('Leave Room', 'Are you sure you want to leave this room?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            leaveRoom(roomId, userId)
              .then(() => navigation.goBack())
              .catch(console.error);
          },
        },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.roomIdContainer} onPress={handleCopyRoomId}>
          <Text style={styles.roomIdLabel}>Room ID</Text>
          <Text style={styles.roomIdText}>{roomId}</Text>
          <Text style={styles.tapToCopy}>
            {Platform.OS === 'web' ? 'Click to copy' : 'Tap to copy'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveRoom}>
          <Text style={styles.leaveButtonText}>Leave</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Recording Controls */}
        <View style={styles.recordingSection}>
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordButtonActive,
              !hasPermission && styles.recordButtonDisabled,
            ]}
            onPress={toggleRecording}
            disabled={!hasPermission}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <View style={[styles.recordDot, isRecording && styles.recordDotActive]} />
                <Text style={styles.recordButtonText}>
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {isRecording && (
            <Text style={styles.recordingStatus}>
              Recording • 10s segments{isProcessing ? ' • Processing...' : ''}
            </Text>
          )}

          {!hasPermission && (
            <Text style={styles.permissionWarning}>
              Microphone permission required
            </Text>
          )}
        </View>

        {/* Conversation */}
        <View style={styles.conversationSection}>
          <Text style={styles.sectionTitle}>Conversation</Text>

          {conversation.length > 0 ? (
            <View style={styles.conversationList}>
              {conversation.map((segment) => (
                <View key={segment.id} style={styles.conversationSegment}>
                  <View style={styles.segmentHeader}>
                    <Text style={styles.segmentUser}>
                      {segment.username}
                      {segment.userId === userId && (
                        <Text style={styles.youLabel}> (You)</Text>
                      )}
                    </Text>
                    <Text style={styles.segmentTime}>
                      {new Date(segment.startTimestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                  <Text style={styles.segmentText}>{segment.text}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No conversation yet. Start recording to begin transcription.
              </Text>
            </View>
          )}
        </View>

        {/* Users List */}
        <View style={styles.usersSection}>
          <Text style={styles.sectionTitle}>Users in Room ({users.length})</Text>

          {users.length > 0 ? (
            <View style={styles.usersList}>
              {users.map((item) => (
                <View key={item.id} style={styles.userItem}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {item.username?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.username}>{item.username}</Text>
                    {item.id === userId && <Text style={styles.youLabel}>(You)</Text>}
                  </View>
                  <View style={[styles.statusDot, item.online && styles.statusDotOnline]} />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No users in the room yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isSmallScreen ? 'stretch' : 'center',
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 40 : 60,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
    gap: isSmallScreen ? 12 : 0,
  },
  roomIdContainer: {
    flex: isSmallScreen ? 0 : 1,
    alignItems: isSmallScreen ? 'center' : 'flex-start',
  },
  roomIdLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  roomIdText: {
    fontSize: Math.min(width * 0.06, 24),
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  tapToCopy: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  leaveButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  leaveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  recordingSection: {
    backgroundColor: '#2a2a2a',
    margin: 20,
    marginHorizontal: Platform.OS === 'web' ? 'auto' : 20,
    maxWidth: Platform.OS === 'web' ? 800 : '100%',
    width: Platform.OS === 'web' ? '90%' : 'auto',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  recordButtonActive: {
    backgroundColor: '#f44336',
  },
  recordButtonDisabled: {
    opacity: 0.5,
  },
  recordDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  recordDotActive: {
    backgroundColor: '#fff',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  recordingStatus: {
    color: '#4CAF50',
    fontSize: 14,
    marginTop: 12,
  },
  permissionWarning: {
    color: '#ff9800',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  conversationSection: {
    backgroundColor: '#2a2a2a',
    margin: 20,
    marginTop: 0,
    marginHorizontal: Platform.OS === 'web' ? 'auto' : 20,
    maxWidth: Platform.OS === 'web' ? 800 : '100%',
    width: Platform.OS === 'web' ? '90%' : 'auto',
    borderRadius: 12,
    overflow: 'hidden',
  },
  conversationList: {
    padding: 12,
  },
  conversationSegment: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  segmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  segmentUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  segmentTime: {
    fontSize: 12,
    color: '#888',
  },
  segmentText: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 22,
  },
  usersSection: {
    backgroundColor: '#2a2a2a',
    margin: 20,
    marginTop: 0,
    marginHorizontal: Platform.OS === 'web' ? 'auto' : 20,
    maxWidth: Platform.OS === 'web' ? 800 : '100%',
    width: Platform.OS === 'web' ? '90%' : 'auto',
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    padding: 16,
    backgroundColor: '#333',
    textAlign: 'center',
  },
  usersList: {
    padding: 12,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  youLabel: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#666',
  },
  statusDotOnline: {
    backgroundColor: '#4CAF50',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
});
