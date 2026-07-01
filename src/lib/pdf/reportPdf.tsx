import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Register a standard system serif/sans font for compatibility, but styled elegantly
Font.register({
  family: 'Helvetica-Bold',
  src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1nND9-Y8XvR9kG_4p4_p4.ttf' // Fallback to system font loader
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#FAF8F5',
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#2F2927'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2px solid #8D5342',
    paddingBottom: 15,
    marginBottom: 20
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4C2E2A',
    letterSpacing: 1
  },
  brandSubtitle: {
    fontSize: 8,
    textTransform: 'uppercase',
    color: '#A79C95',
    marginTop: 2,
    letterSpacing: 2
  },
  reportMeta: {
    textAlign: 'right'
  },
  reportTitle: {
    fontSize: 14,
    color: '#D18A55',
    fontWeight: 'bold'
  },
  reportSubtitle: {
    fontSize: 9,
    color: '#6B625E',
    marginTop: 2
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderColor: '#E7DED5',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 10
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomColor: '#E7DED5',
    borderBottomWidth: 1,
    minHeight: 28,
    alignItems: 'center'
  },
  tableHeader: {
    backgroundColor: '#F1E6DE',
    fontWeight: 'bold',
    color: '#6B433D'
  },
  col1: { width: '15%', paddingLeft: 8, paddingRight: 0, textAlign: 'left' as const },
  col2: { width: '20%', paddingLeft: 8, paddingRight: 0, textAlign: 'left' as const },
  col3: { width: '35%', paddingLeft: 8, paddingRight: 0, textAlign: 'left' as const },
  col4: { width: '15%', paddingLeft: 0, paddingRight: 8, textAlign: 'right' as const },
  col5: { width: '15%', paddingLeft: 0, paddingRight: 8, textAlign: 'right' as const },
  colSingleAmount: { width: '30%', paddingLeft: 0, paddingRight: 8, textAlign: 'right' as const },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '1px solid #E7DED5',
    paddingTop: 10,
    color: '#A79C95',
    fontSize: 8
  }
});

interface ReportPDFProps {
  title: string;
  subtitle: string;
  headers: string[];
  rows: any[];
  isDoubleEntryBook?: boolean;
}

export function ReportDocument({ title, subtitle, headers, rows, isDoubleEntryBook = true }: ReportPDFProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Brand Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandTitle}>PEHENAVA</Text>
            <Text style={styles.brandSubtitle}>Jaipur Ethnic Luxury</Text>
          </View>
          <View style={styles.reportMeta}>
            <Text style={styles.reportTitle}>{title}</Text>
            <Text style={styles.reportSubtitle}>{subtitle}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            {headers.map((h, i) => {
              let colStyle: any = styles.col3;
              if (i === 0) colStyle = styles.col1;
              if (i === 1) colStyle = styles.col2;
              if (isDoubleEntryBook) {
                if (i === 3 || i === 4 || i === 5) colStyle = styles.col4;
              } else {
                if (i === 3) colStyle = styles.colSingleAmount;
              }
              return <Text key={h} style={colStyle}>{h}</Text>;
            })}
          </View>

          {/* Table Body */}
          {rows.map((row, index) => (
            <View key={index} style={styles.tableRow}>
              {row.map((val: any, i: number) => {
                let colStyle: any = styles.col3;
                if (i === 0) colStyle = styles.col1;
                if (i === 1) colStyle = styles.col2;
                if (isDoubleEntryBook) {
                  if (i === 3 || i === 4 || i === 5) colStyle = styles.col4;
                } else {
                  if (i === 3) colStyle = styles.colSingleAmount;
                }

                // Format numbers
                const renderedVal = typeof val === 'number' ? formatCurrency(val) : val;

                return <Text key={i} style={colStyle}>{renderedVal}</Text>;
              })}
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Pehenava ERP — Confidential Financial Statement</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
        </View>
      </Page>
    </Document>
  );
}
