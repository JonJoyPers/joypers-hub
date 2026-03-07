import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Search, Mail, Phone } from "lucide-react-native";
import { COLORS } from "../../theme/colors";
import Avatar from "../../components/Avatar";
import { RoleBadge } from "../../components/Badge";
import { supabase, isSupabaseConfigured } from "../../services/supabase";
import EmptyState from "../../components/EmptyState";

// Mock directory data for fallback
const MOCK_EMPLOYEES = [
  { id: "1", name: "Sarah Johnson", role: "admin", department: "Operations", title: "Store Director", email: "sarah@joypersshoes.com" },
  { id: "2", name: "Marcus Chen", role: "manager", department: "Sales", title: "Floor Manager", email: "marcus@joypersshoes.com" },
  { id: "3", name: "Aisha Williams", role: "manager", department: "Inventory", title: "Inventory Lead", email: "aisha@joypersshoes.com" },
  { id: "4", name: "Jordan Rivera", role: "employee", department: "Sales", title: "Sales Associate", email: "jordan@joypersshoes.com" },
  { id: "5", name: "Taylor Kim", role: "employee", department: "Sales", title: "Sales Associate", email: "taylor@joypersshoes.com" },
  { id: "6", name: "Casey Brown", role: "employee", department: "Stock", title: "Stock Associate", email: "casey@joypersshoes.com" },
];

export default function DirectoryScreen() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    if (!isSupabaseConfigured()) {
      setEmployees(MOCK_EMPLOYEES);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("employees")
      .select("id, name, role, department, title, email, avatar_url")
      .eq("is_active", true)
      .order("name");

    if (!error && data) {
      setEmployees(data.map((e) => ({ ...e, avatarUrl: e.avatar_url })));
    }
    setLoading(false);
  };

  const filtered = search
    ? employees.filter(
        (e) =>
          e.name?.toLowerCase().includes(search.toLowerCase()) ||
          e.department?.toLowerCase().includes(search.toLowerCase()) ||
          e.title?.toLowerCase().includes(search.toLowerCase())
      )
    : employees;

  const renderEmployee = ({ item }) => (
    <View style={styles.row}>
      <Avatar name={item.name} uri={item.avatarUrl} size="lg" role={item.role} />
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text style={styles.rowName}>{item.name}</Text>
          <RoleBadge role={item.role} />
        </View>
        {item.title ? <Text style={styles.rowTitle}>{item.title}</Text> : null}
        {item.department ? (
          <Text style={styles.rowDept}>{item.department}</Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      {/* Search */}
      <View style={styles.searchRow}>
        <Search size={16} color={COLORS.creamMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, title, or department..."
          placeholderTextColor={COLORS.creamMuted + "60"}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderEmployee}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState title="No employees found" subtitle="Try a different search term" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.charcoal },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    marginVertical: 12,
    backgroundColor: COLORS.charcoalMid,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.charcoalLight,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.cream,
  },
  listContent: { paddingBottom: 40 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.charcoalLight + "60",
  },
  rowContent: { flex: 1, gap: 2 },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowName: { fontSize: 15, fontWeight: "700", color: COLORS.cream },
  rowTitle: { fontSize: 13, color: COLORS.creamMuted, fontWeight: "600" },
  rowDept: { fontSize: 11, color: COLORS.creamMuted },
});
