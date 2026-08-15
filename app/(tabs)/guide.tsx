import { StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '../../src/theme';

export default function GuideScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rehber</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center' },
  title: { color: colors.text, fontSize: typography.heading, fontWeight: '700' },
});
