import { Search } from "lucide-react-native/icons";
import { TextInput, View } from "react-native";
import { useThemeColors } from "@/store/theme-store";

interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
}

/**
 * Themed search bar with icon. Reusable across screens.
 */
export function SearchBar({
    value,
    onChangeText,
    placeholder = "Buscar...",
}: SearchBarProps) {
    const colors = useThemeColors();
    return (
        <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.surfaceContainerHigh,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                }}
            >
                <Search size={20} color={colors.onSurfaceVariant} />
                <TextInput
                    style={{
                        marginLeft: 8,
                        fontFamily: "Inter",
                        fontSize: 15,
                        color: colors.onSurface,
                        flex: 1,
                        backgroundColor: "transparent",
                        borderWidth: 0,
                        padding: 0,
                    }}
                    placeholder={placeholder}
                    placeholderTextColor={colors.onSurfaceVariant}
                    value={value}
                    onChangeText={onChangeText}
                />
            </View>
        </View>
    );
}
