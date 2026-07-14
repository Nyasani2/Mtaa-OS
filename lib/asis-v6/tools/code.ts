export interface CodeSnippet {
  language: string;
  code: string;
  description: string;
}

export class CodeTool {
  generateCode(description: string, language: string = 'typescript'): CodeSnippet {
    const desc = description.toLowerCase();
    let code = '';

    if (desc.includes('hook')) {
      code = `import { useState, useEffect } from 'react';

export function useCustomHook() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data here
    setLoading(false);
  }, []);

  return { data, loading };
}`;
    } else if (desc.includes('component')) {
      code = `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function MyComponent() {
  return (
    <View style={styles.container}>
      <Text>Hello World</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 }
});`;
    } else if (desc.includes('sql') || desc.includes('table')) {
      code = `CREATE TABLE example (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`;
    } else {
      code = `// ${description}
function solution() {
  // TODO: Implement
  return null;
}`;
    }

    return { language, code, description };
  }
}

export const codeTool = new CodeTool();
