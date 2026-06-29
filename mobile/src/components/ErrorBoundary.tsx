import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; error: string | null; }

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.error}</Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={styles.btnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#f4f6f9' },
  title:     { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 12, textAlign: 'center' },
  message:   { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 32 },
  btn:       { backgroundColor: '#1a73e8', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 10 },
  btnText:   { color: '#fff', fontWeight: '700', fontSize: 15 },
});
