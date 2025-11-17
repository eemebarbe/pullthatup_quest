import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Clipboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  subscribeToRoomUsers,
  leaveRoom,
} from '../services/firebase';

export default function RoomScreen({ route, navigation }) {
  const { roomId, userId, username } = route.params;
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Subscribe to room users
    const unsubscribe = subscribeToRoomUsers(roomId, (updatedUsers) => {
      setUsers(updatedUsers);
    });

    // Cleanup on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      // Leave room when component unmounts
      leaveRoom(roomId, userId).catch(console.error);
    };
  }, [roomId, userId]);

  const handleCopyRoomId = () => {
    Clipboard.setString(roomId);
    Alert.alert('Copied!', `Room ID ${roomId} copied to clipboard`);
  };

  const handleLeaveRoom = () => {
    Alert.alert(
      'Leave Room',
      'Are you sure you want to leave this room?',
      [
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
      ]
    );
  };

  const renderUser = ({ item }) => (
    <View style={styles.userItem}>
      <View style={styles.userAvatar}>
        <Text style={styles.userAvatarText}>
          {item.username?.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        {item.id === userId && (
          <Text style={styles.youLabel}>(You)</Text>
        )}
      </View>
      <View style={[styles.statusDot, item.online && styles.statusDotOnline]} />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Room ID Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.roomIdContainer}
          onPress={handleCopyRoomId}
        >
          <Text style={styles.roomIdLabel}>Room ID</Text>
          <Text style={styles.roomIdText}>{roomId}</Text>
          <Text style={styles.tapToCopy}>Tap to copy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveRoom}>
          <Text style={styles.leaveButtonText}>Leave</Text>
        </TouchableOpacity>
      </View>

      {/* Users List */}
      <View style={styles.usersSection}>
        <Text style={styles.sectionTitle}>
          Users in Room ({users.length})
        </Text>

        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.usersList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No users in the room yet
              </Text>
            </View>
          }
        />
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        <Text style={styles.welcomeText}>Welcome to the room!</Text>
        <Text style={styles.infoText}>
          Share the room ID with others to invite them
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  roomIdContainer: {
    flex: 1,
  },
  roomIdLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  roomIdText: {
    fontSize: 24,
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
  usersSection: {
    backgroundColor: '#2a2a2a',
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    padding: 16,
    backgroundColor: '#333',
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
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});
