import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  initializeFirebase,
  createRoom,
  roomExists,
  joinRoom,
} from '../services/firebase';
import { getUserId, getUsername } from '../utils/userId';
import { isValidRoomId } from '../utils/roomId';

export default function HomeScreen({ navigation }) {
  const [joinRoomId, setJoinRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [username, setCurrentUsername] = useState('');

  useEffect(() => {
    // Initialize Firebase on mount
    try {
      initializeFirebase();
    } catch (error) {
      Alert.alert('Error', 'Failed to initialize Firebase. Please check your configuration.');
      console.error(error);
    }

    // Load username
    getUsername().then(setCurrentUsername);
  }, []);

  const handleCreateRoom = async () => {
    setLoading(true);
    try {
      const { roomId, userId, username } = await createRoom();

      // Navigate to room screen
      navigation.navigate('Room', {
        roomId,
        userId,
        username,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to create room. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    const roomId = joinRoomId.trim().toUpperCase();

    if (!roomId) {
      Alert.alert('Invalid Room ID', 'Please enter a room ID');
      return;
    }

    if (!isValidRoomId(roomId)) {
      Alert.alert('Invalid Room ID', 'Room ID must be 6 characters');
      return;
    }

    setLoading(true);
    try {
      // Check if room exists
      const exists = await roomExists(roomId);

      if (!exists) {
        Alert.alert('Room Not Found', 'This room does not exist');
        setLoading(false);
        return;
      }

      // Get user data and join
      const userId = await getUserId();
      const username = await getUsername();

      await joinRoom(roomId, userId, username);

      // Navigate to room screen
      navigation.navigate('Room', {
        roomId,
        userId,
        username,
      });

      setJoinRoomId('');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to join room');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.title}>Pull That Up</Text>
        <Text style={styles.subtitle}>Quest Edition</Text>
        {username && (
          <Text style={styles.usernameText}>Playing as: {username}</Text>
        )}
      </View>

      <View style={styles.content}>
        {/* Create Room Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Create a New Room</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateRoom}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.createButtonText}>Create Room</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.helperText}>
            Create a room and share the code with friends
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Join Room Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Join a Room</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 6-character room ID"
            placeholderTextColor="#666"
            value={joinRoomId}
            onChangeText={setJoinRoomId}
            autoCapitalize="characters"
            maxLength={6}
            editable={!loading}
          />
          <TouchableOpacity
            style={[
              styles.joinButton,
              (!joinRoomId.trim() || loading) && styles.buttonDisabled,
            ]}
            onPress={handleJoinRoom}
            disabled={!joinRoomId.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.joinButtonText}>Join Room</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Built for Meta Quest with Expo & Firebase
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#4CAF50',
    marginBottom: 16,
  },
  usernameText: {
    fontSize: 14,
    color: '#888',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#3a3a3a',
  },
  dividerText: {
    color: '#666',
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 18,
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 4,
  },
  joinButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
});
