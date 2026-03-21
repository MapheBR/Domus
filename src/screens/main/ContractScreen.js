import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Header from "../../components/Header";
import { Colors, Spacing } from "../../theme/colors";

/**
 * Tela reservada para contrato digital (fluxo ainda não integrado).
 * Evita import quebrado e mantém navegação futura funcional.
 */
export default function ContractScreen({ onBack }) {
  return (
    <View style={styles.container}>
      <Header
        title="Contrato"
        subtitle="Em breve"
        showBack={!!onBack}
        onBack={onBack}
      />
      <View style={styles.body}>
        <Text style={styles.text}>
          A geração e assinatura de contratos digitais serão habilitadas em uma
          atualização futura do aplicativo.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  body: { padding: Spacing.lg },
  text: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
