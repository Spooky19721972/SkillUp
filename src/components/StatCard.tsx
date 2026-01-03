import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get("window");

interface StatCardProps {
    title: string;
    value: number;
    icon: string;
    color: string;
    onPress?: () => void;
    additionalInfo?: string;
    trend?: 'up' | 'down' | 'neutral';
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon,
    color,
    onPress,
    additionalInfo,
    trend
}) => {
    const CardComponent = onPress ? TouchableOpacity : View;

    return (
        <CardComponent
            style={[styles.statCard, { borderLeftColor: color }]}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            <Text style={styles.statIcon}>{icon}</Text>
            <View style={styles.statValueContainer}>
                <Text style={styles.statValue}>{value}</Text>
                {trend && (
                    <Text style={styles.trendIndicator}>
                        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                    </Text>
                )}
            </View>
            <Text style={styles.statTitle}>{title}</Text>
            {additionalInfo && (
                <Text style={styles.statAdditionalInfo}>{additionalInfo}</Text>
            )}
            {onPress && (
                <Text style={styles.statAction}>Voir détails →</Text>
            )}
        </CardComponent>
    );
};

const styles = StyleSheet.create({
    statCard: {
        width: (width - 60) / 2,
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        borderRadius: 15,
        padding: 20,
        marginBottom: 15,
        borderLeftWidth: 4,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.2)",
    },
    statIcon: {
        fontSize: 32,
        marginBottom: 10,
    },
    statValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    statValue: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#FFFFFF",
        marginBottom: 5,
    },
    trendIndicator: {
        fontSize: 20,
        color: '#FFFFFF',
        marginLeft: 8,
    },
    statTitle: {
        fontSize: 14,
        color: "rgba(255, 255, 255, 0.8)",
    },
    statAdditionalInfo: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 4,
    },
    statAction: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 8,
        fontWeight: '600',
    },
});
