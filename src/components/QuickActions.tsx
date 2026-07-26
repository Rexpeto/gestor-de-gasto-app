import { View } from "react-native";
import { ArrowDownLeft, CreditCard as CreditCardIcon } from "lucide-react-native/icons";

import { Action } from "@/components/Action";
import { AnimatedSection } from "@/components/AnimatedSection";

interface QuickActionsProps {
    onIncomePress: () => void;
    onExpensePress: () => void;
}

export function QuickActions({ onIncomePress, onExpensePress }: QuickActionsProps) {
    return (
        <View
            style={{
                flexDirection: "row",
                gap: 12,
                paddingHorizontal: 20,
                marginTop: 20,
            }}
        >
            <AnimatedSection delay={200} duration={500} style={{ flex: 1 }}>
                <Action
                    icon={ArrowDownLeft}
                    label="Ingreso"
                    onPress={onIncomePress}
                />
            </AnimatedSection>

            <AnimatedSection delay={300} duration={500} style={{ flex: 1 }}>
                <Action
                    icon={CreditCardIcon}
                    label="Gasto"
                    color="#ce93d8"
                    onPress={onExpensePress}
                />
            </AnimatedSection>
        </View>
    );
}
