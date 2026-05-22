import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CertificateCardProps {
  certificate: {
    id: string;
    certificateNumber: string;
    productName: string;
    status: string;
    issuedAt: string;
    expiryDate?: string;
  };
}

const CertificateCard: React.FC<CertificateCardProps> = ({ certificate }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.number}>#{certificate.certificateNumber}</Text>
      <Text style={styles.product}>{certificate.productName}</Text>
      <Text style={[styles.status, { color: certificate.status === 'approved' ? '#22c55e' : '#ef4444' }]}>
        {certificate.status.toUpperCase()}
      </Text>
      <Text style={styles.date}>Issued: {new Date(certificate.issuedAt).toLocaleDateString()}</Text>
      {certificate.expiryDate && (
        <Text style={styles.date}>Expires: {new Date(certificate.expiryDate).toLocaleDateString()}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  number: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },
  product: {
    fontSize: 16,
    color: '#333',
    marginTop: 4,
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  date: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

export default CertificateCard;
