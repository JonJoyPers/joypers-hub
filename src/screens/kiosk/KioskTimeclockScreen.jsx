import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  LogIn,
  LogOut,
  Coffee,
  Utensils,
  Delete,
  ArrowLeft,
} from "lucide-react-native";
import { COLORS } from "../../theme/colors";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import { useTimeclockStore } from "../../store/timeclockStore";
import { useScheduleStore } from "../../store/scheduleStore";

const AUTO_RETURN_MS = 30000;

const SHIFT_TYPE_COLORS = {
  opening: COLORS.green,
  mid: COLORS.teal,
  closing: COLORS.violet,
  inventory: COLORS.amber,
  "part-time": COLORS.creamMuted,
};

function formatTime(time24) {
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export default function KioskTimeclockScreen() {
  const [pin, setPin] = useState("");
  const [identifiedUser, setIdentifiedUser] = useState(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [now, setNow] = useState(new Date());
  const timeoutRef = useRef(null);

  const loginWithPin = useAuthStore((s) => s.loginWithPin);
  const setKioskMode = useAppStore((s) => s.setKioskMode);
  const {
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    startLunch,
    endLunch,
    currentStatus,
    getTodayHours,
  } = useTimeclockStore();
  const getShiftsForDate = useScheduleStore((s) => s.getShiftsForDate);

  // Clock tick
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-return timeout
  const returnToPinPad = useCallback(() => {
    setIdentifiedUser(null);
    setPin("");
  }, []);

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (identifiedUser) {
      timeoutRef.current = setTimeout(returnToPinPad, AUTO_RETURN_MS);
    }
  }, [identifiedUser, returnToPinPad]);

  useEffect(() => {
    resetTimeout();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [identifiedUser, resetTimeout]);

  // PIN pad handlers
  const handleDigit = async (digit) => {
    if (pin.length >= 4 || pinLoading) return;
    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === 4) {
      setPinLoading(true);
      try {
        // Race the login against a 10-second timeout
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timed out")), 10000)
        );
        const user = await Promise.race([
          loginWithPin(newPin),
          timeoutPromise,
        ]);
        if (user) {
          setIdentifiedUser(user);
        } else {
          Alert.alert("PIN Not Recognized", "Please try again.");
          setPin("");
        }
      } catch (e) {
        console.warn("Kiosk PIN error:", e);
        Alert.alert("Error", e.message || "Something went wrong. Please try again.");
        setPin("");
      } finally {
        setPinLoading(false);
      }
    }
  };

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1));
  };

  // Action handler
  const handleAction = (action) => {
    if (!identifiedUser) return;
    resetTimeout();

    const userId = identifiedUser.id;
    const labels = {
      clockIn: "Clock In",
      clockOut: "Clock Out",
      startBreak: "Start Break",
      endBreak: "End Break",
      startLunch: "Start Lunch",
      endLunch: "End Lunch",
    };

    if (action === "clockIn") clockIn(userId);
    else if (action === "clockOut") clockOut(userId);
    else if (action === "startBreak") startBreak(userId);
    else if (action === "endBreak") endBreak(userId);
    else if (action === "startLunch") startLunch(userId);
    else if (action === "endLunch") endLunch(userId);

    Alert.alert(
      "Confirmed",
      `${identifiedUser.firstName}: ${labels[action]} at ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`,
      [{ text: "OK", onPress: returnToPinPad }]
    );
  };

  // Today's schedule for identified user
  const todayStr = now.toISOString().split("T")[0];
  const todayShifts = identifiedUser
    ? getShiftsForDate(todayStr).filter((s) => s.userId === identifiedUser.id)
    : [];
  const todayShift = todayShifts[0] || null;

  const status = identifiedUser ? currentStatus(identifiedUser.id) : null;
  const todayHours = identifiedUser ? getTodayHours(identifiedUser.id) : 0;

  // ─── PIN PAD VIEW ───
  if (!identifiedUser) {
    return (
      <View style={styles.root}>
        <View style={styles.kioskHeader}>
          <TouchableOpacity
            style={styles.exitKioskBtn}
            onPress={() => setKioskMode(false)}
          >
            <ArrowLeft size={20} color={COLORS.creamMuted} strokeWidth={2} />
            <Text style={styles.exitKioskText}>Exit Kiosk</Text>
          </TouchableOpacity>
          <View style={styles.clockDisplay}>
            <Text style={styles.clockTime}>
              {now.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </Text>
            <Text style={styles.clockDate}>
              {now.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>
        </View>

        <View style={styles.pinContainer}>
          <Text style={styles.pinTitle}>ENTER YOUR PIN</Text>
          <View style={styles.pinDots}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[styles.pinDot, i < pin.length && styles.pinDotFilled]}
              />
            ))}
          </View>

          {pinLoading && (
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <ActivityIndicator size="large" color={COLORS.teal} />
              <Text style={{ color: COLORS.creamMuted, fontSize: 12, marginTop: 8 }}>Verifying PIN...</Text>
            </View>
          )}

          <View style={styles.numGrid}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <TouchableOpacity
                key={n}
                style={styles.numBtn}
                onPress={() => handleDigit(String(n))}
                activeOpacity={0.6}
              >
                <Text style={styles.numBtnText}>{n}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.numBtn}
              onPress={handleDelete}
              activeOpacity={0.6}
            >
              <Delete size={28} color={COLORS.creamMuted} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.numBtn}
              onPress={() => handleDigit("0")}
              activeOpacity={0.6}
            >
              <Text style={styles.numBtnText}>0</Text>
            </TouchableOpacity>
            <View style={styles.numBtnPlaceholder} />
          </View>
        </View>

        <Text style={styles.brandFooter}>JOY-PER'S HUB</Text>
      </View>
    );
  }

  // ─── ACTION VIEW ───
  const statusColor =
    status === "clocked_in"
      ? COLORS.green
      : status === "on_break"
        ? COLORS.amber
        : status === "on_lunch"
          ? COLORS.violet
          : COLORS.creamMuted;

  const statusLabel =
    status === "clocked_in"
      ? "CLOCKED IN"
      : status === "on_break"
        ? "ON BREAK"
        : status === "on_lunch"
          ? "ON LUNCH"
          : "CLOCKED OUT";

  return (
    <View style={styles.root}>
      <View style={styles.kioskHeader}>
        <TouchableOpacity
          style={styles.exitKioskBtn}
          onPress={returnToPinPad}
        >
          <ArrowLeft size={20} color={COLORS.creamMuted} strokeWidth={2} />
          <Text style={styles.exitKioskText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.clockDisplay}>
          <Text style={styles.clockTime}>
            {now.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </Text>
        </View>
      </View>

      <View style={styles.actionContainer}>
        {/* User Info Card */}
        <View style={[styles.kioskUserCard, { borderLeftColor: statusColor }]}>
          <View style={styles.kioskUserRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kioskUserName}>{identifiedUser.name}</Text>
              <Text style={styles.kioskUserTitle}>
                {identifiedUser.title} — {identifiedUser.department}
              </Text>
            </View>
            <View style={styles.kioskStatusBadge}>
              <View
                style={[styles.kioskStatusDot, { backgroundColor: statusColor }]}
              />
              <Text style={[styles.kioskStatusText, { color: statusColor }]}>
                {statusLabel}
              </Text>
            </View>
          </View>

          {/* Schedule Info */}
          {todayShift ? (
            <View style={styles.kioskScheduleRow}>
              <Text style={styles.kioskScheduleLabel}>SCHEDULED:</Text>
              <Text style={styles.kioskScheduleTime}>
                {formatTime(todayShift.startTime)} –{" "}
                {formatTime(todayShift.endTime)}
              </Text>
              <View
                style={[
                  styles.kioskTypePill,
                  {
                    backgroundColor:
                      (SHIFT_TYPE_COLORS[todayShift.type] || COLORS.creamMuted) +
                      "25",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.kioskTypePillText,
                    {
                      color:
                        SHIFT_TYPE_COLORS[todayShift.type] || COLORS.creamMuted,
                    },
                  ]}
                >
                  {todayShift.type.toUpperCase()}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.kioskNoShift}>No shift scheduled today</Text>
          )}

          <Text style={styles.kioskHours}>Today: {todayHours}h worked</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.kioskActions}>
          {status === "clocked_out" && (
            <TouchableOpacity
              style={[styles.kioskActionBtn, { backgroundColor: COLORS.green }]}
              onPress={() => handleAction("clockIn")}
              activeOpacity={0.7}
            >
              <LogIn size={36} color={COLORS.charcoal} strokeWidth={2.5} />
              <Text style={styles.kioskActionBtnText}>CLOCK IN</Text>
            </TouchableOpacity>
          )}
          {status === "clocked_in" && (
            <>
              <TouchableOpacity
                style={[
                  styles.kioskActionBtn,
                  { backgroundColor: COLORS.amber },
                ]}
                onPress={() => handleAction("startBreak")}
                activeOpacity={0.7}
              >
                <Coffee size={32} color={COLORS.charcoal} strokeWidth={2.5} />
                <Text style={styles.kioskActionBtnText}>BREAK</Text>
                <Text style={styles.kioskActionSubtext}>(Paid)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.kioskActionBtn,
                  { backgroundColor: COLORS.violet },
                ]}
                onPress={() => handleAction("startLunch")}
                activeOpacity={0.7}
              >
                <Utensils size={32} color={COLORS.charcoal} strokeWidth={2.5} />
                <Text style={styles.kioskActionBtnText}>LUNCH</Text>
                <Text style={styles.kioskActionSubtext}>(Unpaid)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.kioskActionBtn,
                  { backgroundColor: COLORS.red },
                ]}
                onPress={() => handleAction("clockOut")}
                activeOpacity={0.7}
              >
                <LogOut size={36} color={COLORS.cream} strokeWidth={2.5} />
                <Text
                  style={[styles.kioskActionBtnText, { color: COLORS.cream }]}
                >
                  CLOCK OUT
                </Text>
              </TouchableOpacity>
            </>
          )}
          {status === "on_break" && (
            <TouchableOpacity
              style={[styles.kioskActionBtn, { backgroundColor: COLORS.green }]}
              onPress={() => handleAction("endBreak")}
              activeOpacity={0.7}
            >
              <LogIn size={36} color={COLORS.charcoal} strokeWidth={2.5} />
              <Text style={styles.kioskActionBtnText}>END BREAK</Text>
            </TouchableOpacity>
          )}
          {status === "on_lunch" && (
            <TouchableOpacity
              style={[styles.kioskActionBtn, { backgroundColor: COLORS.green }]}
              onPress={() => handleAction("endLunch")}
              activeOpacity={0.7}
            >
              <Utensils size={32} color={COLORS.charcoal} strokeWidth={2.5} />
              <Text style={styles.kioskActionBtnText}>END LUNCH</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.charcoal,
  },

  // Header
  kioskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.charcoalMid,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.charcoalLight,
  },
  exitKioskBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: COLORS.charcoalLight,
  },
  exitKioskText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.creamMuted,
  },
  clockDisplay: { alignItems: "flex-end" },
  clockTime: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.cream,
    letterSpacing: -0.5,
  },
  clockDate: {
    fontSize: 12,
    color: COLORS.creamMuted,
    fontWeight: "500",
  },

  // PIN Pad
  pinContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 40,
  },
  pinTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.teal,
    letterSpacing: 3,
    marginBottom: 24,
  },
  pinDots: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 40,
  },
  pinDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.creamMuted,
  },
  pinDotFilled: {
    backgroundColor: COLORS.teal,
    borderColor: COLORS.teal,
  },
  numGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 300,
    justifyContent: "center",
    gap: 12,
  },
  numBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.charcoalMid,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.charcoalLight,
  },
  numBtnText: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.cream,
  },
  numBtnPlaceholder: {
    width: 80,
    height: 80,
  },
  brandFooter: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.charcoalLight,
    letterSpacing: 3,
    paddingBottom: 24,
  },

  // Action Container
  actionContainer: {
    flex: 1,
    padding: 24,
    gap: 24,
    justifyContent: "center",
  },

  // User Card
  kioskUserCard: {
    backgroundColor: COLORS.charcoalMid,
    borderRadius: 20,
    padding: 24,
    borderLeftWidth: 5,
    gap: 12,
  },
  kioskUserRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  kioskUserName: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.cream,
  },
  kioskUserTitle: {
    fontSize: 14,
    color: COLORS.creamMuted,
    fontWeight: "500",
    marginTop: 2,
  },
  kioskStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  kioskStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  kioskStatusText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
  },

  // Schedule row
  kioskScheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 4,
  },
  kioskScheduleLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.creamMuted,
    letterSpacing: 1,
  },
  kioskScheduleTime: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.cream,
  },
  kioskTypePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  kioskTypePillText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  kioskNoShift: {
    fontSize: 13,
    color: COLORS.creamMuted,
    fontStyle: "italic",
  },
  kioskHours: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.teal,
  },

  // Action Buttons
  kioskActions: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  kioskActionBtn: {
    width: 180,
    height: 140,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  kioskActionBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.charcoal,
    letterSpacing: 1.5,
  },
  kioskActionSubtext: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.charcoal,
    opacity: 0.7,
  },
});
