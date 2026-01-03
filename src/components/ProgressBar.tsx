import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarProps {
    date: string;
    count: number;
    max: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ date, count, max }) => {
    const percentage = max > 0 ? (count / max) * 100 : 0;
    const dateObj = new Date(date);
    const dayName = dateObj.toLocaleDateString("fr-FR", { weekday: "short" });

    return (
        <View key={date} style={styles.progressBarContainer}>
            <View style={styles.progressBarLabel}>
                <Text style={styles.progressBarDay}>{dayName}</Text>
                <Text style={styles.progressBarCount}>{count}</Text>
            </View>
            <View style={styles.progressBar}>
                <View
                    style={[
                        styles.progressBarFill,
                        { width: `${percentage}%`, backgroundColor: "#6366f1" },
                    ]}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    progressBarContainer: {
        marginBottom: 15,
    },
    progressBarLabel: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 5,
    },
    progressBarDay: {
        fontSize: 12,
        color: "rgba(255, 255, 255, 0.8)",
        fontWeight: "600",
    },
    progressBarCount: {
        fontSize: 12,
        color: "#FFFFFF",
        fontWeight: "bold",
    },
    progressBar: {
        height: 8,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        borderRadius: 4,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        borderRadius: 4,
    },
});
