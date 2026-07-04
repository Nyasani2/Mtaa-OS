# NESTED SCROLLVIEW FIX GUIDE
# Apply these changes to your existing screens

## Rule: NEVER put ScrollView inside ScrollView

### Pattern 1: Replace inner ScrollView with View
BEFORE:
  <ScrollView>
    <ScrollView horizontal>  <-- REMOVE THIS
      ...content
    </ScrollView>
  </ScrollView>

AFTER:
  <ScrollView>
    <View>  <-- USE VIEW
      ...content
    </View>
  </ScrollView>

### Pattern 2: Use FlatList instead of ScrollView for lists
BEFORE:
  <ScrollView>
    {items.map(item => <Card key={item.id} />)}
  </ScrollView>

AFTER:
  <FlatList
    data={items}
    renderItem={({ item }) => <Card />}
    keyExtractor={item => item.id}
  />

### Pattern 3: Horizontal scroll inside vertical scroll
BEFORE:
  <ScrollView>
    <ScrollView horizontal>
      ...
    </ScrollView>
  </ScrollView>

AFTER:
  <ScrollView>
    <FlatList
      horizontal
      data={...}
      renderItem={...}
      showsHorizontalScrollIndicator={false}
    />
  </ScrollView>

### Pattern 4: Disable scroll on inner container
BEFORE:
  <ScrollView>
    <ScrollView>  <-- CONFLICT
      ...
    </ScrollView>
  </ScrollView>

AFTER:
  <ScrollView>
    <View>
      ...
    </View>
  </ScrollView>

## Quick fixes for common screens:

1. app/(os)/health/index.tsx - Already fixed in this ZIP
2. app/(os)/profile/index.tsx - Already fixed (uses FlatList)
3. app/(education)/assignments/index.tsx - Replace inner ScrollView with View
4. app/(education)/attendance/index.tsx - Replace inner ScrollView with View
5. app/(education)/fees/index.tsx - Replace inner ScrollView with View
6. app/(os)/wallet/index.tsx - Already fixed (uses FlatList)
7. app/(os)/messages/index.tsx - Already fixed (uses FlatList)
8. app/(commerce)/marketplace/index.tsx - Already fixed (uses FlatList)
9. app/(work)/jobs/index.tsx - Already fixed (uses FlatList)
10. app/(education)/courses/index.tsx - Already fixed (uses FlatList)
